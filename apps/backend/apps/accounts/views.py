"""
User and authentication views.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import login, logout
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django_ratelimit.decorators import ratelimit
from datetime import timedelta
import secrets
import string

from .models import User, UserProfile, UserSession, PasswordResetToken, EmailVerificationToken
from .serializers import (
    UserSerializer, UserProfileSerializer, UserRegistrationSerializer,
    UserLoginSerializer, PasswordChangeSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, EmailVerificationSerializer, UserSessionSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset based on user permissions."""
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """Update current user profile."""
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password."""
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for user profile management."""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter queryset based on user permissions."""
        if self.request.user.is_staff:
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current user's profile."""
        try:
            profile = request.user.profile
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_my_profile(self, request):
        """Update current user's profile."""
        try:
            profile = request.user.profile
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)


class UserRegistrationView(APIView):
    """User registration endpoint."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Register a new user."""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate email verification token
            token = self.generate_token()
            EmailVerificationToken.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(hours=24)
            )
            
            # TODO: Send verification email
            
            return Response({
                'message': 'User registered successfully. Please check your email for verification.',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def generate_token(self):
        """Generate a secure random token."""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))


class UserLoginView(TokenObtainPairView):
    """User login endpoint with rate limiting and MFA support."""
    permission_classes = [permissions.AllowAny]
    
    @ratelimit(key='ip', rate='10/h', method='POST', block=True)
    def post(self, request, *args, **kwargs):
        """Login user and return JWT tokens or MFA challenge."""
        try:
            serializer = UserLoginSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data['user']
                
                # Check if MFA is enabled
                try:
                    totp_device = user.totp_device
                    if totp_device.is_enabled:
                        # Return MFA challenge instead of tokens
                        return Response({
                            'mfa_required': True,
                            'email': user.email,
                            'message': 'MFA verification required. Please provide TOTP token or backup code.'
                        }, status=status.HTTP_200_OK)
                except TOTPDevice.DoesNotExist:
                    pass  # MFA not enabled, proceed with normal login
                
                # Generate JWT tokens (MFA not enabled)
                refresh = RefreshToken.for_user(user)
                access = refresh.access_token
                
                return Response({
                    'mfa_required': False,
                    'access': str(access),
                    'refresh': str(refresh),
                    'user': UserSerializer(user).data
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def create_user_session(self, user, request):
        """Create or update user session."""
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key
        
        ip_address = self.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        UserSession.objects.update_or_create(
            session_key=session_key,
            defaults={
                'user': user,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'expires_at': timezone.now() + timedelta(days=30),
                'is_active': True
            }
        )
    
    def get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class PasswordResetRequestView(APIView):
    """Password reset request endpoint."""
    permission_classes = [permissions.AllowAny]
    
    @ratelimit(key='ip', rate='5/h', method='POST', block=True)
    def post(self, request):
        """Request password reset."""
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Generate reset token
            token = self.generate_token()
            PasswordResetToken.objects.create(
                user=user,
                token=token,
                expires_at=timezone.now() + timedelta(hours=1)
            )
            
            # Send reset email
            self.send_reset_email(user, token)
            
            return Response({
                'message': 'Password reset email sent successfully. Please check your email.'
            })
    
    def send_reset_email(self, user, token):
        """Send password reset email to user."""
        reset_url = f"{settings.FRONTEND_URL or 'http://localhost:3000'}/reset-password?token={token}"
        
        subject = 'Password Reset Request - Modulyn ERP'
        message = f"""
Hello {user.get_full_name() or user.email},

You requested a password reset for your Modulyn ERP account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
Modulyn ERP Team
        """
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Log error but don't expose it to user (security best practice)
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send password reset email: {str(e)}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def generate_token(self):
        """Generate a secure random token."""
        return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))


class PasswordResetConfirmView(APIView):
    """Password reset confirmation endpoint."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Confirm password reset."""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            token_obj = serializer.token_obj
            user = token_obj.user
            
            # Update password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Mark token as used
            token_obj.is_used = True
            token_obj.used_at = timezone.now()
            token_obj.save()
            
            return Response({
                'message': 'Password reset successfully.'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailVerificationView(APIView):
    """Email verification endpoint."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Verify email address."""
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token_obj = serializer.token_obj
            user = token_obj.user
            
            # Mark email as verified
            user.is_verified = True
            user.save()
            
            # Mark token as used
            token_obj.is_used = True
            token_obj.used_at = timezone.now()
            token_obj.save()
            
            return Response({
                'message': 'Email verified successfully.'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for user sessions."""
    queryset = UserSession.objects.all()
    serializer_class = UserSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get user's sessions."""
        return UserSession.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        """Terminate a specific session."""
        try:
            session = self.get_object()
            session.is_active = False
            session.save()
            return Response({'message': 'Session terminated successfully.'})
        except UserSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def terminate_all(self, request):
        """Terminate all user sessions except current."""
        current_session_key = request.session.session_key
        UserSession.objects.filter(
            user=request.user,
            is_active=True
        ).exclude(session_key=current_session_key).update(is_active=False)
        
        return Response({'message': 'All other sessions terminated successfully.'})
