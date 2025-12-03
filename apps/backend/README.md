# Modulyn Backend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.12+-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-4.2.7-green?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.14.0-red?logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![Web3](https://img.shields.io/badge/Web3-Ready-F16822?logo=web3.js&logoColor=white)](https://web3.foundation/)

A comprehensive Django REST Framework backend for the Modulyn ERP system with full Web3 integration, blockchain support, and enterprise-grade features.

## 📋 Overview

The Modulyn Backend is a production-ready Django application that provides a complete REST API for the Modulyn ERP system. It supports both **Community Edition** and **Commercial Edition** deployments, offering robust, scalable, and secure backend services.

### Key Features

- **RESTful API**: Comprehensive REST API with OpenAPI/Swagger documentation
- **Web3 Integration**: Full support for blockchain, smart contracts, and decentralized storage
- **Multi-Tenant Support**: Organization-based multi-tenancy
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Audit Trail**: Comprehensive audit logging with blockchain anchoring
- **Background Tasks**: Celery-based asynchronous task processing
- **Database**: PostgreSQL with optimized queries
- **Caching**: Redis for high-performance caching
- **File Storage**: Support for local, S3, and IPFS storage
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

## 🎯 Editions

### Community Edition
- **Target**: Open-source community, developers, small businesses
- **Features**: 
  - Full ERP API functionality
  - Web3 integration (Substrate, IPFS, smart contracts)
  - Self-hosting support
  - Community support
  - All core modules
- **License**: MIT
- **Deployment**: Self-hosted, Docker

### Commercial Edition
- **Target**: Enterprise customers, partners, resellers
- **Features**:
  - All Community features
  - Multi-tenant architecture
  - Partner/reseller APIs
  - Advanced analytics APIs
  - Priority support
  - Enhanced security features
  - Custom integrations
- **License**: Commercial
- **Deployment**: Cloud-hosted, managed service

**Note**: Both editions share the same codebase and are fully developed. The Commercial Edition includes additional enterprise features and support options.

## 🛠️ Technology Stack

### Core Framework
- **Django 4.2.7**: Web framework
- **Django REST Framework 3.14.0**: REST API framework
- **Python 3.12+**: Programming language

### Database & Caching
- **PostgreSQL 15+**: Primary database
- **Redis 7+**: Caching and task queue
- **Django ORM**: Database abstraction

### Authentication & Security
- **djangorestframework-simplejwt 5.3.0**: JWT authentication
- **django-axes 6.1.1**: Security monitoring
- **django-ratelimit 4.1.0**: Rate limiting
- **django-cors-headers**: CORS handling

### Web3 & Blockchain
- **substrate-interface**: Substrate blockchain integration
- **web3.py 6.11.3**: Ethereum blockchain integration
- **eth-account 0.9.0**: Ethereum account management
- **IPFS**: Decentralized file storage

### Background Tasks
- **Celery 5.3.4**: Asynchronous task queue
- **Redis**: Celery broker

### API Documentation
- **drf-spectacular 0.26.5**: OpenAPI/Swagger documentation

### Development Tools
- **Black**: Code formatting
- **isort**: Import sorting
- **mypy**: Type checking
- **pytest**: Testing framework

## 🚀 Quick Start

### Prerequisites

- **Python**: 3.12 or higher
- **PostgreSQL**: 15 or higher
- **Redis**: 7 or higher
- **pip**: Python package manager
- **Git**: Version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vjbollavarapu/modulyn-community.git
   cd modulyn-community/apps/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

7. **Access the application**
   - API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin
   - API Docs: http://localhost:8000/api/docs/

## 📁 Project Structure

```
apps/backend/
├── apps/                    # Django applications
│   ├── accounts/           # User authentication & profiles
│   ├── analytics/          # Business intelligence
│   ├── audit_trail/        # Audit logging & blockchain anchoring
│   ├── core/               # Core models & utilities
│   ├── contractor_payments/# Contractor payment processing
│   ├── did_auth/           # Decentralized identity authentication
│   ├── facility_management/# Facility tracking
│   ├── field_operations/   # Field service management
│   ├── finance/            # Financial management
│   ├── freelancer_web3/    # Freelancer Web3 features
│   ├── freelancers/        # Freelancer management
│   ├── gig_management/     # Gig/job management
│   ├── hr/                 # Human resources
│   ├── inventory/          # Inventory management
│   ├── ledger/             # Financial ledger
│   ├── payroll/            # Payroll processing
│   ├── purchasing/         # Purchase order management
│   ├── sales/              # Sales & CRM
│   ├── scheduling/         # Service scheduling
│   ├── wallet/             # Web3 wallet management
│   └── web3/               # Blockchain integration
├── backend/                # Django project settings
│   ├── settings/           # Environment-specific settings
│   │   ├── base.py        # Base settings
│   │   ├── development.py # Development settings
│   │   ├── production.py  # Production settings
│   │   └── test.py        # Test settings
│   ├── urls.py            # URL configuration
│   └── wsgi.py            # WSGI application
├── services/               # External service integrations
│   ├── substrate_client.py
│   └── ...
├── substrate_poc/          # Substrate POC scripts
├── smart_contracts/        # Smart contract artifacts
├── ledger/                 # Ledger services
├── wallet/                 # Wallet services
├── manage.py               # Django management script
├── requirements.txt        # Python dependencies
├── requirements-dev.txt    # Development dependencies
├── pyproject.toml          # Project configuration
└── README.md              # This file
```

