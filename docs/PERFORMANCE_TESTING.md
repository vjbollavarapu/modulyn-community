# Performance Testing Guide

**Date**: 2025-01-27  
**Purpose**: Guide for conducting performance testing across API, frontend, database, and load testing

---

## 📋 Overview

This document provides comprehensive guidance for performance testing the Modulyn ERP platform to ensure it meets performance requirements and can handle expected load.

---

## 🎯 Performance Targets

### **API Performance**
- **Response Time**: < 200ms for standard API endpoints
- **Throughput**: 1000+ requests/second
- **Error Rate**: < 0.1%
- **P95 Latency**: < 500ms
- **P99 Latency**: < 1000ms

### **Frontend Performance**
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Blocking Time (TBT)**: < 200ms

### **Database Performance**
- **Query Response Time**: < 100ms for standard queries
- **Connection Pool**: Efficient connection management
- **Index Usage**: Optimal index utilization
- **Slow Query Count**: < 1% of total queries

### **Load Testing**
- **Concurrent Users**: 1000+ simultaneous users
- **Sustained Load**: 500 users for 1 hour
- **Peak Load**: 2000 users for 10 minutes
- **Stress Test**: System behavior at 2x expected load

---

## 🛠️ Tools and Setup

### **1. API Performance Testing**

#### **Locust (Recommended)**
```bash
# Install Locust
pip install locust

# Create locustfile.py
# Run tests
locust -f locustfile.py --host=http://localhost:8000
```

#### **Example Locust Test**
```python
# locustfile.py
from locust import HttpUser, task, between

class APIUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post("/api/v1/auth/login/", json={
            "email": "test@example.com",
            "password": "password123"
        })
        self.token = response.json()["access"]
        self.client.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def get_users(self):
        self.client.get("/api/v1/users/")
    
    @task(2)
    def get_products(self):
        self.client.get("/api/v1/inventory/products/")
    
    @task(1)
    def create_invoice(self):
        self.client.post("/api/v1/ledger/invoices/", json={
            "client": 1,
            "amount": "100.00",
            "due_date": "2025-02-01"
        })
```

#### **Apache Bench (Simple)**
```bash
# Install
# macOS: brew install httpd
# Ubuntu: sudo apt-get install apache2-utils

# Run test
ab -n 1000 -c 10 -H "Authorization: Bearer <token>" \
   http://localhost:8000/api/v1/users/
```

#### **wrk (Advanced)**
```bash
# Install
# macOS: brew install wrk
# Ubuntu: sudo apt-get install wrk

# Run test
wrk -t4 -c100 -d30s -H "Authorization: Bearer <token>" \
    http://localhost:8000/api/v1/users/
```

### **2. Frontend Performance Testing**

#### **Lighthouse (Chrome DevTools)**
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run test
lighthouse http://localhost:3000 --view

# Generate report
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

#### **WebPageTest**
- Use online tool: https://www.webpagetest.org/
- Test from multiple locations
- Test on different devices

#### **Chrome DevTools Performance Tab**
1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Navigate through the app
5. Stop recording
6. Analyze performance metrics

### **3. Database Performance Testing**

#### **Django Debug Toolbar**
```python
# In settings/development.py
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

# View query performance in browser
```

#### **PostgreSQL Query Analysis**
```sql
-- Enable query logging
SET log_min_duration_statement = 100;  -- Log queries > 100ms

-- Analyze slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

#### **Django Silk (Profiling)**
```python
# Install
pip install django-silk

# Configure
INSTALLED_APPS += ['silk']
MIDDLEWARE += ['silk.middleware.SilkyMiddleware']

# Access at /silk/
```

### **4. Load Testing**

#### **Locust Load Test**
```python
# locustfile_load.py
from locust import HttpUser, task, between
from locust.contrib.fasthttp import FastHttpUser

class LoadTestUser(FastHttpUser):
    wait_time = between(1, 5)
    
    @task(10)
    def browse_products(self):
        self.client.get("/api/v1/inventory/products/")
    
    @task(5)
    def view_dashboard(self):
        self.client.get("/api/v1/analytics/dashboard/")
    
    @task(2)
    def create_record(self):
        self.client.post("/api/v1/sales/clients/", json={...})
```

Run:
```bash
locust -f locustfile_load.py --host=http://localhost:8000 \
       --users=1000 --spawn-rate=100 --run-time=1h
