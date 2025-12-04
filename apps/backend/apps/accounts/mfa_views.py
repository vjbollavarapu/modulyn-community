"""
Multi-Factor Authentication (MFA) views for TOTP.
"""
import pyotp
import qrcode
import io
import base64
import secrets
import hashlib
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings
from django_ratelimit.decorators import ratelimit

from .models import User, TOTPDevice, BackupCode
from .serializers import (
    TOTPSetupSerializer, TOTPVerifySerializer, TOTPEnableSerializer,
    TOTPDisableSerializer, MFAVerifySerializer
)


class TOTPSetupView(APIView):
    """Initiate TOTP setup for MFA."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Generate TOTP secret and QR code."""
        user = request.user
        
        # Check if MFA is already enabled
        if hasattr(user, 'totp_device') and user.totp_device.is_enabled:
            return Response(
                {'error': 'MFA is already enabled. Disable it first to set up a new device.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate secret
        secret = pyotp.random_base32()
        
        # Create or update TOTP device
        totp_device, created = TOTPDevice.objects.get_or_create(
            user=user,
            defaults={'secret': secret}
        )
        
        if not created:
            totp_device.secret = secret
            totp_device.is_verified = False
            totp_device.is_enabled = False
            totp_device.save()
        
        # Generate provisioning URI
        issuer_name = getattr(settings, 'MFA_ISSUER_NAME', 'Modulyn ERP')
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name=issuer_name
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Encode QR code as base64
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return Response({
            'secret': secret,  # For manual entry
            'qr_code': f'data:image/png;base64,{qr_code_base64}',
            'provisioning_uri': provisioning_uri,
            'message': 'Scan the QR code with your authenticator app, then verify with a token.'
        })


class TOTPVerifyView(APIView):
    """Verify TOTP token during setup."""
    permission_classes = [permissions.IsAuthenticated]
    
    @ratelimit(key='user', rate='10/m', method='POST', block=True)
    def post(self, request):
        """Verify TOTP token to complete setup."""
        serializer = TOTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        token = serializer.validated_data['token']
        
        try:
            totp_device = user.totp_device
        except TOTPDevice.DoesNotExist:
            return Response(
                {'error': 'TOTP device not found. Please set up MFA first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify token
        totp = pyotp.TOTP(totp_device.secret)
        if not totp.verify(token, valid_window=1):
            return Response(
                {'error': 'Invalid TOTP token. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark as verified
        totp_device.is_verified = True
        totp_device.save()
        
        return Response({
            'message': 'TOTP verified successfully. You can now enable MFA.'
        })


class TOTPEnableView(APIView):
    """Enable TOTP MFA after verification."""
    permission_classes = [permissions.IsAuthenticated]
    
    @ratelimit(key='user', rate='5/m', method='POST', block=True)
    def post(self, request):
        """Enable MFA after final verification."""
        serializer = TOTPEnableSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        token = serializer.validated_data['token']
        
        try:
            totp_device = user.totp_device
        except TOTPDevice.DoesNotExist:
            return Response(
                {'error': 'TOTP device not found. Please set up MFA first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not totp_device.is_verified:
            return Response(
                {'error': 'TOTP device not verified. Please verify first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify token one more time
        totp = pyotp.TOTP(totp_device.secret)
        if not totp.verify(token, valid_window=1):
            return Response(
                {'error': 'Invalid TOTP token. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Enable MFA
        totp_device.is_enabled = True
        totp_device.last_used = timezone.now()
        totp_device.save()
        
        # Generate backup codes if not already generated
        if not totp_device.backup_codes_generated:
            backup_codes = self.generate_backup_codes(user)
            totp_device.backup_codes_generated = True
            totp_device.save()
            
            return Response({
                'message': 'MFA enabled successfully.',
                'backup_codes': backup_codes,
                'warning': 'Save these backup codes in a secure location. They will not be shown again.'
            })
        
        return Response({
            'message': 'MFA enabled successfully.'
        })
    
    def generate_backup_codes(self, user, count=10):
        """Generate backup codes for MFA recovery."""
        codes = []
        for _ in range(count):
            # Generate 8-digit code
            code = ''.join(secrets.choice('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') for _ in range(8))
            # Hash and store
            hashed_code = hashlib.sha256(code.encode()).hexdigest()
            BackupCode.objects.create(user=user, code=hashed_code)
            codes.append(code)
        return codes


class TOTPDisableView(APIView):
    """Disable TOTP MFA."""
    permission_classes = [permissions.IsAuthenticated]
    
    @ratelimit(key='user', rate='5/m', method='POST', block=True)
    def post(self, request):
        """Disable MFA after password verification."""
        serializer = TOTPDisableSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        try:
            totp_device = user.totp_device
        except TOTPDevice.DoesNotExist:
            return Response(
                {'error': 'MFA is not enabled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Disable MFA
        totp_device.is_enabled = False
        totp_device.is_verified = False
        totp_device.save()
        
        # Delete backup codes
        BackupCode.objects.filter(user=user, is_used=False).delete()
        
        return Response({
            'message': 'MFA disabled successfully.'
        })


class MFAStatusView(APIView):
    """Get MFA status for current user."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Return MFA status."""
        user = request.user
        
        try:
            totp_device = user.totp_device
            return Response({
                'mfa_enabled': totp_device.is_enabled,
                'mfa_verified': totp_device.is_verified,
                'backup_codes_count': BackupCode.objects.filter(user=user, is_used=False).count(),
                'last_used': totp_device.last_used.isoformat() if totp_device.last_used else None
            })
        except TOTPDevice.DoesNotExist:
            return Response({
                'mfa_enabled': False,
                'mfa_verified': False,
                'backup_codes_count': 0,
                'last_used': None
            })


class MFAVerifyView(APIView):
    """Verify MFA token during login."""
    permission_classes = [permissions.AllowAny]
    
    @ratelimit(key='ip', rate='10/m', method='POST', block=True)
    def post(self, request):
        """Verify MFA token or backup code after initial login."""
        serializer = MFAVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        token = serializer.validated_data.get('token')
        backup_code = serializer.validated_data.get('backup_code')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid user.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            totp_device = user.totp_device
        except TOTPDevice.DoesNotExist:
            return Response(
                {'error': 'MFA is not enabled for this user.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not totp_device.is_enabled:
            return Response(
                {'error': 'MFA is not enabled for this user.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify TOTP token
        if token:
            totp = pyotp.TOTP(totp_device.secret)
            if not totp.verify(token, valid_window=1):
                return Response(
                    {'error': 'Invalid TOTP token.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            totp_device.last_used = timezone.now()
            totp_device.save()
        
        # Verify backup code
        elif backup_code:
            hashed_code = hashlib.sha256(backup_code.encode()).hexdigest()
            try:
                backup_code_obj = BackupCode.objects.get(user=user, code=hashed_code, is_used=False)
                backup_code_obj.is_used = True
                backup_code_obj.used_at = timezone.now()
                backup_code_obj.save()
            except BackupCode.DoesNotExist:
                return Response(
                    {'error': 'Invalid backup code.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Generate JWT tokens after successful MFA verification
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        return Response({
            'access': str(access),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            },
            'message': 'MFA verified successfully.'
        })


class BackupCodesView(APIView):
    """Regenerate backup codes."""
    permission_classes = [permissions.IsAuthenticated]
    
    @ratelimit(key='user', rate='3/h', method='POST', block=True)
    def post(self, request):
        """Regenerate backup codes (invalidates old ones)."""
        user = request.user
        
        try:
            totp_device = user.totp_device
        except TOTPDevice.DoesNotExist:
            return Response(
                {'error': 'MFA is not set up.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not totp_device.is_enabled:
            return Response(
                {'error': 'MFA is not enabled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete old unused backup codes
        BackupCode.objects.filter(user=user, is_used=False).delete()
        
        # Generate new backup codes
        codes = []
        for _ in range(10):
            code = ''.join(secrets.choice('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') for _ in range(8))
            hashed_code = hashlib.sha256(code.encode()).hexdigest()
            BackupCode.objects.create(user=user, code=hashed_code)
            codes.append(code)
        
        totp_device.backup_codes_generated = True
        totp_device.save()
        
        return Response({
            'backup_codes': codes,
            'warning': 'Save these backup codes in a secure location. They will not be shown again.'
        })

