"""
Rate Limiting Configuration for Modulyn ERP

This module defines rate limiting settings for different API endpoints.
Target: 1000 requests/hour per user for general API endpoints.
"""

# Rate limiting configuration
RATELIMIT_ENABLE = True

# Default rate limits
RATELIMIT_DEFAULT = '1000/h'  # 1000 requests per hour per user

# Rate limits by endpoint type
RATELIMIT_ENDPOINTS = {
    # Authentication endpoints - stricter limits
    'auth': {
        'login': '10/h',  # 10 login attempts per hour per IP
        'password_reset': '5/h',  # 5 password reset requests per hour per IP
        'register': '5/h',  # 5 registrations per hour per IP
    },
    # API endpoints - standard limits
    'api': {
        'default': '1000/h',  # 1000 requests per hour per user
        'read': '2000/h',  # 2000 read requests per hour per user
        'write': '500/h',  # 500 write requests per hour per user
    },
    # Health check - very permissive
    'health': {
        'check': '100/h',  # 100 health checks per hour per IP
    },
    # Admin endpoints - moderate limits
    'admin': {
        'default': '500/h',  # 500 requests per hour per user
    },
}

# Rate limit storage backend (uses cache by default)
RATELIMIT_USE_CACHE = 'default'  # Use default cache backend (Redis)

# Rate limit key functions
def get_user_key(group, request):
    """Get rate limit key based on authenticated user."""
    if request.user.is_authenticated:
        return f"ratelimit:{group}:user:{request.user.id}"
    return None

def get_ip_key(group, request):
    """Get rate limit key based on IP address."""
    from django_ratelimit.core import get_ip
    ip = get_ip(request)
    return f"ratelimit:{group}:ip:{ip}"

def get_user_or_ip_key(group, request):
    """Get rate limit key based on user if authenticated, otherwise IP."""
    if request.user.is_authenticated:
        return get_user_key(group, request)
    return get_ip_key(group, request)

