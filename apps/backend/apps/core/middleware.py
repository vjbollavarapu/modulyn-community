"""
Rate limiting middleware for API endpoints.

Applies 1000 requests/hour per user for authenticated users,
and IP-based rate limiting for unauthenticated requests.
"""

from django_ratelimit.core import is_ratelimited
from django_ratelimit.exceptions import Ratelimited
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin


class APIRateLimitMiddleware(MiddlewareMixin):
    """
    Middleware to apply rate limiting to all API endpoints.
    
    - Authenticated users: 1000 requests/hour per user
    - Unauthenticated users: 100 requests/hour per IP
    """
    
    def process_request(self, request):
        """Check rate limits before processing request."""
        # Skip rate limiting for non-API endpoints
        if not request.path.startswith('/api/'):
            return None
        
        # Skip rate limiting for health check (already has its own limit)
        if request.path.startswith('/health/'):
            return None
        
        # Determine rate limit key
        if request.user.is_authenticated:
            # Authenticated users: 1000 requests/hour per user
            key = f"user:{request.user.id}"
            rate = '1000/h'
        else:
            # Unauthenticated users: 100 requests/hour per IP
            from django_ratelimit.core import get_ip
            ip = get_ip(request)
            key = f"ip:{ip}"
            rate = '100/h'
        
        # Check if rate limited
        if is_ratelimited(
            request,
            group='api',
            key=key,
            rate=rate,
            method=request.method,
            increment=True
        ):
            return JsonResponse(
                {
                    'error': 'Rate limit exceeded',
                    'message': 'You have exceeded the maximum number of requests. Please try again later.',
                    'retry_after': 3600  # seconds until limit resets
                },
                status=429
            )
        
        return None