```

#### **k6 (Modern Load Testing)**
```javascript
// load_test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 200 },  // Ramp up to 200
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  const res = http.get('http://localhost:8000/api/v1/users/');
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
```

Run:
```bash
k6 run load_test.js
```

---

## 📊 Performance Test Scenarios

### **1. API Endpoint Tests**

#### **User Management**
- List users (pagination)
- Create user
- Update user
- Delete user
- Search users

#### **Inventory Management**
- List products (with filters)
- Create product
- Update stock levels
- Search products

#### **Sales & CRM**
- List clients
- Create invoice
- Process payment
- Generate reports

### **2. Frontend Page Tests**

#### **Dashboard**
- Load time
- Data fetching
- Chart rendering
- Real-time updates

#### **Forms**
- Form rendering
- Validation
- Submission
- Error handling

#### **Lists/Tables**
- Pagination
- Sorting
- Filtering
- Search

### **3. Database Query Tests**

#### **Common Queries**
- User authentication
- Product lookups
- Invoice generation
- Report generation

#### **Complex Queries**
- Multi-table joins
- Aggregations
- Date range queries
- Full-text search

### **4. Load Test Scenarios**

#### **Normal Load**
- 100 concurrent users
- 30 minutes duration
- Standard operations

#### **Peak Load**
- 500 concurrent users
- 10 minutes duration
- High-frequency operations

#### **Stress Test**
- 1000+ concurrent users
- Until failure point
- Identify bottlenecks

---

## 📈 Performance Metrics Collection

### **1. API Metrics**

```python
# Middleware for API metrics
import time
from django.utils.deprecation import MiddlewareMixin

class PerformanceMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = time.time()
    
    def process_response(self, request, response):
        duration = time.time() - request.start_time
        # Log or send to monitoring service
        logger.info(f"{request.path} took {duration:.3f}s")
        return response
```

### **2. Database Metrics**

```python
# Django settings
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
            'handlers': ['file'],
        },
    },
}
```

### **3. Frontend Metrics**

```javascript
// Performance monitoring
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart);
  
  // Send to analytics
  fetch('/api/analytics/performance/', {
    method: 'POST',
    body: JSON.stringify({
      fcp: getFCP(),
      lcp: getLCP(),
      tti: getTTI(),
    }),
  });
});
```

---

## 🔍 Performance Analysis

### **1. Identify Bottlenecks**

#### **API Bottlenecks**
- Slow database queries
- N+1 query problems
- Missing indexes
- Inefficient serializers
- Large response payloads

#### **Frontend Bottlenecks**
- Large bundle size
- Unoptimized images
- Too many API calls
- Inefficient re-renders
- Missing code splitting

#### **Database Bottlenecks**
- Missing indexes
- Full table scans
- Inefficient joins
- Large result sets
- Connection pool exhaustion

### **2. Optimization Strategies**

#### **API Optimization**
- Add database indexes
- Use `select_related()` and `prefetch_related()`
- Implement caching (Redis)
- Paginate large results
- Optimize serializers

#### **Frontend Optimization**
- Code splitting
- Lazy loading
- Image optimization
- Bundle size reduction
- API request batching

#### **Database Optimization**
- Add missing indexes
- Optimize queries
- Use connection pooling
- Implement read replicas
- Query result caching

---

## 📝 Performance Test Checklist

### **Pre-Testing**
- [ ] Test environment configured
- [ ] Test data prepared
- [ ] Monitoring tools set up
- [ ] Baseline metrics recorded

### **API Testing**
- [ ] Response time < 200ms
- [ ] Throughput > 1000 req/s
- [ ] Error rate < 0.1%
- [ ] P95 latency < 500ms
- [ ] Database queries optimized

### **Frontend Testing**
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] TTI < 3.5s
- [ ] CLS < 0.1
- [ ] Bundle size optimized

### **Load Testing**
- [ ] 1000+ concurrent users supported
- [ ] Sustained load handled
- [ ] Peak load handled
- [ ] Graceful degradation
- [ ] Recovery after load

### **Post-Testing**
- [ ] Results documented
- [ ] Bottlenecks identified
- [ ] Optimization plan created
- [ ] Performance report generated

---

## 📚 Resources

- [Locust Documentation](https://docs.locust.io/)
- [k6 Documentation](https://k6.io/docs/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Django Performance](https://docs.djangoproject.com/en/stable/topics/performance/)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)

---

## ✅ Performance Testing Status

- [ ] API performance tests created
- [ ] Frontend performance tests created
- [ ] Database performance analysis completed
- [ ] Load testing scenarios defined
- [ ] Performance targets met
- [ ] Optimization recommendations documented

---

**Last Updated**: 2025-01-27  
**Status**: ⚠️ **IN PROGRESS** - Performance testing guide created, tests need to be executed

