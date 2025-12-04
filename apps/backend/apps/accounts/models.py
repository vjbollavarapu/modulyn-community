"""
User and authentication models.
"""
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.core.models import BaseModel

User = get_user_model()


class UserProfile(BaseModel):
    """Extended user profile information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    company = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    twitter = models.URLField(blank=True)
    github = models.URLField(blank=True)
    
    # Preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    
    # Privacy settings
    profile_visibility = models.CharField(
        max_length=20,
        choices=[
            ('public', 'Public'),
            ('private', 'Private'),
            ('organization', 'Organization Only'),
        ],
        default='organization'
    )

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.user.get_full_name()} Profile"


class UserSession(BaseModel):
    """Track user sessions for security."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    is_active = models.BooleanField(default=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
        ordering = ['-last_activity']

    def __str__(self):
        return f"{self.user.username} - {self.ip_address}"

    def is_expired(self):
        """Check if session is expired."""
        return timezone.now() > self.expires_at


class PasswordResetToken(BaseModel):
    """Password reset tokens."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=100, unique=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'

    def __str__(self):
        return f"Password reset for {self.user.email}"

    def is_expired(self):
        """Check if token is expired."""
        return timezone.now() > self.expires_at

    def is_valid(self):
        """Check if token is valid and not used."""
        return not self.is_used and not self.is_expired()


class EmailVerificationToken(BaseModel):
    """Email verification tokens."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verification_tokens')
    token = models.CharField(max_length=100, unique=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Email Verification Token'
        verbose_name_plural = 'Email Verification Tokens'

    def __str__(self):
        return f"Email verification for {self.user.email}"

    def is_expired(self):
        """Check if token is expired."""
        return timezone.now() > self.expires_at

    def is_valid(self):
        """Check if token is valid and not used."""
        return not self.is_used and not self.is_expired()


class TOTPDevice(BaseModel):
    """TOTP (Time-based One-Time Password) device for MFA."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='totp_device')
    secret = models.CharField(max_length=32)  # Base32 encoded secret
    is_enabled = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)  # Must verify before enabling
    last_used = models.DateTimeField(null=True, blank=True)
    backup_codes_generated = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'TOTP Device'
        verbose_name_plural = 'TOTP Devices'
    
    def __str__(self):
        return f"TOTP Device for {self.user.email}"


class BackupCode(BaseModel):
    """Backup codes for MFA recovery."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='backup_codes')
    code = models.CharField(max_length=20)  # Hashed backup code
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Backup Code'
        verbose_name_plural = 'Backup Codes'
        unique_together = [['user', 'code']]
    
    def __str__(self):
        return f"Backup code for {self.user.email}"
