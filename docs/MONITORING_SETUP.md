# Monitoring and Logging Setup Guide

**Date**: 2025-01-27  
**Purpose**: Guide for setting up monitoring and logging (Sentry/DataDog) for Modulyn ERP

---

## 📋 Overview

This document provides comprehensive guidance for setting up monitoring and logging solutions for the Modulyn ERP platform, including error tracking (Sentry), application monitoring (DataDog), and logging infrastructure.

---

## 🎯 Monitoring Requirements

### **Metrics to Monitor**
- **Application Performance**: Response times, throughput, error rates
- **Infrastructure**: CPU, memory, disk, network
- **Database**: Query performance, connection pool, slow queries
- **Cache**: Redis hit/miss rates, memory usage
- **Business Metrics**: User activity, API usage, feature adoption

### **Alerts Required**
- **Critical**: System down, database unavailable, high error rate
- **Warning**: High response time, low cache hit rate, disk space low
- **Info**: Deployment completed, scheduled tasks executed

---

## 🔍 Sentry Setup (Error Tracking)

### **1. Backend Integration (Django)**

#### **Installation**
```bash
cd apps/backend
pip install sentry-sdk
```

#### **Configuration**

Add to `apps/backend/backend/settings/base.py`:

```python
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

if not DEBUG:
    sentry_sdk.init(
        dsn=config('SENTRY_DSN', default=''),
        integrations=[
            DjangoIntegration(
                transaction_style='url',
                middleware_spans=True,
                signals_spans=True,
            ),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,  # 10% of transactions
        send_default_pii=True,
        environment=config('ENVIRONMENT', default='production'),
        release=config('RELEASE_VERSION', default='1.0.0'),
    )
```

#### **Environment Variables**
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
ENVIRONMENT=staging
RELEASE_VERSION=1.0.0
```

### **2. Frontend Integration (React)**

#### **Installation**
```bash
cd apps/frontend
npm install @sentry/react @sentry/tracing
```

#### **Configuration**

Add to `apps/frontend/src/main.tsx`:

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new BrowserTracing({
      tracingOrigins: ["localhost", "staging.modulyn.com", /^\//],
    }),
  ],
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_RELEASE_VERSION,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.Authorization;
    }
    return event;
  },
});
```

#### **Error Boundary**

Create `apps/frontend/src/components/ErrorBoundary.tsx`:

```typescript
import * as Sentry from "@sentry/react";

export default Sentry.withErrorBoundary(
  ({ children }) => <>{children}</>,
  {
    fallback: ({ error, resetError }) => (
      <div>
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
        <button onClick={resetError}>Try again</button>
      </div>
    ),
  }
);
```

### **3. Custom Error Reporting**

```python
# apps/backend/apps/core/utils.py
import sentry_sdk

def report_error(error, context=None):
    """Report error to Sentry with context."""
    with sentry_sdk.push_scope() as scope:
        if context:
            scope.set_context("custom", context)
        sentry_sdk.capture_exception(error)
```

---

## 📊 DataDog Setup (APM & Infrastructure)

### **1. Backend Integration**

#### **Installation**
```bash
pip install ddtrace
```

#### **Configuration**

Add to `apps/backend/backend/settings/base.py`:

```python
# DataDog APM
if config('DD_ENABLED', default=False, cast=bool):
    import ddtrace
    from ddtrace import patch_all
    
    ddtrace.config.django['service_name'] = 'modulyn-backend'
    ddtrace.config.django['cache_service_name'] = 'modulyn-cache'
    ddtrace.config.django['database_service_name'] = 'modulyn-db'
    
    patch_all()
    
    # Start tracer
    ddtrace.tracer.configure(
        hostname=config('DD_AGENT_HOST', default='localhost'),
        port=config('DD_AGENT_PORT', default=8126, cast=int),
    )
```

