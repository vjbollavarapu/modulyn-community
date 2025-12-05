# Health Check Endpoints

## Overview

The Modulyn ERP platform provides health check endpoints for monitoring and load balancer integration.

## Endpoints

### Backend Health Check

**Endpoint**: `GET /health/`

**Description**: System health check endpoint that verifies database and cache connectivity.

**Authentication**: Public endpoint (no authentication required)

**Rate Limiting**: 100 requests per hour per IP

**Response Format**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T12:00:00.123456Z",
  "version": "1.0.0",
  "checks": {
    "database": "ok",
    "cache": "ok"
  }
}
```

**Status Codes**:
- `200 OK`: System is healthy
- `503 Service Unavailable`: System is unhealthy (database or cache issues)

**Example Request**:
```bash
curl http://localhost:8000/health/
```

**Example Response (Healthy)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T12:00:00.123456Z",
  "version": "1.0.0",
  "checks": {
    "database": "ok",
    "cache": "ok"
  }
}
```

**Example Response (Unhealthy)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-27T12:00:00.123456Z",
  "version": "1.0.0",
  "checks": {
    "database": "error: connection refused",
    "cache": "ok"
  }
}
```

## Health Check Checks

### Database Check
- Executes `SELECT 1` query to verify database connectivity
- If database connection fails, status is set to "unhealthy"

### Cache/Redis Check
- Sets and retrieves a test value from cache
- If cache is unavailable, status is set to "degraded" (not "unhealthy")
- Cache failures are non-critical but indicate degraded performance

## Integration

### Load Balancer Configuration

**Nginx**:
```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
}

server {
    location /health/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }
}
```

**HAProxy**:
```
backend modulyn_backend
    option httpchk GET /health/
    http-check expect status 200
    server backend1 192.168.1.10:8000 check
    server backend2 192.168.1.11:8000 check
```

**Kubernetes**:
```yaml
livenessProbe:
  httpGet:
    path: /health/
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Monitoring Integration

**Prometheus**:
```yaml
scrape_configs:
  - job_name: 'modulyn-backend'
    metrics_path: '/health/'
    static_configs:
      - targets: ['backend:8000']
```

**Docker Compose Health Check**:
```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:8000/health/

# Test with authentication (not required but works)
curl -H "Authorization: Bearer <token>" http://localhost:8000/health/
```

### Automated Testing
```python
# In Django tests
def test_health_check(self):
    response = self.client.get('/health/')
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data['status'], 'healthy')
    self.assertIn('database', response.data['checks'])
    self.assertIn('cache', response.data['checks'])
```

## Status Values

- **healthy**: All checks passed, system fully operational
- **degraded**: Some non-critical checks failed (e.g., cache unavailable)
- **unhealthy**: Critical checks failed (e.g., database unavailable)

## Implementation Details

**Location**: `apps/backend/apps/core/views.py`

**URL Configuration**: `apps/backend/apps/core/urls.py`

**Features**:
- Public endpoint (no authentication required)
- Rate limited (100 requests/hour per IP)
- Checks database connectivity
- Checks cache/Redis connectivity
- Returns appropriate HTTP status codes
- Includes timestamp and version information

## Best Practices

1. **Monitor Regularly**: Set up monitoring to check health endpoint every 30-60 seconds
2. **Alert on Failures**: Configure alerts for unhealthy status
3. **Use in Load Balancers**: Configure load balancers to use health endpoint for routing
4. **Log Health Checks**: Monitor health check patterns for anomalies
5. **Version Tracking**: Include version in response for deployment tracking

## Troubleshooting

### Database Connection Issues
- Check database server is running
- Verify database credentials in settings
- Check network connectivity
- Review database logs

### Cache Connection Issues
- Check Redis server is running
- Verify Redis configuration
- Check network connectivity
- Review Redis logs

### High Response Times
- Check database query performance
- Monitor cache performance
- Review server resource usage
- Check for network latency

---

**Last Updated**: 2025-01-27