## 🔧 Development

### Environment Configuration

Key environment variables in `.env`:

```bash
# Django
DJANGO_ENV=development
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/modulyn
DB_NAME=modulyn
DB_USER=modulyn
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Web3
WEB3_ENABLED=True
WEB3_PROVIDER_URL=http://localhost:8545
WEB3_NETWORK_ID=1337

# Substrate
SUBSTRATE_WS=ws://127.0.0.1:9944
SUBSTRATE_SENDER_SEED=//Alice

# IPFS
IPFS_ENABLED=True
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password

# File Storage
DEFAULT_FILE_STORAGE=django.core.files.storage.FileSystemStorage
MEDIA_ROOT=media
MEDIA_URL=/media/
```

### Management Commands

#### Substrate Integration

**`demo_submit`** - Submit Service Verification Records

Submit service verification records to the ink! smart contract deployed on a Substrate node.

```bash
python manage.py demo_submit \
    --contract <CONTRACT_ADDRESS> \
    --service-id <SERVICE_ID> \
    --payload "<PAYLOAD>"
```

**Examples:**
```bash
# Basic usage
python manage.py demo_submit --contract 5F... --service-id 1 --payload "demo"

# With custom Substrate endpoint
python manage.py demo_submit \
    --contract 5F... \
    --service-id 2 \
    --payload "test data" \
    --substrate-ws ws://localhost:9944

# With custom sender account
python manage.py demo_submit \
    --contract 5F... \
    --service-id 3 \
    --payload "verification" \
    --sender-seed "//Bob"
```

#### Data Seeding

```bash
# Seed demo data
python manage.py seed_demo

# Seed comprehensive demo data
python manage.py seed_comprehensive_demo

# Seed business-specific data
python manage.py seed_business_data

# Setup single organization
python manage.py setup_single_organization
```

#### Audit Trail

```bash
# Verify audit integrity
python manage.py verify_audit_integrity
```

### Adding New Django Apps

1. **Create app directory**
   ```bash
   python manage.py startapp my_app apps/my_app
   ```

2. **Add to INSTALLED_APPS** in `backend/settings/base.py`
   ```python
   INSTALLED_APPS = [
       # ...
       'apps.my_app',
   ]
   ```

3. **Create models, views, serializers, and URLs**

4. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

### API Development

#### Creating API Endpoints

1. **Create serializer**
   ```python
   # apps/my_app/serializers.py
   from rest_framework import serializers
   from .models import MyModel
   
   class MyModelSerializer(serializers.ModelSerializer):
       class Meta:
           model = MyModel
           fields = '__all__'
   ```

2. **Create viewset**
   ```python
   # apps/my_app/views.py
   from rest_framework import viewsets
   from .models import MyModel
   from .serializers import MyModelSerializer
   
   class MyModelViewSet(viewsets.ModelViewSet):
       queryset = MyModel.objects.all()
       serializer_class = MyModelSerializer
   ```

3. **Register URLs**
   ```python
   # apps/my_app/urls.py
   from rest_framework.routers import DefaultRouter
   from .views import MyModelViewSet
   
   router = DefaultRouter()
   router.register(r'my-models', MyModelViewSet)
   
   urlpatterns = router.urls
   ```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.core

# Run with pytest
pytest

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### Test Structure

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── conftest.py       # Pytest configuration
```

### Writing Tests

```python
# tests/unit/test_my_model.py
from django.test import TestCase
from apps.my_app.models import MyModel

class MyModelTestCase(TestCase):
    def setUp(self):
        self.model = MyModel.objects.create(name="Test")
    
    def test_model_creation(self):
        self.assertEqual(self.model.name, "Test")
```

## 📚 API Documentation

### Swagger UI

Access interactive API documentation:
- **Development**: http://localhost:8000/api/docs/
- **Production**: https://your-domain.com/api/docs/

### OpenAPI Schema

- **Schema**: http://localhost:8000/api/schema/
- **YAML**: http://localhost:8000/api/schema.yaml
- **JSON**: http://localhost:8000/api/schema.json

### API Endpoints

#### Authentication
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/logout/` - User logout
- `POST /api/v1/auth/refresh/` - Refresh JWT token
- `POST /api/v1/auth/register/` - User registration