#### **Environment Variables**
```bash
DD_ENABLED=True
DD_AGENT_HOST=datadog-agent
DD_AGENT_PORT=8126
DD_SERVICE=modulyn-backend
DD_ENV=staging
DD_VERSION=1.0.0
```

### **2. Frontend Integration**

#### **Installation**
```bash
npm install @datadog/browser-rum
```

#### **Configuration**

Add to `apps/frontend/src/main.tsx`:

```typescript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: import.meta.env.VITE_DATADOG_APP_ID,
  clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'modulyn-frontend',
  env: import.meta.env.MODE,
  version: import.meta.env.VITE_RELEASE_VERSION,
  sessionSampleRate: 100,
  sessionReplaySampleRate: 10,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
});
```

### **3. DataDog Agent (Docker)**

Add to `docker-compose.staging.yml`:

```yaml
  datadog-agent:
    image: datadog/agent:latest
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_SITE=datadoghq.com
      - DD_APM_ENABLED=true
      - DD_APM_NON_LOCAL_TRAFFIC=true
      - DD_LOGS_ENABLED=true
      - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true
      - DD_CONTAINER_EXCLUDE="name:datadog-agent"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
    ports:
      - "8126:8126"  # APM
      - "8125:8125/udp"  # StatsD
```

---

## 📝 Logging Setup

### **1. Django Logging Configuration**

Update `apps/backend/backend/settings/base.py`:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/modulyn/django.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
            'formatter': 'json',
        },
        'sentry': {
            'level': 'ERROR',
            'class': 'sentry_sdk.integrations.logging.SentryHandler',
        },
    },
    'root': {
        'handlers': ['console', 'file', 'sentry'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file', 'sentry'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

### **2. Structured Logging**

```python
# apps/backend/apps/core/utils.py
import logging
import json

logger = logging.getLogger(__name__)

def log_event(event_type, data):
    """Log structured event."""
    logger.info(json.dumps({
        'event_type': event_type,
        'timestamp': timezone.now().isoformat(),
        **data
    }))
```

### **3. Log Aggregation (ELK Stack)**

#### **Docker Compose for ELK**

```yaml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5044:5044"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

---

## 🔔 Alerting Configuration

### **1. Sentry Alerts**

Configure in Sentry dashboard:
- Error rate threshold
- New issue notifications
- Performance degradation alerts

### **2. DataDog Monitors**

Create monitors for:
- High error rate
- Slow response times
- Database connection issues
- Disk space low
- Memory usage high

### **3. Custom Alerts**

```python
# apps/backend/apps/core/monitoring.py
from django.core.mail import send_mail

def send_alert(subject, message, severity='warning'):
    """Send alert notification."""
    recipients = config('ALERT_EMAILS', default='', cast=lambda v: [s.strip() for s in v.split(',')])
    if recipients:
        send_mail(
            subject=f'[{severity.upper()}] {subject}',
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipients,
        )
```

---

## ✅ Monitoring Setup Checklist

### **Sentry**
- [ ] Backend integration configured
- [ ] Frontend integration configured
- [ ] Error boundaries added
- [ ] Custom context added
- [ ] Alerts configured

### **DataDog**
- [ ] APM enabled
- [ ] RUM enabled
- [ ] Agent deployed
- [ ] Dashboards created
- [ ] Monitors configured

### **Logging**
- [ ] Structured logging configured
- [ ] Log rotation set up
- [ ] Log aggregation configured
- [ ] Log retention policy defined

### **Alerts**
- [ ] Critical alerts configured
- [ ] Warning alerts configured
- [ ] Notification channels set up
- [ ] Alert escalation defined

---

## 📚 Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [DataDog Documentation](https://docs.datadoghq.com/)
- [Django Logging](https://docs.djangoproject.com/en/stable/topics/logging/)
- [ELK Stack](https://www.elastic.co/guide/index.html)

---

**Last Updated**: 2025-01-27  
**Status**: ⚠️ **IN PROGRESS** - Monitoring setup guide created, integration needs to be performed

