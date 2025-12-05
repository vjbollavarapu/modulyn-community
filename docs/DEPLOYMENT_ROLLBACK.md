# Deployment and Rollback Procedures

## Overview

This document describes the deployment and rollback procedures for the Modulyn ERP platform.

## Deployment Environments

### Development
- **Branch**: `dev` or `develop`
- **Purpose**: Development and testing
- **Deployment**: Automatic on push to dev branch

### Staging
- **Branch**: `dev` or `develop` (tagged releases)
- **Purpose**: Pre-production testing
- **Deployment**: Automatic via GitHub Actions workflow
- **URL**: `https://staging.modulyn.com` (example)

### Production
- **Branch**: `main`
- **Purpose**: Live production environment
- **Deployment**: Manual approval required
- **URL**: `https://app.modulyn.com` (example)

## Deployment Process

### Staging Deployment

1. **Automatic Deployment**:
   - Triggered on push to `dev` or `develop` branches
   - GitHub Actions workflow: `.github/workflows/staging-deploy.yml`
   - Builds Docker images and pushes to container registry
   - Deploys to staging environment

2. **Manual Deployment**:
   ```bash
   # Trigger via GitHub Actions UI
   gh workflow run staging-deploy.yml
   ```

### Production Deployment

1. **Pre-deployment Checklist**:
   - [ ] All tests passing in CI
   - [ ] Code review approved
   - [ ] Staging deployment successful
   - [ ] Health checks passing
   - [ ] Database migrations tested
   - [ ] Backup created

2. **Deployment Steps**:
   ```bash
   # 1. Create release tag
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   
   # 2. Trigger production deployment
   gh workflow run deploy-production.yml
   ```

## Rollback Procedures

### Quick Rollback (Last Deployment)

1. **Identify Previous Version**:
   ```bash
   # List recent deployments
   gh run list --workflow=deploy-production.yml
   ```

2. **Rollback Steps**:
   ```bash
   # Option 1: Revert to previous Git commit
   git revert HEAD
   git push origin main
   
   # Option 2: Deploy previous Docker image
   docker pull ghcr.io/your-org/modulyn-community:previous-tag
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Database Rollback

1. **Backup Before Deployment**:
   ```bash
   # Create database backup
   pg_dump -h localhost -U postgres modulyn_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Restore Database**:
   ```bash
   # Restore from backup
   psql -h localhost -U postgres modulyn_db < backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Rollback Migrations**:
   ```bash
   # Rollback to specific migration
   python manage.py migrate app_name migration_name
   
   # Rollback all migrations for an app
   python manage.py migrate app_name zero
   ```

### Container Rollback

1. **Docker Compose**:
   ```bash
   # Stop current containers
   docker-compose -f docker-compose.prod.yml down
   
   # Start previous version
   docker-compose -f docker-compose.prod.yml up -d --no-deps backend frontend
   ```

2. **Kubernetes**:
   ```bash
   # Rollback deployment
   kubectl rollout undo deployment/backend -n modulyn
   kubectl rollout undo deployment/frontend -n modulyn
   
   # Check rollback status
   kubectl rollout status deployment/backend -n modulyn
   ```

## Health Checks

### Endpoints

- **Backend Health**: `GET /health/`
- **Backend Readiness**: `GET /health/ready/`
- **Frontend**: Check if static files are served

### Verification

```bash
# Check backend health
curl https://api.modulyn.com/health/

# Expected response
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-01-27T12:00:00Z"
}
```

## Monitoring

### Post-Deployment Monitoring

1. **Check Application Logs**:
   ```bash
   # Docker
   docker-compose -f docker-compose.prod.yml logs -f
   
   # Kubernetes
   kubectl logs -f deployment/backend -n modulyn
   ```

2. **Monitor Metrics**:
   - API response times
   - Error rates
   - Database connection pool
   - Memory and CPU usage

3. **Alert Thresholds**:
   - Error rate > 1%
   - Response time > 500ms (p95)
   - CPU usage > 80%
   - Memory usage > 85%

## Emergency Procedures

### Immediate Rollback

If critical issues are detected:

1. **Stop Traffic** (if using load balancer):
   ```bash
   # Remove from load balancer
   kubectl scale deployment/backend --replicas=0 -n modulyn
   ```

2. **Rollback Deployment**:
   ```bash
   # Quick rollback
   kubectl rollout undo deployment/backend -n modulyn
   ```

3. **Notify Team**:
   - Create incident ticket
   - Notify stakeholders
   - Document issue

### Data Recovery

If data corruption occurs:

1. **Stop Application**:
   ```bash
   docker-compose -f docker-compose.prod.yml stop
   ```

2. **Restore Database**:
   ```bash
   # Use most recent backup
   psql -h localhost -U postgres modulyn_db < latest_backup.sql
   ```

3. **Verify Data Integrity**:
   ```bash
   python manage.py check --deploy
   ```

## Best Practices

1. **Always Backup Before Deployment**:
   - Database backups
   - Configuration files
   - Environment variables

2. **Test in Staging First**:
   - Deploy to staging
   - Run smoke tests
   - Verify all features

3. **Use Feature Flags**:
   - Gradual rollout
   - Easy disable if issues

4. **Monitor Closely**:
   - Watch logs for first 30 minutes
   - Check metrics dashboard
   - Monitor error rates

5. **Document Changes**:
   - Keep deployment log
   - Document rollback reasons
   - Update runbooks

## Contact

For deployment issues:
- **On-Call Engineer**: Check PagerDuty
- **DevOps Team**: devops@modulyn.com (example)
- **Emergency**: +1-XXX-XXX-XXXX (example)

---

**Last Updated**: 2025-01-27

