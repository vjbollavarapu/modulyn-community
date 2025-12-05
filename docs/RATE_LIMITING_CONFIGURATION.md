# Rate Limiting Configuration

**Date**: 2025-01-27  
**Status**: ✅ **COMPLETE**  
**Requirement**: 1000 requests/hour per user for API endpoints

---

## 📋 Overview

Rate limiting has been configured to protect the API from abuse and ensure fair usage. The system uses `django-ratelimit` with Redis as the storage backend.

---

## ⚙️ Configuration

### Rate Limits by Endpoint Type

| Endpoint Type | Rate Limit | Key | Notes |
|--------------|------------|-----|-------|
| **General API** (Authenticated) | 1000/h | User ID | Per authenticated user |
| **General API** (Unauthenticated) | 100/h | IP Address | Per IP address |
| **Login** | 10/h | IP Address | Prevents brute force |
| **Password Reset** | 5/h | IP Address | Prevents abuse |
| **Registration** | 5/h | IP Address | Prevents spam |
| **Health Check** | 100/h | IP Address | Allows monitoring |

### Implementation

#### 1. Middleware-Based Rate Limiting

The `APIRateLimitMiddleware` automatically applies rate limiting to all `/api/` endpoints:

```python
# apps/backend/apps/core/middleware.py
class APIRateLimitMiddleware:
    - Authenticated users: 1000 requests/hour per user
    - Unauthenticated users: 100 requests/hour per IP
```

#### 2. Decorator-Based Rate Limiting

For specific endpoints, decorators can be used:

```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='ip', rate='10/h', method='POST')
def login_view(request):
    # Login logic
    pass
```

---

## 🔧 Setup

### 1. Dependencies

Rate limiting requires:
- `django-ratelimit==4.1.0` (already in requirements.txt)
- Redis cache backend (already configured)

### 2. Middleware Configuration

The middleware is already configured in `backend/settings/base.py`:

```python
MIDDLEWARE = [
    # ... other middleware ...
    'django_ratelimit.middleware.RatelimitMiddleware',
    'apps.core.middleware.APIRateLimitMiddleware',  # Custom API rate limiting
]
```

### 3. Cache Backend

Rate limiting uses the default cache backend (Redis):

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
    }
}
```

---

## 📊 How It Works

### Rate Limit Keys

1. **Authenticated Users**: `user:{user_id}`
   - Tracks requests per user ID
   - Allows 1000 requests per hour per user

2. **Unauthenticated Users**: `ip:{ip_address}`
   - Tracks requests per IP address
   - Allows 100 requests per hour per IP

### Rate Limit Storage

- **Storage Backend**: Redis cache
- **Key Format**: `ratelimit:api:user:{user_id}` or `ratelimit:api:ip:{ip_address}`
- **Expiration**: Automatically expires after the time window (1 hour)

### Rate Limit Response

When rate limit is exceeded, the API returns:

```json
{
    "error": "Rate limit exceeded",
    "message": "You have exceeded the maximum number of requests. Please try again later.",
    "retry_after": 3600
}
```

**HTTP Status**: `429 Too Many Requests`

---

## 🧪 Testing

### Test Rate Limiting

```bash
# Test authenticated user rate limit (1000/h)
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/v1/users/ \
     -v

# Test unauthenticated rate limit (100/h)
for i in {1..101}; do
    curl http://localhost:8000/api/v1/users/
done
# Should return 429 after 100 requests
```

### Verify Rate Limit Headers

Rate limit information can be added to response headers (optional):

```python
# In middleware, add headers:
response['X-RateLimit-Limit'] = '1000'
response['X-RateLimit-Remaining'] = remaining
response['X-RateLimit-Reset'] = reset_time
```

---

## 📝 Customization

### Adjust Rate Limits

To change rate limits, modify:

1. **Middleware** (`apps/core/middleware.py`):
   ```python
   rate = '1000/h'  # Change to desired rate
   ```

2. **Specific Endpoints** (decorator):
   ```python
   @ratelimit(key='user', rate='500/h', method='POST')
   ```

### Rate Limit Formats

- `1000/h` - 1000 requests per hour
- `100/m` - 100 requests per minute
- `10/s` - 10 requests per second
- `1000/d` - 1000 requests per day

---

## ✅ Verification

### Checklist

- [x] `django-ratelimit` installed
- [x] Middleware configured
- [x] Redis cache backend configured
- [x] API endpoints protected (1000/h per user)
- [x] Authentication endpoints protected (stricter limits)
- [x] Health check excluded from general rate limit
- [x] Error responses configured (429 status)

### Verification Commands

```bash
# Check middleware is loaded
python manage.py shell
>>> from django.conf import settings
>>> 'apps.core.middleware.APIRateLimitMiddleware' in settings.MIDDLEWARE
True

# Check rate limit is working
# Make 1001 requests as authenticated user
# Should get 429 on 1001st request
```

---

## 🚨 Troubleshooting

### Rate Limits Not Working

1. **Check Redis Connection**:
   ```bash
   python manage.py shell
   >>> from django.core.cache import cache
   >>> cache.set('test', 'value', 10)
   >>> cache.get('test')
   'value'
   ```

2. **Check Middleware Order**:
   - `APIRateLimitMiddleware` should be after `AuthenticationMiddleware`

3. **Check Cache Backend**:
   - Ensure Redis is running
   - Verify `REDIS_URL` in environment variables

### Rate Limits Too Strict

- Adjust rates in `apps/core/middleware.py`
- Or add exceptions for specific endpoints

### Rate Limits Not Applied

- Verify middleware is in `MIDDLEWARE` list
- Check that requests are going through `/api/` path
- Verify user authentication is working

---

## 📚 Resources

- [django-ratelimit Documentation](https://django-ratelimit.readthedocs.io/)
- [Redis Documentation](https://redis.io/docs/)
- [Django Cache Framework](https://docs.djangoproject.com/en/stable/topics/cache/)

---

**Last Updated**: 2025-01-27  
**Status**: ✅ **COMPLETE** - Rate limiting configured at 1000 requests/hour per user

