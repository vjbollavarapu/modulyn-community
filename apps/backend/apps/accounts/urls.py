"""
Accounts URL configuration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, UserProfileViewSet, UserRegistrationView, UserLoginView,
    PasswordResetRequestView, PasswordResetConfirmView, EmailVerificationView,
    UserSessionViewSet
)
from .mfa_views import (
    TOTPSetupView, TOTPVerifyView, TOTPEnableView, TOTPDisableView,
    MFAStatusView, MFAVerifyView, BackupCodesView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'sessions', UserSessionViewSet)

urlpatterns = [
    # Authentication
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Password management
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Email verification
    path('email-verify/', EmailVerificationView.as_view(), name='email-verify'),
    
    # MFA / TOTP endpoints
    path('mfa/setup/', TOTPSetupView.as_view(), name='mfa-setup'),
    path('mfa/verify/', TOTPVerifyView.as_view(), name='mfa-verify'),
    path('mfa/enable/', TOTPEnableView.as_view(), name='mfa-enable'),
    path('mfa/disable/', TOTPDisableView.as_view(), name='mfa-disable'),
    path('mfa/status/', MFAStatusView.as_view(), name='mfa-status'),
    path('mfa/login-verify/', MFAVerifyView.as_view(), name='mfa-login-verify'),
    path('mfa/backup-codes/', BackupCodesView.as_view(), name='mfa-backup-codes'),
    
    # User management
    path('', include(router.urls)),
]