#### Organizations
- `GET /api/v1/organizations/` - List organizations
- `POST /api/v1/organizations/` - Create organization
- `GET /api/v1/organizations/{id}/` - Get organization
- `PATCH /api/v1/organizations/{id}/` - Update organization

#### Audit Trail
- `GET /api/v1/audit-trail/events/` - List audit events
- `POST /api/v1/audit-trail/events/` - Create audit event
- `GET /api/v1/audit-trail/events/{id}/` - Get audit event
- `POST /api/v1/audit-trail/verify/` - Verify audit integrity

#### Web3
- `POST /api/v1/web3/wallets/` - Connect wallet
- `GET /api/v1/web3/wallets/` - List wallets
- `POST /api/v1/web3/did/authenticate/` - DID authentication
- `POST /api/v1/web3/audit-logs/` - Store audit log on-chain

See full API documentation at `/api/docs/`

## 🔐 Security

### Authentication & Authorization

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions
- **API Rate Limiting**: Protection against abuse
- **CORS Configuration**: Cross-origin resource sharing

### Data Protection

- **Encryption**: Data encryption at rest and in transit
- **SQL Injection Protection**: Django ORM protection
- **XSS Protection**: Template auto-escaping
- **CSRF Protection**: Cross-site request forgery protection

### Security Best Practices

1. **Never commit secrets**: Use environment variables
2. **Use HTTPS**: Always in production
3. **Keep dependencies updated**: Regular security updates
4. **Monitor logs**: Use django-axes for security monitoring
5. **Regular backups**: Database and file backups

## 🌐 Web3 Integration

### Substrate Integration

```python
from services.substrate_client import SubstrateClient

client = SubstrateClient("ws://127.0.0.1:9944")
result = client.submit_transaction(
    contract_address="5F...",
    method="store",
    params={"service_id": 1, "data_hash": "0x..."}
)
```

### Smart Contracts

Smart contracts are located in `smart_contracts/`:
- **ModulynERP.sol**: Main ERP contract
- **ModulynToken.sol**: ERC20 token
- **ModulynDAO.sol**: DAO governance
- **ModulynLedger.sol**: Ledger contract

### IPFS Integration

```python
from apps.audit_trail.services.ipfs_service import IPFSService

ipfs = IPFSService()
hash = ipfs.upload_file(file_path)
content = ipfs.get_file(hash)
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t modulyn-backend .

# Run container
docker run -p 8000:8000 modulyn-backend
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Production Deployment

1. **Set environment variables**
2. **Run migrations**
   ```bash
   python manage.py migrate
   ```

3. **Collect static files**
   ```bash
   python manage.py collectstatic --noinput
   ```

4. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

5. **Start with Gunicorn**
   ```bash
   gunicorn backend.wsgi:application --bind 0.0.0.0:8000
   ```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.modulyn.io;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static/ {
        alias /path/to/static/;
    }
    
    location /media/ {
        alias /path/to/media/;
    }
}
```

## 📖 Documentation

### Code Documentation

- **Models**: See `apps/*/models.py` for model documentation
- **Views**: See `apps/*/views.py` for API views
- **Services**: See `services/` for service layer documentation

### Management Commands

See [Management Commands](#management-commands) section above.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run tests and linting
6. Submit a pull request

### Code Standards

- **Python PEP 8**: Code style
- **Black**: Code formatting
- **isort**: Import sorting
- **mypy**: Type checking
- **Docstrings**: Comprehensive documentation

## 📄 License

- **Community Edition**: MIT License
- **Commercial Edition**: Commercial License

See [LICENSE](../../LICENSE) for details.

## 🆘 Support

### Community Support

- **GitHub Issues**: [Report bugs](https://github.com/vjbollavarapu/modulyn-community/issues)
- **Documentation**: [Read the docs](../../README.md)
- **Discussions**: [GitHub Discussions](https://github.com/vjbollavarapu/modulyn-community/discussions)

### Commercial Support

- **Email**: support@modulyn.io
- **Priority Support**: Available for Commercial Edition customers

## 🗺️ Roadmap

See our [Roadmap](../../docs/ROADMAP.md) for upcoming features.

### Upcoming Features

- Enhanced Web3 integrations
- Advanced analytics APIs
- Real-time WebSocket support
- GraphQL API
- Enhanced caching strategies

## 🙏 Acknowledgments

- Django and DRF communities
- Web3 Foundation for blockchain support
- Substrate and Polkadot ecosystems
- All open-source contributors

---

**Built with ❤️ for the Modulyn community and enterprise users worldwide.**

**Note**: This backend is fully developed and maintained for both Community and Commercial editions of Modulyn ERP.
