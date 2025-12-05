# Getting Started for Developers

## 🚀 Welcome to Modulyn Development

This tutorial will guide you through setting up Modulyn ERP for development and understanding how to contribute to the project.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js**: 18+ (LTS recommended)
- **Python**: 3.12+
- **Docker**: Latest version
- **Git**: Latest version
- **Rust**: 1.70+ (for Substrate development)
- **Basic Knowledge**: React, TypeScript, Django, and blockchain concepts

---

## 🛠️ Setup Steps

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/vjbollavarapu/modulyn-community.git
cd modulyn-community
```

### **Step 2: Backend Setup**

```bash
cd apps/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

**Verify**: Visit http://localhost:8000/api/docs/ to see the API documentation.

### **Step 3: Frontend Setup**

```bash
cd apps/frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

**Verify**: Visit http://localhost:3000 to see the frontend application.

### **Step 4: Substrate Node Setup (Optional)**

```bash
cd apps/substrate

# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown --toolchain nightly

# Build the node
cargo build --release

# Run development node
./target/release/modulyn-node --dev
```

**Verify**: Connect to http://localhost:9944 with Polkadot.js Apps.

---

## 📚 Understanding the Codebase

### **Project Structure**

```
modulyn-community/
├── apps/
│   ├── backend/          # Django REST API
│   │   ├── apps/        # Django applications (20+ modules)
│   │   ├── contracts/   # Substrate ink! contracts
│   │   └── smart_contracts/  # Ethereum Solidity contracts
│   ├── frontend/        # React TypeScript application
│   └── substrate/       # Substrate blockchain node
├── docs/                # Documentation
├── scripts/             # Deployment scripts
└── tests/              # Integration tests
```

### **Key Components**

#### **Backend (Django)**
- **Core Apps**: `apps/backend/apps/core/` - Base models and utilities
- **Web3 Integration**: `apps/backend/apps/web3/` - Blockchain integration
- **ERP Modules**: `apps/backend/apps/hr/`, `apps/backend/apps/finance/`, etc.
- **Smart Contracts**: `apps/backend/smart_contracts/` - Solidity contracts
- **Substrate Contracts**: `apps/backend/contracts/` - ink! contracts

#### **Frontend (React)**
- **Components**: `apps/frontend/src/components/` - Reusable UI components
- **Pages**: `apps/frontend/src/pages/` - Application pages
- **Web3**: `apps/frontend/src/web3/` - Blockchain integration
- **Services**: `apps/frontend/src/services/` - API services

#### **Substrate**
- **Pallets**: `apps/substrate/pallets/` - Custom Substrate pallets
- **Runtime**: `apps/substrate/runtime/` - Substrate runtime

---

## 🔧 Development Workflow

### **1. Making Changes**

#### **Backend Changes**
```bash
cd apps/backend
# Make your changes
python manage.py makemigrations
python manage.py migrate
python manage.py test
```

#### **Frontend Changes**
```bash
cd apps/frontend
# Make your changes
npm run lint
npm run test
npm run build
```

### **2. Running Tests**

```bash
# Backend tests
cd apps/backend
pytest

# Frontend tests
cd apps/frontend
npm test

# Integration tests
pytest tests/integration/
```

### **3. Code Quality**

```bash
# Backend linting
cd apps/backend
black .
flake8 .

# Frontend linting
cd apps/frontend
npm run lint
npm run format
```

---

## 🎯 Common Development Tasks

### **Adding a New Django App**

```bash
cd apps/backend
python manage.py startapp my_new_app

# Add to INSTALLED_APPS in settings.py
# Create models, views, serializers
# Add URL routing
# Create migrations
python manage.py makemigrations my_new_app
python manage.py migrate
```

### **Adding a New React Component**

```bash
cd apps/frontend/src/components
mkdir my-component
cd my-component
# Create MyComponent.tsx
# Export from index.ts
# Use in pages
```

### **Adding a New Substrate Pallet**

```bash
cd apps/substrate
cargo generate --git https://github.com/substrate-developer-hub/substrate-pallet-template
# Follow prompts
# Add to runtime
# Build and test
```

---

## 🔗 Integration Points

### **Backend-Frontend Integration**

- **API Endpoints**: Backend exposes REST API at `/api/`
- **Authentication**: JWT tokens for API authentication
- **WebSocket**: Real-time updates via WebSocket connections

### **Blockchain Integration**

- **Ethereum**: Web3.py for Solidity contracts
- **Substrate**: substrate-interface for ink! contracts
- **IPFS**: ipfshttpclient for decentralized storage

---

## 📖 Learning Resources

### **Django**
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)

### **React/TypeScript**
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### **Substrate/Polkadot**
- [Substrate Documentation](https://docs.substrate.io/)
- [Polkadot Wiki](https://wiki.polkadot.network/)

### **Web3**
- [Web3.py Documentation](https://web3py.readthedocs.io/)
- [Polkadot.js Documentation](https://polkadot.js.org/docs/)

---

## 🐛 Debugging Tips

### **Backend Debugging**
```bash
# Enable debug mode
DEBUG=True python manage.py runserver

# Use Django shell
python manage.py shell

# Check logs
tail -f logs/django.log
```

### **Frontend Debugging**
```bash
# Enable React DevTools
# Use browser console
# Check network tab for API calls
```

### **Blockchain Debugging**
```bash
# Check Substrate node logs
./target/release/modulyn-node --dev --tmp

# Use Polkadot.js Apps
# Check transaction status on block explorer
```

---

## 🤝 Contributing

### **How to Contribute**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### **Contribution Guidelines**

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass
- Follow semantic commit messages

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed guidelines.

---

## 📞 Getting Help

- **Documentation**: See [Documentation Index](../../README.md#-documentation-index)
- **Issues**: [GitHub Issues](https://github.com/vjbollavarapu/modulyn-community/issues)
- **Discussions**: [GitHub Discussions](https://github.com/vjbollavarapu/modulyn-community/discussions)
- **Email**: dev@modulyn.io

---

## ✅ Next Steps

Now that you're set up, explore:

1. **API Documentation**: http://localhost:8000/api/docs/
2. **Frontend Application**: http://localhost:3000
3. **Substrate Node**: http://localhost:9944
4. **Tutorials**: See other tutorials in `docs/TUTORIALS/`

---

## 📚 Related Documentation

For comprehensive onboarding, see:
- **[Developer Onboarding Guide](../DEVELOPER_ONBOARDING.md)** - Complete onboarding guide with learning path
- **[Architecture Documentation](../ARCHITECTURE.md)** - System architecture overview
- **[Integrating Modulyn Components](./INTEGRATING_MODULYN_COMPONENTS.md)** - Component reuse guide

---

**Happy Coding! 🚀**

