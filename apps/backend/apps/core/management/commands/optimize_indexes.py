"""
Django management command to analyze and optimize database indexes.

Usage: python manage.py optimize_indexes
"""

from django.core.management.base import BaseCommand
from django.db import connection
from django.apps import apps


class Command(BaseCommand):
    help = 'Analyze database and suggest index optimizations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Apply suggested index optimizations',
        )
        parser.add_argument(
            '--analyze',
            action='store_true',
            help='Analyze query patterns only',
        )

    def handle(self, *args, **options):
        self.stdout.write('Analyzing database for index optimization opportunities...\n')
        
        # Get all models
        all_models = apps.get_models()
        
        suggestions = []
        
        # Analyze each model
        for model in all_models:
            model_suggestions = self.analyze_model(model)
            suggestions.extend(model_suggestions)
        
        # Display suggestions
        if suggestions:
            self.stdout.write(self.style.WARNING('\n=== Index Optimization Suggestions ===\n'))
            for suggestion in suggestions:
                self.stdout.write(f"Model: {suggestion['model']}")
                self.stdout.write(f"Field: {suggestion['field']}")
                self.stdout.write(f"Reason: {suggestion['reason']}")
                self.stdout.write(f"SQL: {suggestion['sql']}\n")
        else:
            self.stdout.write(self.style.SUCCESS('No index optimizations needed.'))
        
        # Apply if requested
        if options['apply'] and suggestions:
            self.stdout.write(self.style.WARNING('\nApplying index optimizations...'))
            self.apply_indexes(suggestions)
            self.stdout.write(self.style.SUCCESS('Index optimizations applied successfully.'))

    def analyze_model(self, model):
        """Analyze a model for index optimization opportunities."""
        suggestions = []
        
        # Check for common patterns that need indexes
        meta = model._meta
        
        # Foreign keys should have indexes (Django creates these automatically)
        # But we can check for missing indexes on frequently queried fields
        
        # Check for fields commonly used in filters
        common_filter_fields = ['status', 'is_active', 'is_enabled', 'created', 'updated']
        
        for field in meta.get_fields():
            if hasattr(field, 'name'):
                field_name = field.name
                
                # Suggest index for status/enum fields
                if field_name in common_filter_fields:
                    if not self.has_index(model, field_name):
                        suggestions.append({
                            'model': model.__name__,
                            'field': field_name,
                            'reason': f'Frequently filtered field: {field_name}',
                            'sql': f'CREATE INDEX idx_{meta.db_table}_{field_name} ON {meta.db_table}({field_name});'
                        })
                
                # Suggest index for date fields used in queries
                if hasattr(field, 'get_internal_type'):
                    if field.get_internal_type() in ['DateTimeField', 'DateField']:
                        if field_name in ['created', 'updated', 'created_at', 'updated_at']:
                            if not self.has_index(model, field_name):
                                suggestions.append({
                                    'model': model.__name__,
                                    'field': field_name,
                                    'reason': f'Date field used in ordering/filtering: {field_name}',
                                    'sql': f'CREATE INDEX idx_{meta.db_table}_{field_name} ON {meta.db_table}({field_name});'
                                })
        
        return suggestions

    def has_index(self, model, field_name):
        """Check if a field has an index."""
        meta = model._meta
        with connection.cursor() as cursor:
            # Check PostgreSQL indexes
            cursor.execute("""
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = %s 
                AND indexdef LIKE %s
            """, [meta.db_table, f'%{field_name}%'])
            return cursor.fetchone() is not None

    def apply_indexes(self, suggestions):
        """Apply index optimizations."""
        with connection.cursor() as cursor:
            for suggestion in suggestions:
                try:
                    cursor.execute(suggestion['sql'])
                    self.stdout.write(f"✅ Created index on {suggestion['model']}.{suggestion['field']}")
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"❌ Failed to create index on {suggestion['model']}.{suggestion['field']}: {e}")
                    )

