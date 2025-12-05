# Database Backup and Restore Procedures

**Date**: 2025-01-27  
**Purpose**: Comprehensive guide for backing up and restoring the Modulyn ERP PostgreSQL database

---

## 📋 Overview

This document provides step-by-step procedures for backing up and restoring the Modulyn ERP database. Regular backups are critical for data protection and disaster recovery.

---

## 🗄️ Database Information

### Database Details
- **Database Type**: PostgreSQL 15+
- **Database Name**: `modulyn_db` (configurable via `DATABASE_URL`)
- **Default Host**: `localhost`
- **Default Port**: `5432`
- **Connection**: Configured via `DATABASE_URL` environment variable

### Database Configuration
The database connection is configured in `apps/backend/backend/settings/base.py`:

```python
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='postgresql://user:password@localhost:5432/modulyn_db')
    )
}
```

---

## 💾 Backup Procedures

### 1. Manual Backup (pg_dump)

#### Full Database Backup
```bash
# Basic backup
pg_dump -h localhost -U postgres -d modulyn_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with custom format (recommended for large databases)
pg_dump -h localhost -U postgres -d modulyn_db -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Backup with compression
pg_dump -h localhost -U postgres -d modulyn_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup with verbose output
pg_dump -h localhost -U postgres -d modulyn_db -v -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

#### Schema-Only Backup
```bash
# Backup schema only (no data)
pg_dump -h localhost -U postgres -d modulyn_db --schema-only > schema_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup data only (no schema)
pg_dump -h localhost -U postgres -d modulyn_db --data-only > data_backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Specific Table Backup
```bash
# Backup specific tables
pg_dump -h localhost -U postgres -d modulyn_db -t apps_core_user -t apps_inventory_product > users_products_backup.sql
```

### 2. Automated Backup Script

Create `scripts/backup_database.sh`:

```bash
#!/bin/bash

# Database Backup Script for Modulyn ERP
# Usage: ./scripts/backup_database.sh [backup_type]

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_TYPE="${1:-full}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_NAME:-modulyn_db}"
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

case "$BACKUP_TYPE" in
    full)
        echo "Creating full database backup..."
        pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
            -F c -f "$BACKUP_DIR/full_backup_$TIMESTAMP.dump"
        echo "✅ Full backup created: $BACKUP_DIR/full_backup_$TIMESTAMP.dump"
        ;;
    schema)
        echo "Creating schema-only backup..."
        pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
            --schema-only -f "$BACKUP_DIR/schema_backup_$TIMESTAMP.sql"
        echo "✅ Schema backup created: $BACKUP_DIR/schema_backup_$TIMESTAMP.sql"
        ;;
    data)
        echo "Creating data-only backup..."
        pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
            --data-only -F c -f "$BACKUP_DIR/data_backup_$TIMESTAMP.dump"
        echo "✅ Data backup created: $BACKUP_DIR/data_backup_$TIMESTAMP.dump"
        ;;
    *)
        echo "Usage: $0 [full|schema|data]"
        exit 1
        ;;
esac

# Compress backup
if [ -f "$BACKUP_DIR/full_backup_$TIMESTAMP.dump" ]; then
    gzip "$BACKUP_DIR/full_backup_$TIMESTAMP.dump"
    echo "✅ Backup compressed: $BACKUP_DIR/full_backup_$TIMESTAMP.dump.gz"
fi

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed successfully"
```

Make it executable:
```bash
chmod +x scripts/backup_database.sh
```

### 3. Django Management Command Backup

Create `apps/backend/apps/core/management/commands/backup_db.py`:

```python
"""
Django management command for database backup.
Usage: python manage.py backup_db
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
import subprocess
import os
from datetime import datetime


class Command(BaseCommand):
    help = 'Backup the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            help='Output file path',
            default=None
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['sql', 'dump'],
            default='dump',
            help='Backup format (sql or dump)'
        )

    def handle(self, *args, **options):
        db_settings = settings.DATABASES['default']
        db_name = db_settings['NAME']
        db_user = db_settings['USER']
        db_host = db_settings.get('HOST', 'localhost')
        db_port = db_settings.get('PORT', '5432')

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = options['output'] or f'backup_{timestamp}.{options["format"]}'

        # Build pg_dump command
        cmd = [
            'pg_dump',
            '-h', db_host,
            '-p', str(db_port),
            '-U', db_user,
            '-d', db_name,
        ]

        if options['format'] == 'dump':
            cmd.extend(['-F', 'c', '-f', output_file])
        else:
            cmd.extend(['-f', output_file])

        self.stdout.write(f'Creating backup: {output_file}')
        try:
            subprocess.run(cmd, check=True, env={**os.environ, 'PGPASSWORD': db_settings.get('PASSWORD', '')})
            self.stdout.write(self.style.SUCCESS(f'✅ Backup created: {output_file}'))
        except subprocess.CalledProcessError as e:
            self.stdout.write(self.style.ERROR(f'❌ Backup failed: {e}'))
```

