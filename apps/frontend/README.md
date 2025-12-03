# Modulyn: Intelligent Enterprise Resource Planning

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Web3](https://img.shields.io/badge/Web3-F16822?logo=web3.js&logoColor=white)](https://web3.foundation/)

A comprehensive, self-hosted ERP solution with Web3 integration, designed for developers, small businesses, and grant foundations.

## 🚀 Overview

Modulyn is a full-stack enterprise resource planning system that combines traditional business management with cutting-edge Web3 technologies. It offers both Community and Commercial editions to serve different market needs.

### Key Features

- **Self-Hosted Architecture**: Complete data control and privacy
- **Web3 Integration**: Decentralized identity, on-chain audit logs, and IPFS storage
- **Community Support**: Active community and open-source development
- **Custom Theming**: Flexible theming and customization options
- **Role-Based Access Control**: Granular permissions and security
- **Real-Time Analytics**: Advanced reporting and business intelligence
- **API-First Design**: RESTful APIs with comprehensive documentation

## 📋 Editions

### Community Edition (Free)
- **Target**: Open-source community, Web3 Foundation grant applicants
- **Features**: 
  - Core ERP functionality
  - Web3 integration (DID, Substrate, IPFS)
  - Self-hosting capability
  - Community support
- **License**: MIT
- **Deployment**: Docker, self-hosted

### Commercial Edition (SaaS)
- **Target**: Enterprise customers, partners, resellers
- **Features**:
  - All Community features
  - Self-hosted ERP platform
  - Partner/reseller portal
  - White-label theming
  - Priority support
  - Advanced analytics
- **License**: Commercial
- **Deployment**: Cloud-hosted, managed service

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **React Query** for state management
- **React Router** for navigation
- **Recharts** for data visualization

### Backend
- **Django** with Django REST Framework
- **PostgreSQL** database
- **Redis** for caching
- **Celery** for background tasks
- **JWT** authentication

### Web3 Integration
- **Polkadot.js** for blockchain interaction
- **Substrate** for on-chain audit logs
- **IPFS** for decentralized file storage
- **MetaMask** and wallet integration

### Infrastructure
- **Docker** containerization
- **Nginx** reverse proxy
- **Let's Encrypt** SSL certificates
- **GitHub Actions** CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.9+ and pip
- Docker and Docker Compose
- Git

### Community Edition Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/Modulyn.git
   cd Modulyn
   ```

2. **Run the installer**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

### Commercial Edition Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Initialize Database**
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py createsuperuser
   ```

## 📁 Project Structure

```
Modulyn/
├── apps/
│   ├── frontend/                 # React frontend
│   │   ├── src/
│   │   │   ├── components/       # Reusable components
│   │   │   ├── pages/           # Page components
│   │   │   ├── contexts/        # React contexts
│   │   │   ├── hooks/           # Custom hooks
│   │   │   ├── services/        # API services
│   │   │   └── utils/           # Utility functions
│   │   ├── public/              # Static assets
│   │   └── package.json
│   └── backend/                 # Django backend
│       ├── Modulyn/          # Main Django project
│       ├── apps/               # Django applications
│       │   ├── core/           # Core functionality
│       │   ├── accounts/       # User management
│       │   ├── inventory/      # Inventory management
│       │   ├── hr/             # Human resources
│       │   ├── finance/        # Financial management
│       │   └── partners/       # Partner management
│       └── requirements.txt
├── docs/                       # Documentation
├── docker-compose.yml          # Docker configuration
├── Dockerfile                  # Docker image
├── install.sh                  # Installation script
└── README.md
```

## 🔧 Development

### Frontend Development

1. **Install dependencies**
   ```bash
   cd apps/frontend
   npm install
   ```

2. **Start development server**
   ```bash
npm run dev
```

3. **Build for production**
   ```bash
   npm run build
   ```

### Backend Development

1. **Create virtual environment**
   ```bash
   cd apps/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run migrations**
   ```bash
   python manage.py migrate
   ```

4. **Start development server**
   ```bash
   python manage.py runserver
   ```

### Web3 Development

1. **Configure Web3 providers**
   ```bash
   # Set up Polkadot.js
   npm install @polkadot/api @polkadot/util
   
   # Configure IPFS
   npm install ipfs-http-client
   ```

2. **Test Web3 features**
   ```bash
   npm run test:web3
   ```

## 🧪 Testing

### Frontend Tests
```bash
cd apps/frontend
npm run test
npm run test:coverage
```

### Backend Tests
```bash
cd apps/backend
python manage.py test
```

### Integration Tests
```bash
npm run test:integration
```

## 📚 API Documentation

### Swagger UI
Access the interactive API documentation at:
- Development: http://localhost:8000/docs/
- Production: https://your-domain.com/docs/

### API Endpoints

#### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Refresh JWT token

#### Organization
- `GET /api/organizations/` - List organizations
- `POST /api/organizations/` - Create organization
- `PATCH /api/organizations/{id}/` - Update organization

#### Partner Management
- `GET /api/partners/` - List partners
- `POST /api/partners/` - Create partner
- `GET /api/partners/{id}/customers/` - Partner customers
- `GET /api/partners/{id}/commissions/` - Commission reports

#### Web3 Integration
- `POST /api/web3/did/authenticate/` - DID authentication
- `POST /api/web3/audit-logs/` - Store audit log on-chain
- `POST /api/web3/ipfs/upload/` - Upload to IPFS

## 🔐 Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Multi-factor authentication support
- API rate limiting

### Data Protection
- Self-hosted data control
- Encryption at rest and in transit
- GDPR compliance features
- Audit logging

### Web3 Security
- Cryptographic signature verification
- Decentralized identity validation
- On-chain audit trails
- Secure key management

## 🌐 Web3 Features

### Decentralized Identity (DID)
- Support for multiple wallet providers
- Polkadot.js integration
- MetaMask compatibility
- Substrate Connect support

### On-Chain Audit Logs
- Immutable audit trail on Substrate
- Transaction verification
- Event tracking
- Compliance reporting

### Decentralized Storage
- IPFS file storage
- Content addressing
- Distributed file system
- Redundancy and availability

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Standards
- TypeScript for frontend
- Python PEP 8 for backend
- ESLint and Prettier for code formatting
- Comprehensive test coverage

## 📄 License

- **Community Edition**: MIT License
- **Commercial Edition**: Commercial License

See [LICENSE](LICENSE) for details.

## 🆘 Support

### Community Support
- GitHub Issues: [Report bugs and request features](https://github.com/your-org/Modulyn/issues)
- Discord: [Join our community](https://discord.gg/your-discord)
- Documentation: [Read the docs](https://docs.Modulyn.io)

### Commercial Support
- Email: support@Modulyn.io
- Phone: +1 (555) 123-4567
- Priority support for Enterprise customers

## 🗺️ Roadmap

See our [Roadmap](docs/roadmap.md) for upcoming features and Web3 Foundation grant alignment.

### Upcoming Features
- Advanced AI/ML integration
- Mobile applications
- Additional blockchain support
- Enhanced analytics
- Workflow automation

## 🙏 Acknowledgments

- Web3 Foundation for grant support
- Polkadot ecosystem for blockchain infrastructure
- React and Django communities
- Open source contributors

## 📞 Contact

- **Website**: https://Modulyn.io
- **Email**: info@Modulyn.io
- **Twitter**: [@Modulyn_io](https://twitter.com/Modulyn_io)
- **LinkedIn**: [Modulyn](https://linkedin.com/company/Modulyn)

---

**Built with ❤️ for the Web3 community and enterprise users worldwide.**