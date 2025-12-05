# Database Optimization Guide

**Date**: 2025-01-27  
**Purpose**: Guide for optimizing database performance through indexing and query optimization

---

## 📋 Overview

This document provides guidance on optimizing the Modulyn ERP PostgreSQL database for better performance, focusing on index creation, query optimization, and best practices.

---

## 🔍 Current Database Analysis

### **Database Information**
- **Type**: PostgreSQL 15+
- **Database Name**: `modulyn_db`
- **Total Models**: 20+ Django apps with 100+ models

### **Common Query Patterns**

1. **Filtering by Status**:
   - `is_active`, `is_enabled`, `status` fields
   - Frequently used in list views

2. **Date-based Queries**:
   - `created`, `updated`, `created_at`, `updated_at`
   - Used for ordering and date range filtering

3. **Foreign Key Lookups**:
   - User relationships
   - Organization relationships
   - Related object queries

4. **Search Operations**:
   - Full-text search on names, descriptions
   - Email, username lookups

---

## 📊 Index Optimization Strategy

### **1. Automatic Indexes (Django)**

Django automatically creates indexes for:
- ✅ Primary keys
- ✅ Foreign keys
- ✅ Fields with `db_index=True`
- ✅ `unique=True` fields

### **2. Recommended Indexes**

#### **Status/Boolean Fields**
```python
# In model Meta class
class Meta:
    indexes = [
        models.Index(fields=['is_active']),
        models.Index(fields=['status']),
        models.Index(fields=['is_enabled']),
    ]
```

#### **Date Fields**
```python
# For frequently queried date fields
class Meta:
    indexes = [
        models.Index(fields=['-created']),  # Descending for recent first
        models.Index(fields=['updated']),
    ]
```

#### **Composite Indexes**
```python
# For queries filtering by multiple fields
class Meta:
    indexes = [
        models.Index(fields=['user', 'is_active']),
        models.Index(fields=['status', 'created']),
    ]
```

#### **Search Fields**
```python
# For full-text search (PostgreSQL)
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField

class Meta:
    indexes = [
        GinIndex(fields=['search_vector']),
    ]
```

---

## 🛠️ Optimization Tools

### **1. Django Management Command**

Run the index optimization analyzer:

```bash
cd apps/backend
python manage.py optimize_indexes

# Analyze only
python manage.py optimize_indexes --analyze

# Apply suggestions
python manage.py optimize_indexes --apply
```

### **2. PostgreSQL Query Analysis**

#### **Enable Query Logging**
```sql
-- In postgresql.conf
log_statement = 'all'
log_duration = on
log_min_duration_statement = 100  -- Log queries > 100ms
```

#### **Analyze Slow Queries**
```sql
-- Find slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### **Check Index Usage**
```sql
-- Check index usage statistics
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

### **3. Django Debug Toolbar**

For development, use Django Debug Toolbar to identify slow queries:

```python
# In settings/development.py
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

---

## 📝 Index Creation Examples

### **Example 1: User Model**

```python
# apps/backend/apps/core/models.py
class User(AbstractUser):
    is_active = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['is_active']),
            models.Index(fields=['-created']),  # Recent users first
            models.Index(fields=['email']),  # Email lookups
        ]
```

### **Example 2: Invoice Model**

```python
# apps/backend/apps/ledger/models.py
class Invoice(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),  # User's invoices by status
            models.Index(fields=['status', '-created']),  # Recent by status
            models.Index(fields=['amount']),  # Amount filtering
        ]
```

### **Example 3: Composite Index for Common Queries**

```python
# For queries like: Invoice.objects.filter(user=user, status='pending').order_by('-created')
class Meta:
    indexes = [
        models.Index(fields=['user', 'status', '-created']),
    ]
```

---

## 🔧 Query Optimization

### **1. Use select_related() for Foreign Keys**

```python
# Bad: N+1 queries
invoices = Invoice.objects.all()
for invoice in invoices:
    print(invoice.user.email)  # Queries user for each invoice

# Good: Single query
invoices = Invoice.objects.select_related('user').all()
for invoice in invoices:
    print(invoice.user.email)  # No additional queries
```

### **2. Use prefetch_related() for Many-to-Many**

```python
# Bad: Multiple queries
users = User.objects.all()
for user in users:
    print(user.groups.all())  # Query for each user

# Good: Prefetched
users = User.objects.prefetch_related('groups').all()
for user in users:
    print(user.groups.all())  # Uses prefetched data
```

### **3. Use only() and defer() for Large Models**

```python
# Only fetch needed fields
users = User.objects.only('id', 'email', 'username')

# Defer large fields
profiles = UserProfile.objects.defer('bio', 'avatar')
```

### **4. Use values() and values_list() for Simple Data**

```python
# Instead of full objects
emails = User.objects.values_list('email', flat=True)

# Instead of serializers
user_data = User.objects.values('id', 'email', 'username')
```

### **5. Use exists() Instead of count()**

```python
# Bad: Counts all records
if Invoice.objects.filter(status='pending').count() > 0:
    pass

# Good: Stops at first match
if Invoice.objects.filter(status='pending').exists():
    pass
```

---

## 📈 Performance Monitoring

### **1. Django Query Monitoring**

```python
# Enable query logging
from django.db import connection

# After queries
print(f"Queries executed: {len(connection.queries)}")
for query in connection.queries:
    print(f"Time: {query['time']}, SQL: {query['sql']}")
```

### **2. PostgreSQL Statistics**

```sql
-- Table statistics
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Index statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### **3. Vacuum and Analyze**

```sql
-- Analyze tables for query planner
ANALYZE;

-- Vacuum to reclaim space
VACUUM;

-- Vacuum and analyze
VACUUM ANALYZE;
```

---

## 🎯 Optimization Checklist

### **Indexes**
- [ ] Add indexes for frequently filtered fields
- [ ] Add indexes for date fields used in ordering
- [ ] Add composite indexes for multi-field queries
- [ ] Review and remove unused indexes
- [ ] Monitor index usage statistics

### **Queries**
- [ ] Use `select_related()` for foreign keys
- [ ] Use `prefetch_related()` for many-to-many
- [ ] Use `only()` and `defer()` for large models
- [ ] Use `values()` for simple data
- [ ] Use `exists()` instead of `count()`
- [ ] Avoid N+1 queries

### **Database Maintenance**
- [ ] Run `VACUUM ANALYZE` regularly
- [ ] Monitor slow queries
- [ ] Review query execution plans
- [ ] Update table statistics

---

## 📚 Resources

- [Django Database Optimization](https://docs.djangoproject.com/en/stable/topics/db/optimization/)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

---

## ✅ Implementation Steps

1. **Analyze Current State**:
   ```bash
   python manage.py optimize_indexes --analyze
   ```

2. **Review Suggestions**:
   - Identify frequently queried fields
   - Check query patterns in views
   - Review slow query logs

3. **Add Indexes**:
   ```bash
   python manage.py optimize_indexes --apply
   ```
   Or manually add to model Meta classes

4. **Create Migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Monitor Performance**:
   - Check query execution times
   - Monitor index usage
   - Review slow queries

---

**Last Updated**: 2025-01-27  
**Status**: ⚠️ **IN PROGRESS** - Optimization tools created, indexes need review and implementation

