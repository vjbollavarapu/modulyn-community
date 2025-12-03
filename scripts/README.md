# Scripts Directory

This directory contains automation scripts for common development, deployment, and maintenance tasks for the Modulyn ERP platform.

## 📁 Structure

```
scripts/
├── setup/          # Environment setup scripts
├── deployment/     # Deployment automation
├── maintenance/    # Maintenance utilities
├── development/    # Development utilities
└── monitoring/     # Monitoring scripts
```

## 🚀 Quick Start

### Substrate Demo Quickstart
```bash
# Run the complete Substrate demo (one command!)
bash scripts/quickstart.sh
```

This will:
1. Start a local Substrate node using Docker
2. Build the ink! smart contract
3. Deploy the contract to the local node
4. Run the Django demo script to submit a service verification record
5. Display the transaction hash

**Prerequisites:**
- Docker installed and running
- Python 3.7+ installed
- Internet connection for downloading Docker images

### Setup Scripts
```bash
# Setup development environment
./scripts/setup/setup-dev.sh

# Setup production environment
./scripts/setup/setup-prod.sh

# Install dependencies
./scripts/setup/install-deps.sh
```

### Deployment Scripts
```bash
# Deploy to staging
./scripts/deployment/deploy-staging.sh

# Deploy to production
./scripts/deployment/deploy-prod.sh

# Rollback deployment
./scripts/deployment/rollback.sh
```

## 📋 Script Categories

### Setup Scripts (`setup/`)
- **`install-deps.sh`**: Install all project dependencies
- **`setup-db.sh`**: Database setup and migration
- **`setup-dev.sh`**: Development environment setup
- **`setup-prod.sh`**: Production environment setup

### Deployment Scripts (`deployment/`)
- **`deploy-dev.sh`**: Deploy to development environment
- **`deploy-staging.sh`**: Deploy to staging environment
- **`deploy-prod.sh`**: Deploy to production environment
- **`rollback.sh`**: Rollback to previous deployment
- **`health-check.sh`**: Post-deployment health checks

### Maintenance Scripts (`maintenance/`)
- **`backup-db.sh`**: Database backup and restore
- **`cleanup-logs.sh`**: Log cleanup and rotation
- **`update-deps.sh`**: Update project dependencies
- **`security-scan.sh`**: Security vulnerability scanning

### Development Scripts (`development/`)
- **`generate-migration.sh`**: Generate Django migrations
- **`run-tests.sh`**: Run all test suites
- **`lint-code.sh`**: Code linting and formatting
- **`format-code.sh`**: Code formatting

### Quickstart Scripts
- **`quickstart.sh`**: Complete Substrate demo setup and execution
- **`docker-compose.quickstart.yml`**: Docker Compose configuration for local Substrate node

### Monitoring Scripts (`monitoring/`)
- **`check-health.sh`**: Application health monitoring
- **`collect-metrics.sh`**: Metrics collection
- **`alert-check.sh`**: Alert checking and notification

## 🔧 Usage Examples

### Development Workflow
```bash
# Setup development environment
./scripts/setup/setup-dev.sh

# Run tests
./scripts/development/run-tests.sh

# Format code
./scripts/development/format-code.sh

# Deploy to development
./scripts/deployment/deploy-dev.sh
```

### Production Deployment
```bash
# Backup database before deployment
./scripts/maintenance/backup-db.sh

# Deploy to production
./scripts/deployment/deploy-prod.sh

# Run health checks
./scripts/deployment/health-check.sh

# Monitor deployment
./scripts/monitoring/check-health.sh
```

### Maintenance Tasks
```bash
# Update dependencies
./scripts/maintenance/update-deps.sh

# Clean up old logs
./scripts/maintenance/cleanup-logs.sh

# Run security scan
./scripts/maintenance/security-scan.sh
```

## 🛡️ Security Considerations

### Script Security
- All scripts are executable only by authorized users
- Sensitive data is handled through environment variables
- Scripts include proper error handling and logging
- Input validation is performed where necessary

### Environment Variables
```bash
# Required environment variables
export DB_HOST=localhost
export DB_NAME=Modulyn_erp
export DB_USER=Modulyn_user
export DB_PASSWORD=secure_password
export SECRET_KEY=your_secret_key
```

## 📊 Logging and Monitoring

### Log Files
- **Setup Logs**: `/var/log/Modulyn/setup.log`
- **Deployment Logs**: `/var/log/Modulyn/deployment.log`
- **Maintenance Logs**: `/var/log/Modulyn/maintenance.log`

### Monitoring Integration
- Scripts integrate with monitoring systems
- Health checks report to monitoring dashboards
- Alerts are sent for critical failures

## 🔄 Automation

### Cron Jobs
```bash
# Daily database backup
0 2 * * * /path/to/scripts/maintenance/backup-db.sh

# Weekly dependency updates
0 3 * * 0 /path/to/scripts/maintenance/update-deps.sh

# Hourly health checks
0 * * * * /path/to/scripts/monitoring/check-health.sh
```

### CI/CD Integration
- Scripts are integrated into CI/CD pipelines
- Automated testing and deployment
- Quality gates and approval processes

## 📚 Documentation

### Script Documentation
Each script includes:
- **Purpose**: What the script does
- **Usage**: How to run the script
- **Parameters**: Command-line arguments
- **Dependencies**: Required tools and services
- **Examples**: Usage examples

### Error Handling
- Proper exit codes for success/failure
- Detailed error messages
- Logging of all operations
- Rollback procedures for failed operations

## 🆘 Troubleshooting

### Common Issues
1. **Permission Denied**: Ensure scripts are executable (`chmod +x`)
2. **Missing Dependencies**: Run setup scripts first
3. **Environment Variables**: Check required environment variables
4. **Network Issues**: Verify connectivity to required services

### Debug Mode
```bash
# Run scripts in debug mode
bash -x ./scripts/setup/setup-dev.sh

# Enable verbose logging
export VERBOSE=1
./scripts/deployment/deploy-prod.sh
```

### Support
- Check script logs for detailed error information
- Review environment configuration
- Verify all dependencies are installed
- Contact DevOps team for infrastructure issues
