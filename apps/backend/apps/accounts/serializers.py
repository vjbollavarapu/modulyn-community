"""
User and authentication serializers.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserProfile, UserSession, PasswordResetToken, EmailVerificationToken, TOTPDevice, BackupCode


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user model."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'avatar', 'timezone', 'language', 'is_verified',
            'wallet_address', 'wallet_verified',
            'date_joined', 'last_login', 'profile'
        ]
        read_only_fields = [
            'id', 'date_joined', 'last_login', 'is_verified',
            'wallet_verified'
        ]

    def get_profile(self, obj):
        """Get user profile data."""
        try:
            profile = obj.profile
            return UserProfileSerializer(profile).data
        except UserProfile.DoesNotExist:
            return None


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    
    class Meta:
        model = UserProfile
        fields = [
            'bio', 'company', 'job_title', 'department', 'location',
            'website', 'linkedin', 'twitter', 'github',
            'email_notifications', 'sms_notifications', 'push_notifications',
            'marketing_emails', 'profile_visibility'
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'password',
            'password_confirm', 'phone', 'timezone', 'language'
        ]

    def validate(self, attrs):
        """Validate registration data."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    def create(self, validated_data):
        """Create new user."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Validate login credentials."""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password.')


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        """Validate old password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
    
    def validate(self, attrs):
        """Validate password change data."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists."""
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('No user found with this email address.')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()
    
    def validate_token(self, value):
        """Validate reset token."""
        try:
            token_obj = PasswordResetToken.objects.get(token=value)
            if not token_obj.is_valid():
                raise serializers.ValidationError('Invalid or expired token.')
            self.token_obj = token_obj
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Invalid token.')
        return value
    
    def validate(self, attrs):
        """Validate password reset data."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification."""
    token = serializers.CharField()
    
    def validate_token(self, value):
        """Validate verification token."""
        try:
            token_obj = EmailVerificationToken.objects.get(token=value)
            if not token_obj.is_valid():
                raise serializers.ValidationError('Invalid or expired token.')
            self.token_obj = token_obj
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError('Invalid token.')
        return value


class TOTPSetupSerializer(serializers.Serializer):
    """Serializer for TOTP setup initiation."""
    pass  # No input required, just generates secret


class TOTPVerifySerializer(serializers.Serializer):
    """Serializer for TOTP verification during setup."""
    token = serializers.CharField(min_length=6, max_length=6)
    
    def validate_token(self, value):
        """Validate TOTP token format."""
        if not value.isdigit():
            raise serializers.ValidationError('TOTP token must be numeric.')
        return value


class TOTPEnableSerializer(serializers.Serializer):
    """Serializer for enabling TOTP after verification."""
    token = serializers.CharField(min_length=6, max_length=6)
    
    def validate_token(self, value):
        """Validate TOTP token format."""
        if not value.isdigit():
            raise serializers.ValidationError('TOTP token must be numeric.')
        return value


class TOTPDisableSerializer(serializers.Serializer):
    """Serializer for disabling TOTP."""
    password = serializers.CharField(write_only=True)
    
    def validate_password(self, value):
        """Validate user password before disabling MFA."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Invalid password.')
        return value


class MFAVerifySerializer(serializers.Serializer):
    """Serializer for MFA verification during login."""
    email = serializers.EmailField()
    token = serializers.CharField(min_length=6, max_length=6, required=False)
    backup_code = serializers.CharField(required=False)
    
    def validate(self, attrs):
        """Validate that either token or backup_code is provided."""
        token = attrs.get('token')
        backup_code = attrs.get('backup_code')
        
        if not token and not backup_code:
            raise serializers.ValidationError('Either token or backup_code must be provided.')
        if token and backup_code:
            raise serializers.ValidationError('Provide either token or backup_code, not both.')
        return attrs
    
    def validate_token(self, value):
        """Validate TOTP token format."""
        if value and not value.isdigit():
            raise serializers.ValidationError('TOTP token must be numeric.')
        return value
    token = serializers.CharField()
    
    def validate_token(self, value):
        """Validate verification token."""
        try:
            token_obj = EmailVerificationToken.objects.get(token=value)
            if not token_obj.is_valid():
                raise serializers.ValidationError('Invalid or expired token.')
            self.token_obj = token_obj
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError('Invalid token.')
        return value


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for user sessions."""
    user_agent_short = serializers.CharField(source='get_user_agent_short', read_only=True)
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'ip_address', 'user_agent', 'user_agent_short',
            'is_active', 'last_activity', 'expires_at', 'created'
        ]
        read_only_fields = ['id', 'created']