Usage:
```bash
python manage.py backup_db
python manage.py backup_db --format sql --output my_backup.sql
```

### 4. Continuous Archiving (WAL Archiving)

For production environments, enable Write-Ahead Logging (WAL) archiving:

```bash
# In postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /backups/wal/%f && cp %p /backups/wal/%f'
```

---

## 🔄 Restore Procedures

### 1. Restore from SQL Backup

```bash
# Restore from SQL file
psql -h localhost -U postgres -d modulyn_db < backup_20250127_120000.sql

# Restore to new database
createdb -h localhost -U postgres modulyn_db_restored
psql -h localhost -U postgres -d modulyn_db_restored < backup_20250127_120000.sql
```

### 2. Restore from Custom Format Backup

```bash
# Restore from .dump file
pg_restore -h localhost -U postgres -d modulyn_db -v backup_20250127_120000.dump

# Restore to new database
createdb -h localhost -U postgres modulyn_db_restored
pg_restore -h localhost -U postgres -d modulyn_db_restored -v backup_20250127_120000.dump
```

### 3. Restore from Compressed Backup

```bash
# Restore from compressed SQL
gunzip < backup_20250127_120000.sql.gz | psql -h localhost -U postgres -d modulyn_db

# Restore from compressed dump
gunzip backup_20250127_120000.dump.gz
pg_restore -h localhost -U postgres -d modulyn_db -v backup_20250127_120000.dump
```

### 4. Selective Restore

```bash
# Restore specific tables
pg_restore -h localhost -U postgres -d modulyn_db \
    -t apps_core_user -t apps_inventory_product \
    backup_20250127_120000.dump

# Restore schema only
pg_restore -h localhost -U postgres -d modulyn_db \
    --schema-only backup_20250127_120000.dump

# Restore data only
pg_restore -h localhost -U postgres -d modulyn_db \
    --data-only backup_20250127_120000.dump
```

### 5. Django Management Command Restore

Create `apps/backend/apps/core/management/commands/restore_db.py`:

```python
"""
Django management command for database restore.
Usage: python manage.py restore_db <backup_file>
"""

from django.core.management.base import BaseCommand
from django.conf import settings
import subprocess
import os
import sys


class Command(BaseCommand):
    help = 'Restore the database from backup'

    def add_arguments(self, parser):
        parser.add_argument('backup_file', type=str, help='Path to backup file')
        parser.add_argument(
            '--format',
            type=str,
            choices=['sql', 'dump'],
            default='dump',
            help='Backup format (sql or dump)'
        )

    def handle(self, *args, **options):
        backup_file = options['backup_file']
        if not os.path.exists(backup_file):
            self.stdout.write(self.style.ERROR(f'❌ Backup file not found: {backup_file}'))
            sys.exit(1)

        db_settings = settings.DATABASES['default']
        db_name = db_settings['NAME']
        db_user = db_settings['USER']
        db_host = db_settings.get('HOST', 'localhost')
        db_port = db_settings.get('PORT', '5432')

        # Confirm restore
        confirm = input(f'⚠️  This will overwrite database "{db_name}". Continue? (yes/no): ')
        if confirm.lower() != 'yes':
            self.stdout.write('Restore cancelled.')
            return

        self.stdout.write(f'Restoring from: {backup_file}')

        try:
            if options['format'] == 'sql':
                cmd = ['psql', '-h', db_host, '-p', str(db_port), '-U', db_user, '-d', db_name]
                with open(backup_file, 'r') as f:
                    subprocess.run(cmd, stdin=f, check=True, env={**os.environ, 'PGPASSWORD': db_settings.get('PASSWORD', '')})
            else:
                cmd = [
                    'pg_restore',
                    '-h', db_host,
                    '-p', str(db_port),
                    '-U', db_user,
                    '-d', db_name,
                    '-v',
                    backup_file
                ]
                subprocess.run(cmd, check=True, env={**os.environ, 'PGPASSWORD': db_settings.get('PASSWORD', '')})

            self.stdout.write(self.style.SUCCESS(f'✅ Database restored successfully'))
        except subprocess.CalledProcessError as e:
            self.stdout.write(self.style.ERROR(f'❌ Restore failed: {e}'))
            sys.exit(1)
```

