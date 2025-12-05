# Staging Infrastructure Setup Guide

**Date**: 2025-01-27  
**Purpose**: Guide for setting up staging environment infrastructure

---

## 📋 Overview

This document provides step-by-step instructions for setting up a staging environment for Modulyn ERP, including Docker configuration, deployment automation, and infrastructure requirements.

---

## 🏗️ Infrastructure Requirements

### **Minimum Requirements**
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Network**: 100 Mbps

### **Recommended Requirements**
- **CPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 100GB SSD
- **Network**: 1 Gbps

### **Services Required**
- PostgreSQL 15+
- Redis 7+
- Nginx (reverse proxy)
- Docker & Docker Compose
- SSL Certificate (Let's Encrypt)

---

## 🐳 Docker Configuration

### **1. Docker Compose for Staging**

Create `docker-compose.staging.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: modulyn_staging
      POSTGRES_USER: modulyn
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U modulyn"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    environment:
      - DJANGO_SETTINGS_MODULE=backend.settings.staging
      - DATABASE_URL=postgresql://modulyn:${DB_PASSWORD}@db:5432/modulyn_staging
      - REDIS_URL=redis://redis:6379/1
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=False
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
    volumes:
      - ./apps/backend:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 4"

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    environment:
      - VITE_API_URL=${API_URL}
    volumes:
      - ./apps/frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/staging.conf:/etc/nginx/nginx.conf
      - static_volume:/static
      - media_volume:/media
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
  static_volume:
  media_volume:
```

### **2. Nginx Configuration**

Create `nginx/staging.conf`:

```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name staging.modulyn.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.modulyn.com;

    ssl_certificate /etc/letsencrypt/live/staging.modulyn.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.modulyn.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Static files
    location /static/ {
        alias /static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /media/;
        expires 7d;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🚀 Deployment Process

### **1. Initial Setup**

```bash
# Clone repository
git clone https://github.com/your-org/modulyn-community.git
cd modulyn-community

# Create environment file
cp .env.example .env.staging
# Edit .env.staging with staging values

# Build and start services
docker-compose -f docker-compose.staging.yml up -d --build

# Run migrations
docker-compose -f docker-compose.staging.yml exec backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.staging.yml exec backend python manage.py createsuperuser

# Collect static files
docker-compose -f docker-compose.staging.yml exec backend python manage.py collectstatic --noinput
```

### **2. SSL Certificate Setup**

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d staging.modulyn.com

# Auto-renewal (cron job)
sudo certbot renew --dry-run
```

### **3. Automated Deployment**

#### **GitHub Actions Workflow**

Update `.github/workflows/staging-deploy.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push images
        run: |
          docker build -t ghcr.io/${{ github.repository }}/backend:staging ./apps/backend
          docker build -t ghcr.io/${{ github.repository }}/frontend:staging ./apps/frontend
          docker push ghcr.io/${{ github.repository }}/backend:staging
          docker push ghcr.io/${{ github.repository }}/frontend:staging
      
      - name: Deploy to staging server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/modulyn-community
            git pull origin develop
            docker-compose -f docker-compose.staging.yml pull
            docker-compose -f docker-compose.staging.yml up -d
            docker-compose -f docker-compose.staging.yml exec backend python manage.py migrate
            docker-compose -f docker-compose.staging.yml exec backend python manage.py collectstatic --noinput
```

---

## 🔧 Environment Configuration

### **Staging Settings**

Create `apps/backend/backend/settings/staging.py`:

```python
from .base import *

DEBUG = False
ALLOWED_HOSTS = ['staging.modulyn.com', 'staging-api.modulyn.com']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='modulyn_staging'),
        'USER': config('DB_USER', default='modulyn'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='db'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Email (use staging email service)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/modulyn/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

---

## 📊 Monitoring & Health Checks

### **Health Check Endpoint**

Already implemented at `/health/`:
- Database connectivity
- Redis connectivity
- Overall system status

### **Monitoring Setup**

```bash
# Add to docker-compose.staging.yml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
```

---

## ✅ Staging Infrastructure Checklist

### **Setup**
- [ ] Server provisioned
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Domain configured
- [ ] SSL certificate obtained
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] Services running

### **Deployment**
- [ ] CI/CD pipeline configured
- [ ] Automated deployment working
- [ ] Rollback procedure tested
- [ ] Health checks passing
- [ ] Monitoring configured

### **Security**
- [ ] Firewall configured
- [ ] SSH key authentication
- [ ] SSL/TLS enabled
- [ ] Security headers configured
- [ ] Access logs enabled

### **Documentation**
- [ ] Deployment guide created
- [ ] Environment variables documented
- [ ] Troubleshooting guide created
- [ ] Access credentials secured

---

## 🚨 Troubleshooting

### **Common Issues**

1. **Services not starting**:
   ```bash
   docker-compose -f docker-compose.staging.yml logs
   docker-compose -f docker-compose.staging.yml ps
   ```

2. **Database connection errors**:
   ```bash
   docker-compose -f docker-compose.staging.yml exec db psql -U modulyn -d modulyn_staging
   ```

3. **Static files not loading**:
   ```bash
   docker-compose -f docker-compose.staging.yml exec backend python manage.py collectstatic --noinput
   ```

---

## 📚 Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Last Updated**: 2025-01-27  
**Status**: ⚠️ **IN PROGRESS** - Staging infrastructure guide created, setup needs to be performed

