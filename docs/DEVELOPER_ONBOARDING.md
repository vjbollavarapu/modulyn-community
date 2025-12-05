# Developer Onboarding Guide

**Date**: 2025-01-27  
**Purpose**: Comprehensive guide for new developers joining the Modulyn ERP project

---

## 🎯 Welcome to Modulyn ERP!

This guide will help you get up and running with the Modulyn ERP codebase quickly and efficiently.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Key Technologies](#key-technologies)
6. [Common Tasks](#common-tasks)
7. [Testing](#testing)
8. [Contributing](#contributing)
9. [Resources](#resources)

---

## ✅ Prerequisites

### Required Software

- **Python 3.12+** - Backend development
- **Node.js 18+** - Frontend development
- **PostgreSQL 15+** - Database
- **Redis 7+** - Caching and sessions
- **Docker & Docker Compose** - Containerization (optional but recommended)
- **Git** - Version control
- **Rust 1.70+** - Substrate/blockchain development (optional)

### Recommended Tools

- **VS Code** or **IntelliJ IDEA** - IDE
- **Postman** or **Insomnia** - API testing
- **pgAdmin** or **DBeaver** - Database management
- **Polkadot.js Extension** - Web3 wallet for testing

### Knowledge Requirements

- **Django** - Python web framework
- **React** - JavaScript UI library
- **TypeScript** - Type-safe JavaScript
- **REST APIs** - API design and consumption
- **PostgreSQL** - Relational database
- **Docker** - Containerization (helpful)
- **Blockchain basics** - Web3 concepts (helpful)

---

## 🚀 Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/modulyn-community.git
cd modulyn-community
```

### 2. Backend Setup

```bash
# Navigate to backend
cd apps/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Copy environment file
cp env.example .env

# Edit .env with your configuration
# Set DATABASE_URL, REDIS_URL, SECRET_KEY, etc.

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load seed data (optional)
python manage.py seed_data

# Start development server
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

### 3. Frontend Setup

```bash
# Navigate to frontend
cd apps/frontend

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Edit .env.local with your configuration
# Set VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb modulyn_db

# Or using psql
psql -U postgres
CREATE DATABASE modulyn_db;
\q
```

### 5. Redis Setup

```bash
# Start Redis (using Docker)
docker run -d -p 6379:6379 redis:7

# Or install locally
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server
# Start: redis-server
```

### 6. Docker Setup (Alternative)

```bash
# From project root
docker-compose up -d

# This starts:
# - PostgreSQL
# - Redis
# - Backend (Django)
# - Frontend (React)
```

---

## 📁 Project Structure

```
modulyn-community/
├── apps/
│   ├── backend/              # Django REST API
│   │   ├── apps/            # Django applications (20+ modules)
│   │   │   ├── core/        # Core functionality (users, auth)
│   │   │   ├── accounts/    # User accounts
│   │   │   ├── inventory/   # Inventory management
│   │   │   ├── sales/       # Sales & CRM
│   │   │   ├── finance/     # Financial management
│   │   │   ├── web3/        # Web3 integration
│   │   │   └── ...          # 15+ more modules
│   │   ├── backend/         # Django settings
│   │   ├── manage.py        # Django management
│   │   └── requirements.txt  # Python dependencies
│   │
│   ├── frontend/            # React + TypeScript SPA
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── pages/       # Page components
│   │   │   ├── services/    # API services
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── web3/        # Web3 utilities
│   │   ├── package.json     # Node dependencies
│   │   └── vite.config.ts   # Vite configuration
│   │
│   └── substrate/          # Substrate blockchain
│       ├── pallets/        # Custom Substrate pallets
│       │   ├── ledger/     # Invoice ledger pallet
│       │   ├── did/        # DID pallet
│       │   └── dao/        # DAO governance pallet
│       └── runtime/        # Substrate runtime
│
├── docs/                    # Documentation
│   ├── MILESTONE_1.md      # Milestone 1 documentation
│   ├── MILESTONE_2.md      # Milestone 2 documentation
│   ├── TUTORIALS/          # Tutorial guides
│   └── ...
│
├── scripts/                 # Utility scripts
├── .github/                 # GitHub workflows
└── docker-compose.yml       # Docker configuration
```

### Key Directories

- **`apps/backend/apps/`** - All Django applications (business logic)
- **`apps/frontend/src/`** - React application source code
- **`apps/substrate/pallets/`** - Substrate pallets (blockchain logic)
- **`docs/`** - Project documentation
- **`.github/workflows/`** - CI/CD pipelines

---

## 🔄 Development Workflow

### 1. Branch Strategy

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. Making Changes

1. **Backend Changes**:
   ```bash
   cd apps/backend
   # Make your changes
   # Create migrations if needed
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Frontend Changes**:
   ```bash
   cd apps/frontend
   # Make your changes
   # Hot reload will update automatically
   ```

3. **Substrate Changes**:
   ```bash
   cd apps/substrate
   # Make your changes
   cargo test --package pallet-your-pallet
   ```

### 3. Testing

```bash
# Backend tests
cd apps/backend
pytest

# Frontend tests
cd apps/frontend
npm test

# All tests
./scripts/run_all_tests.sh
```

### 4. Code Quality

```bash
# Backend linting
cd apps/backend
flake8 .
black --check .
isort --check-only .

# Frontend linting
cd apps/frontend
npm run lint
npm run type-check
```

### 5. Committing Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new inventory feature"

# Push to remote
git push origin feature/your-feature-name
```

### 6. Creating Pull Request

1. Push your branch to GitHub
2. Create Pull Request from GitHub UI
3. Wait for CI checks to pass
4. Request code review
5. Address review comments
6. Merge after approval

---

## 🛠️ Key Technologies

### Backend Stack

- **Django 4.2** - Web framework
- **Django REST Framework** - API framework
- **PostgreSQL** - Database
- **Redis** - Caching
- **Celery** - Background tasks
- **JWT** - Authentication

### Frontend Stack

- **React 18** - UI library
- **TypeScript 5.8** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Data fetching
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library

### Blockchain Stack

- **Substrate** - Blockchain framework
- **Polkadot.js** - JavaScript API
- **Rust** - Pallet development
- **ink!** - Smart contracts

---

## 📝 Common Tasks

### Adding a New Django App

```bash
cd apps/backend
python manage.py startapp apps/your_app_name

# Add to INSTALLED_APPS in settings/base.py
# Create models, views, serializers
# Create migrations
python manage.py makemigrations
python manage.py migrate
```

### Adding a New API Endpoint

1. Create view in `apps/your_app/views.py`
2. Create serializer in `apps/your_app/serializers.py`
3. Add URL in `apps/your_app/urls.py`
4. Include in main `backend/urls.py`
5. Add to OpenAPI schema (automatic with drf-spectacular)

### Adding a New React Component

```bash
cd apps/frontend/src/components
# Create YourComponent.tsx
# Import and use in pages
```

### Running Migrations

```bash
cd apps/backend
python manage.py makemigrations
python manage.py migrate
```

### Accessing Django Admin

```bash
# Create superuser if needed
python manage.py createsuperuser

# Access at http://localhost:8000/admin
```

### Viewing API Documentation

```bash
# Start backend server
python manage.py runserver

# Access Swagger UI at http://localhost:8000/api/docs/
# Access ReDoc at http://localhost:8000/api/redoc/
```

---

## 🧪 Testing

### Backend Testing

```bash
cd apps/backend

# Run all tests
pytest

# Run specific test file
pytest apps/core/tests/test_views.py

# Run with coverage
pytest --cov=apps --cov-report=html

# View coverage report
open htmlcov/index.html
```

### Frontend Testing

```bash
cd apps/frontend

# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Substrate Testing

```bash
cd apps/substrate

# Test all pallets
cargo test --all

# Test specific pallet
cargo test --package pallet-ledger
```

---

## 🤝 Contributing

### Code Style

- **Python**: Follow PEP 8, use Black for formatting
- **TypeScript**: Follow ESLint rules, use Prettier
- **Rust**: Follow rustfmt standards

### Commit Messages

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### Pull Request Guidelines

1. **Clear Title**: Describe what the PR does
2. **Description**: Explain why and how
3. **Tests**: Include tests for new features
4. **Documentation**: Update docs if needed
5. **Small PRs**: Keep PRs focused and small

### Code Review Process

1. Create PR
2. Wait for CI checks
3. Request review from team
4. Address feedback
5. Get approval
6. Merge

---

## 📚 Resources

### Documentation

- **Project Docs**: `docs/` directory
- **API Docs**: `http://localhost:8000/api/docs/`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Tutorials**: `docs/TUTORIALS/`

### External Resources

- **Django**: https://docs.djangoproject.com/
- **React**: https://react.dev/
- **Substrate**: https://docs.substrate.io/
- **Polkadot.js**: https://polkadot.js.org/docs/

### Getting Help

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions
- **Team Chat**: Join team communication channel
- **Code Review**: Ask questions in PR comments

---

## 🎓 Learning Path

### Week 1: Basics
- [ ] Set up development environment
- [ ] Run the application locally
- [ ] Explore the codebase structure
- [ ] Read architecture documentation
- [ ] Make a small change and test it

### Week 2: Backend
- [ ] Understand Django app structure
- [ ] Create a simple API endpoint
- [ ] Add a database model
- [ ] Write unit tests
- [ ] Review existing code patterns

### Week 3: Frontend
- [ ] Understand React component structure
- [ ] Create a new page
- [ ] Integrate with API
- [ ] Add form validation
- [ ] Review existing components

### Week 4: Integration
- [ ] Work on a full-stack feature
- [ ] Understand Web3 integration
- [ ] Review Substrate pallets
- [ ] Contribute to documentation
- [ ] Submit your first PR

---

## ✅ Onboarding Checklist

### Setup
- [ ] Development environment configured
- [ ] All services running (PostgreSQL, Redis)
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Can access admin panel
- [ ] Can access API docs

### Understanding
- [ ] Read architecture documentation
- [ ] Understand project structure
- [ ] Know key technologies
- [ ] Understand development workflow
- [ ] Know how to run tests

### First Contribution
- [ ] Made a small code change
- [ ] Ran tests successfully
- [ ] Created a pull request
- [ ] Received code review feedback
- [ ] Merged first contribution

---

## 🚨 Troubleshooting

### Common Issues

**Backend won't start**:
```bash
# Check database connection
python manage.py dbshell

# Check migrations
python manage.py showmigrations

# Reset database (development only)
python manage.py flush
python manage.py migrate
```

**Frontend won't start**:
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

**Database connection errors**:
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string in .env
echo $DATABASE_URL
```

**Redis connection errors**:
```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

---

## 🎉 Next Steps

1. **Explore the Codebase**: Familiarize yourself with the structure
2. **Read Documentation**: Understand the architecture
3. **Make Small Changes**: Get comfortable with the codebase
4. **Ask Questions**: Don't hesitate to ask for help
5. **Contribute**: Start contributing to the project

---

**Welcome to the team! 🚀**

**Last Updated**: 2025-01-27  
**Status**: ✅ **COMPLETE** - Developer onboarding guide created