Usage:
```bash
python manage.py restore_db backup_20250127_120000.dump
python manage.py restore_db backup_20250127_120000.sql --format sql
```

---

## 🔐 Backup Security

### 1. Encrypt Backups

```bash
# Encrypt backup with GPG
pg_dump -h localhost -U postgres -d modulyn_db | \
    gpg --encrypt --recipient backup@modulyn.com \
    > backup_$(date +%Y%m%d_%H%M%S).sql.gpg

# Decrypt and restore
gpg --decrypt backup_20250127_120000.sql.gpg | \
    psql -h localhost -U postgres -d modulyn_db
```

### 2. Secure Backup Storage

- Store backups in encrypted storage (S3 with encryption, encrypted volumes)
- Use secure file permissions: `chmod 600 backup_*.sql`
- Rotate backup credentials regularly
- Never store backups with database credentials

---

## 📅 Backup Schedule

### Recommended Backup Schedule

| Backup Type | Frequency | Retention | Location |
|------------|-----------|-----------|----------|
| **Full Backup** | Daily | 30 days | Local + Cloud |
| **Incremental Backup** | Every 6 hours | 7 days | Local |
| **Transaction Logs** | Continuous | 7 days | Local |
| **Monthly Archive** | Monthly | 1 year | Cloud Storage |

### Automated Backup with Cron

```bash
# Add to crontab (crontab -e)
# Daily full backup at 2 AM
0 2 * * * /path/to/scripts/backup_database.sh full

# Hourly incremental backup
0 * * * * /path/to/scripts/backup_database.sh data
```

---

## 🧪 Testing Backups

### Verify Backup Integrity

```bash
# Check backup file
pg_restore --list backup_20250127_120000.dump

# Test restore to temporary database
createdb -h localhost -U postgres modulyn_db_test
pg_restore -h localhost -U postgres -d modulyn_db_test backup_20250127_120000.dump
dropdb -h localhost -U postgres modulyn_db_test
```

### Regular Backup Testing

1. **Weekly**: Restore latest backup to test database
2. **Monthly**: Full disaster recovery drill
3. **Quarterly**: Test restore from cloud backups

---

## 🚨 Disaster Recovery

### Complete Database Loss Scenario

1. **Stop Application**:
   ```bash
   systemctl stop modulyn-backend
   ```

2. **Restore Database**:
   ```bash
   # Create new database
   createdb -h localhost -U postgres modulyn_db
   
   # Restore from latest backup
   pg_restore -h localhost -U postgres -d modulyn_db -v latest_backup.dump
   ```

3. **Run Migrations** (if needed):
   ```bash
   python manage.py migrate
   ```

4. **Verify Data**:
   ```bash
   python manage.py check
   python manage.py shell
   >>> from apps.core.models import User
   >>> User.objects.count()
   ```

5. **Restart Application**:
   ```bash
   systemctl start modulyn-backend
   ```

---

## 📊 Backup Monitoring

### Check Backup Status

```bash
# List recent backups
ls -lh backups/

# Check backup sizes
du -sh backups/*

# Verify backup age
find backups/ -name "*.dump" -mtime +1
```

### Backup Health Checks

Create monitoring script to verify:
- Backups are being created regularly
- Backup files are not corrupted
- Backup storage has sufficient space
- Backup restoration works

---

## 🔧 Troubleshooting

### Common Issues

1. **Permission Denied**:
   ```bash
   # Ensure PostgreSQL user has backup permissions
   GRANT pg_read_all_data TO backup_user;
   ```

2. **Insufficient Disk Space**:
   ```bash
   # Check disk space
   df -h
   # Clean old backups
   find backups/ -mtime +30 -delete
   ```

3. **Connection Issues**:
   ```bash
   # Test database connection
   psql -h localhost -U postgres -d modulyn_db -c "SELECT 1;"
   ```

4. **Backup Corruption**:
   - Always verify backups after creation
   - Use checksums: `pg_dump --no-sync`
   - Test restores regularly

---

## 📚 Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [pg_restore Documentation](https://www.postgresql.org/docs/current/app-pgrestore.html)

---

## ✅ Backup Checklist

- [ ] Daily automated backups configured
- [ ] Backup storage location secured
- [ ] Backup encryption enabled
- [ ] Backup restoration tested
- [ ] Backup monitoring in place
- [ ] Disaster recovery plan documented
- [ ] Backup retention policy defined
- [ ] Team trained on restore procedures

---

**Last Updated**: 2025-01-27  
**Status**: ✅ **COMPLETE** - Database backup and restore procedures documented

