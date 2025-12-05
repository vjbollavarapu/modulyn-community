"""
Locust load testing file for Modulyn ERP API.

Usage:
    locust -f locustfile.py --host=http://localhost:8000

Web UI:
    http://localhost:8089
"""

from locust import HttpUser, task, between
import random


class APIUser(HttpUser):
    """Simulates a typical API user."""
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login and get authentication token."""
        # Use test credentials
        response = self.client.post("/api/v1/auth/login/", json={
            "email": "test@example.com",
            "password": "testpassword123"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access")
            self.client.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
    
    @task(5)
    def get_users(self):
        """List users - high frequency."""
        self.client.get("/api/v1/users/")
    
    @task(4)
    def get_products(self):
        """List products - high frequency."""
        self.client.get("/api/v1/inventory/products/")
    
    @task(3)
    def get_clients(self):
        """List clients."""
        self.client.get("/api/v1/sales/clients/")
    
    @task(2)
    def get_invoices(self):
        """List invoices."""
        self.client.get("/api/v1/ledger/invoices/")
    
    @task(1)
    def get_dashboard(self):
        """Get dashboard data."""
        self.client.get("/api/v1/analytics/dashboard/")
    
    @task(1)
    def create_client(self):
        """Create a new client - low frequency."""
        self.client.post("/api/v1/sales/clients/", json={
            "client_type": "individual",
            "first_name": f"Test{random.randint(1000, 9999)}",
            "last_name": "User",
            "email": f"test{random.randint(1000, 9999)}@example.com",
            "phone": "+1234567890",
            "status": "prospect"
        })


class ReadOnlyUser(HttpUser):
    """Simulates read-only API usage."""
    wait_time = between(2, 5)
    weight = 3  # 3x more read-only users
    
    def on_start(self):
        """Login and get authentication token."""
        response = self.client.post("/api/v1/auth/login/", json={
            "email": "readonly@example.com",
            "password": "testpassword123"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access")
            self.client.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
    
    @task(10)
    def browse_products(self):
        """Browse products."""
        self.client.get("/api/v1/inventory/products/")
    
    @task(5)
    def view_dashboard(self):
        """View dashboard."""
        self.client.get("/api/v1/analytics/dashboard/")
    
    @task(3)
    def search_clients(self):
        """Search clients."""
        self.client.get("/api/v1/sales/clients/?search=test")


class AdminUser(HttpUser):
    """Simulates admin user with write operations."""
    wait_time = between(1, 2)
    weight = 1  # Fewer admin users
    
    def on_start(self):
        """Login as admin."""
        response = self.client.post("/api/v1/auth/login/", json={
            "email": "admin@example.com",
            "password": "adminpassword123"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access")
            self.client.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
    
    @task(3)
    def manage_users(self):
        """User management operations."""
        self.client.get("/api/v1/users/")
    
    @task(2)
    def create_product(self):
        """Create products."""
        self.client.post("/api/v1/inventory/products/", json={
            "name": f"Test Product {random.randint(1000, 9999)}",
            "sku": f"SKU-{random.randint(10000, 99999)}",
            "cost_price": "10.00",
            "selling_price": "20.00",
            "current_stock": 100
        })
    
    @task(1)
    def generate_report(self):
        """Generate reports."""
        self.client.post("/api/v1/analytics/reports/", json={
            "name": f"Test Report {random.randint(1000, 9999)}",
            "report_type": "financial",
            "format": "pdf"
        })

