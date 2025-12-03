# 🧾 Modulyn ERP - Web3-Enabled Enterprise Resource Planning

<div align="center">

[![CI/CD Pipeline](https://github.com/Modulyn-community/Modulyn-community/workflows/CI%2FCD%20Pipeline/badge.svg)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen)
![Python](https://img.shields.io/badge/Python-3.12+-blue)
![Django](https://img.shields.io/badge/Django-4.2.7-green)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Web3](https://img.shields.io/badge/Web3-Ready-orange)
![Polkadot](https://img.shields.io/badge/Polkadot-Parachain-purple)

**A revolutionary Web3-enabled ERP platform that transforms the cleaning services industry through blockchain technology, smart contracts, and decentralized architecture.**

[🚀 Quick Start](#-quick-start-local-development) • [📖 Documentation](#-documentation-index) • [🤝 Contributing](#-contribution-guidelines) • [💬 Community](https://github.com/vjbollavarapu/modulyn-community/discussions)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start-local-development)
- [Documentation](#-documentation-index)
- [Contributing](#-contribution-guidelines)
- [License](#-license)
- [Support](#-support)

---

## 📋 Project Overview

Modulyn ERP is a **Polkadot-native business management platform** that demonstrates how Web3 technology can transform traditional business operations. Built on Substrate framework with Django REST Framework and React, it combines traditional ERP functionality with cutting-edge blockchain technology including smart contracts, decentralized identity, asset tokenization, and cross-chain interoperability.

While initially focused on the cleaning services industry ($400+ billion market), Modulyn serves as a **reference implementation** for Web3-enabled business operations on Polkadot, showcasing how Substrate pallets, ink! smart contracts, and cross-parachain messaging can revolutionize enterprise resource planning.

### 🌐 Why Polkadot/Substrate?

Modulyn is built on **Polkadot/Substrate** because:

- **Substrate Framework**: Modular architecture enables rapid development and customization with built-in governance, staking, and consensus mechanisms
- **Polkadot Parachain Benefits**: Shared security from Polkadot relay chain, cross-parachain message passing (XCMP), scalable throughput, and lower transaction costs
- **ink! Smart Contracts**: Rust-based contracts for safety and performance with native Substrate runtime integration
- **Cross-Chain Interoperability**: Seamless interaction with other parachains and chains, enabling true multi-chain business operations
- **Future-Proof**: Upgradeable runtime ensures long-term viability without hard forks

**Modulyn strengthens the Polkadot ecosystem** by:
- Bringing real-world enterprise use cases to Polkadot
- Contributing reusable Substrate pallets (ledger, DID, DAO) to the ecosystem
- Demonstrating practical Web3 business operations beyond DeFi
- Onboarding millions of potential users to Polkadot
- Creating network effects through high-frequency business transactions

For detailed information on Polkadot ecosystem alignment, see [Polkadot Ecosystem Documentation](docs/POLKADOT_ECOSYSTEM.md).

### 🎯 Editions

Modulyn ERP is available in two editions:

#### **Community Edition** 🌟
- **Target**: Open-source community, developers, small businesses, Web3 Foundation grant applicants
- **Features**: 
  - Complete ERP suite (15+ modules)
  - Full Web3 integration (Substrate, IPFS, smart contracts)
  - Freelancer/contractor management (Community exclusive)
  - Gig economy support
  - Self-hosting support
  - Community support
  - Full source code access
- **License**: MIT
- **Deployment**: Self-hosted, Docker, Vercel

#### **Commercial Edition** 💼
- **Target**: Enterprise customers, partners, resellers, multi-tenant SaaS
- **Features**:
  - All Community features
  - Multi-tenant architecture
  - Partner/reseller portal
  - White-label theming
  - Advanced analytics
  - Mobile apps (Flutter)
  - Priority support
  - Enhanced security features
- **License**: Commercial
- **Deployment**: Cloud-hosted, managed service

**Note**: Both editions share the same codebase and are fully developed. The Commercial Edition extends the Community Edition with enterprise features while maintaining complete feature parity for core functionality.

---

## 🚀 Key Features

### **Core ERP Modules** (Available in Both Editions)

- **👥 Human Resources Management** - Employee records, payroll, leave management, document management
- **📦 Inventory Management** - Stock tracking, suppliers, purchase orders with NFT tokenization
- **💼 Sales & CRM** - Customer management, sales tracking, smart contract invoicing
- **💰 Financial Management** - Multi-currency accounting, DeFi integration, automated payments
- **📅 Scheduling** - Service scheduling, resource allocation, calendar management
- **📊 Analytics & Reporting** - Real-time business intelligence and insights
- **🏢 Facility Management** - Facility tracking and maintenance scheduling
- **🛒 Purchasing** - Purchase order management and vendor relations
- **🚛 Field Operations** - Field service management and GPS tracking
- **🔍 Audit Trail** - Comprehensive audit logging with blockchain anchoring

### **Web3 Integration Features** (Available in Both Editions)

- **🔗 Smart Contract Automation** - Automated service verification and payment processing
- **🪙 Asset Tokenization** - Physical assets as tradeable NFTs (ERC-721, ERC-1155)
- **💳 Multi-Currency Payments** - Support for 50+ cryptocurrencies and DeFi protocols
- **🌐 Cross-Chain Interoperability** - Seamless operation across multiple blockchains
- **🔐 Decentralized Identity (DID)** - DID-based authentication and access control
- **🏦 DeFi Integration** - Yield farming, staking, and liquidity provision
- **📱 Web3 Wallet Integration** - MetaMask, WalletConnect, Coinbase Wallet, Trust Wallet
- **🗳️ DAO Governance** - Decentralized community decision making
- **⛓️ Substrate Integration** - Custom blockchain pallets for ledger, DID, and DAO

### **Community Edition Exclusive Features** 🌟

- **🔧 Freelancer Management** - Complete platform for individual contractors and domestic cleaners
- **📋 Freelancer Registration** - Comprehensive onboarding with document verification
- **⏰ Availability Scheduling** - Flexible scheduling system for freelancer availability
- **🎯 Gig Management** - Job posting, assignment, and tracking for freelancers
- **💰 Contractor Payments** - Payment processing, escrow, and Web3 payments
- **🌐 Freelancer Web3** - NFT badges, smart contracts, and reputation tokens
- **📊 Performance Analytics** - Detailed ratings, reviews, and performance metrics

### **Commercial Edition Exclusive Features** 💼

- **🏢 Multi-Tenant Architecture** - Organization-based multi-tenancy
- **👥 Partner/Reseller Portal** - Complete partner management system
- **🎨 White-Label Theming** - Custom branding and theming
- **📱 Mobile Applications** - Flutter apps for employees and attendance
- **📈 Advanced Analytics** - Enterprise-grade reporting and insights
- **🔒 Enhanced Security** - SOC 2 compliance, advanced security features
- **☁️ Managed Hosting** - Cloud-hosted, managed service

---

## 🏗️ Architecture

Modulyn ERP is built with a modern, scalable architecture that seamlessly integrates Web3 technology:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Modulyn ERP Platform                      │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React SPA)    │    Backend (Django API)            │
│  ┌─────────────────┐     │    ┌─────────────────┐              │
│  │   Dashboard     │◄────┼────┤   Core Apps     │              │
│  │   Inventory     │     │    │   Accounts      │              │
│  │   Sales         │     │    │   Organizations │              │
│  │   Finance       │     │    │   Web3          │              │
│  │   Web3 Wallet   │     │    │   ERP Modules   │              │
│  └─────────────────┘     │    └─────────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  Web3 Integration        │    Data Layer                       │
│  ┌─────────────────┐     │    ┌─────────────────┐              │
│  │   MetaMask      │     │    │   PostgreSQL    │              │
│  │   Smart Contracts│    │    │   Redis Cache   │              │
│  │   Substrate     │     │    │   IPFS Storage  │              │
│  └─────────────────┘     │    └─────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### **Technology Stack**

#### **Frontend**
- **React 18.3.1** with TypeScript 5.8.3
- **Vite 6.0.7** for build tooling
- **Tailwind CSS 3.4.17** for styling
- **Radix UI** components library
- **TanStack Query 5.83.0** for state management
- **React Hook Form 7.54.0** with Zod validation

#### **Backend**
- **Django 4.2.7** with Django REST Framework 3.14.0
- **Python 3.12+** with modern async features
- **PostgreSQL 15+** (primary database)
- **Redis 7+** (caching and task queue)
- **Celery 5.3.4** for background tasks

#### **Web3 & Blockchain**
- **Substrate** - Custom blockchain pallets (ledger, DID, DAO)
- **Polkadot/Substrate** - Native Polkadot parachain integration with DOT token support
- **Ethereum/Polygon/BSC** - Multi-chain support
- **Smart Contracts** - Solidity (Ethereum) and ink! (Substrate)
- **IPFS** - Decentralized file storage
- **DID** - Decentralized identity (6 DID methods supported)

### **DOT Token Integration**

Modulyn integrates with the **DOT token** (Polkadot's native token) for:

- **Parachain Slot Bonding**: Secure a dedicated parachain slot for Modulyn's operations
- **Governance Participation**: Enable community governance of Modulyn protocol
- **Staking and Security**: Contribute to Polkadot network security and earn staking rewards
- **Payment and Settlement**: Use DOT as a payment option within the Modulyn ecosystem
- **Treasury and Funding**: Access Polkadot Treasury for ecosystem development

For detailed information on DOT token integration and Polkadot ecosystem alignment, see [Polkadot Ecosystem Documentation](docs/POLKADOT_ECOSYSTEM.md).

For detailed architecture information, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 📁 Project Structure

The Modulyn ERP project follows a monorepo structure with clear separation of concerns:

```
modulyn-community/
├── apps/
│   ├── backend/                 # Django REST API Backend
│   │   ├── apps/               # Django applications
│   │   │   ├── accounts/       # User authentication & profiles
│   │   │   ├── analytics/      # Business intelligence & reporting
│   │   │   ├── audit_trail/    # Blockchain-based audit logging
│   │   │   ├── core/           # Base models & utilities
│   │   │   ├── did_auth/       # Decentralized identity authentication
│   │   │   ├── facility_management/  # Facility tracking & maintenance
│   │   │   ├── field_operations/     # Field service management
│   │   │   ├── finance/        # Financial management & payments
│   │   │   ├── freelancers/    # Freelancer management (Community)
│   │   │   ├── gig_management/ # Gig economy support (Community)
│   │   │   ├── contractor_payments/ # Contractor payments (Community)
│   │   │   ├── freelancer_web3/ # Freelancer Web3 features (Community)
│   │   │   ├── hr/            # Human resources management
│   │   │   ├── inventory/     # Asset management & tokenization
│   │   │   ├── ledger/        # Financial ledger & accounting
│   │   │   ├── payroll/       # Payroll processing
│   │   │   ├── purchasing/    # Purchase order management
│   │   │   ├── sales/         # Customer relationship management
│   │   │   ├── scheduling/    # Service scheduling & allocation
│   │   │   ├── wallet/        # Web3 wallet management
│   │   │   └── web3/          # Blockchain integration
│   │   ├── contracts/         # Substrate ink! smart contracts
│   │   ├── smart_contracts/   # Ethereum Solidity contracts
│   │   ├── services/          # Backend services (Substrate client)
│   │   └── README.md          # Backend documentation
│   ├── frontend/              # React TypeScript Frontend
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components
│   │   │   ├── pages/         # Application pages/views
│   │   │   ├── services/      # API services & utilities
│   │   │   ├── contexts/      # React contexts (auth, theme)
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── types/         # TypeScript type definitions
│   │   └── README.md          # Frontend documentation
│   └── substrate/             # Substrate blockchain node
│       ├── pallets/           # Custom Substrate pallets
│       │   ├── modulyn-ledger/ # On-chain ledger pallet
│       │   ├── modulyn-did/    # Decentralized identity pallet
│       │   └── modulyn-dao/    # DAO governance pallet
│       └── README.md           # Substrate documentation
├── docs/                      # Project documentation
├── scripts/                   # Deployment & utility scripts
├── tests/                     # Integration tests
└── README.md                  # This file
```

### **Key Directories**

- **[apps/backend/](apps/backend/)** - Django REST API backend with 20+ Django apps
  - See [apps/backend/README.md](apps/backend/README.md) for detailed documentation
- **[apps/frontend/](apps/frontend/)** - React TypeScript frontend application
  - See [apps/frontend/README.md](apps/frontend/README.md) for detailed documentation
- **[apps/substrate/](apps/substrate/)** - Substrate blockchain node with custom pallets
  - See [apps/substrate/README.md](apps/substrate/README.md) for detailed documentation
- **[apps/backend/contracts/](apps/backend/contracts/)** - Substrate ink! smart contracts
  - See [apps/backend/contracts/README.md](apps/backend/contracts/README.md) for documentation
- **[apps/backend/smart_contracts/](apps/backend/smart_contracts/)** - Ethereum Solidity contracts
  - See [apps/backend/smart_contracts/README.md](apps/backend/smart_contracts/README.md) for documentation
- **[docs/](docs/)** - Comprehensive project documentation
- **[scripts/](scripts/)** - Deployment and utility scripts
  - See [scripts/README.md](scripts/README.md) for documentation

---

## 💡 Quick Start (Local Development)

### **Prerequisites**

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads)
- 4GB RAM minimum (8GB recommended)
- Node.js 18+ and npm/yarn (for frontend development)
- Python 3.12+ and pip (for backend development)
- PostgreSQL 15+ (if running without Docker)
- Redis 7+ (if running without Docker)

### **Quick Start with Docker (Recommended)**

```bash
# Clone the repository
git clone https://github.com/vjbollavarapu/modulyn-community.git
cd modulyn-community

# Start the application
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend (Swagger UI): http://localhost:8000
```

### **Development Setup**

#### **Backend Setup**

See [apps/backend/README.md](apps/backend/README.md) for detailed backend setup instructions.

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

#### **Frontend Setup**

See [apps/frontend/README.md](apps/frontend/README.md) for detailed frontend setup instructions.

```bash
cd apps/frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# For production build
npm run build
```

#### **Substrate Node Setup**

See [apps/substrate/README.md](apps/substrate/README.md) for detailed Substrate setup instructions.

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

### **Default Login Credentials**

- **Username**: `admin`
- **Password**: `admin123`
- ⚠️ **Important**: Change the default password after first login!

---

## 📚 Documentation Index

Comprehensive documentation is available throughout the project:

### **Main Documentation**

- **[📖 Architecture](docs/ARCHITECTURE.md)** - System architecture and design
- **[🌐 Polkadot Ecosystem](docs/POLKADOT_ECOSYSTEM.md)** - Polkadot integration and DOT token alignment
- **[🔗 Web3 Technical Implementation](docs/WEB3_TECHNICAL_IMPLEMENTATION.md)** - Blockchain and Web3 features
- **[🔌 API Reference](docs/API_REFERENCE.md)** - Complete API reference
- **[🚀 Roadmap](docs/ROADMAP.md)** - Development roadmap
  - [Milestone 1: Core Platform Foundation](docs/MILESTONE_1.md) - Detailed milestone with acceptance criteria
  - [Milestone 2: Web3 Integration & Smart Contracts](docs/MILESTONE_2.md) - Detailed milestone with acceptance criteria
- **[📊 Use Cases](docs/USE_CASES.md)** - Business use cases
- **[🆚 Competitive Analysis](docs/COMPETITIVE_ANALYSIS.md)** - Comparison with ERP and Web3 platforms
- **[🛡️ Compliance](docs/COMPLIANCE.md)** - Regulatory compliance, KYC/KYB, and data protection
- **[🔒 Security](SECURITY.md)** - Security best practices

### **Application Documentation**

- **[Backend Documentation](apps/backend/README.md)** - Complete backend guide
  - [Audit Trail Module](apps/backend/apps/audit_trail/README.md)
  - [Web3 Module](apps/backend/apps/web3/README.md)
  - [Finance Module](apps/backend/apps/finance/README.md)
  - [HR Module](apps/backend/apps/hr/README.md)
  - [Sales Module](apps/backend/apps/sales/README.md)
  - [Scheduling Module](apps/backend/apps/scheduling/README.md)
  - [Substrate Client Service](apps/backend/services/README.md)
- **[Frontend Documentation](apps/frontend/README.md)** - Complete frontend guide
  - [Web3 Integration](apps/frontend/src/web3/README.md)
- **[Substrate Documentation](apps/substrate/README.md)** - Substrate node guide
  - [Ledger Pallet](apps/substrate/pallets/ledger/README.md)
  - [DID Pallet](apps/substrate/pallets/did/README.md)
  - [DAO Pallet](apps/substrate/pallets/dao/README.md)

### **Smart Contracts Documentation**

- **[Substrate Contracts](apps/backend/contracts/README.md)** - ink! smart contracts
  - [Substrate POC](apps/backend/contracts/substrate-poc/README.md)
  - [Escrow SLA](apps/backend/contracts/escrow-sla/README.md)
  - [Substrate Pallet](apps/backend/contracts/substrate-pallet/README.md)
- **[Ethereum Contracts](apps/backend/smart_contracts/README.md)** - Solidity smart contracts
  - [Ledger Contract](apps/backend/smart_contracts/ledger/README.md)

### **Infrastructure & Scripts**

- **[Scripts Documentation](scripts/README.md)** - Deployment and utility scripts
- **[Infrastructure Documentation](infra/README.md)** - CI/CD and infrastructure
- **[Tests Documentation](tests/README.md)** - Testing guide

### **Tutorials and Guides**

- **[Getting Started for Developers](docs/TUTORIALS/GETTING_STARTED_FOR_DEVELOPERS.md)** - Complete developer setup guide
- **[Integrating Modulyn Components](docs/TUTORIALS/INTEGRATING_MODULYN_COMPONENTS.md)** - How to reuse Modulyn components

### **Additional Resources**

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community guidelines
- **[Developer Onboarding](DEVELOPER_ONBOARDING.md)** - Getting started guide
- **[Testing Guide](TESTING_GUIDE.md)** - Testing documentation
- **[Web3 Features](docs/WEB3_FEATURES_DOCUMENTATION.md)** - Complete Web3 features list
- **[Web3 Quick Reference](docs/WEB3_QUICK_REFERENCE.md)** - Quick Web3 reference

---

## 🤝 Contribution Guidelines

We welcome contributions from the community! Here's how you can help:

### **Ways to Contribute**

- 🐛 **Report bugs** and issues
- 💡 **Suggest new features**
- 📝 **Improve documentation**
- 🔧 **Submit code improvements**
- 🧪 **Add tests**
- 🌍 **Translate to other languages**

### **Getting Started**

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### **Development Guidelines**

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass
- Follow semantic commit messages

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Modulyn ERP Community

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🆘 Support

### **Community Support**

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/vjbollavarapu/modulyn-community/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/vjbollavarapu/modulyn-community/discussions)
- 📖 **Documentation**: See [Documentation Index](#-documentation-index) above
- 🌐 **Community Forum**: [Join the discussion](https://github.com/vjbollavarapu/modulyn-community/discussions)

### **Commercial Support**

For enterprise features, multi-tenant support, and professional support, contact us at:
- 📧 **Email**: support@modulyn.io
- 🌐 **Website**: [Modulyn.io](https://modulyn.io)

---

<div align="center">

**Made with ❤️ by the Modulyn ERP Community**

[⭐ Star us on GitHub](https://github.com/vjbollavarapu/modulyn-community) • [💼 Visit our website](https://modulyn.io) • [📧 Contact us](mailto:hello@modulyn.io)

**Ready to revolutionize the cleaning services industry with Web3 technology?** 🚀

</div>
