# Modulyn Frontend

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0.7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Web3](https://img.shields.io/badge/Web3-Ready-F16822?logo=web3.js&logoColor=white)](https://web3.foundation/)

A modern, production-ready React frontend for the Modulyn ERP system with comprehensive Web3 integration, built with TypeScript, Tailwind CSS, and Radix UI components.

## 📋 Overview

The Modulyn Frontend is a fully-featured, enterprise-grade React application that provides a complete user interface for the Modulyn ERP system. It supports both **Community Edition** and **Commercial Edition** deployments, offering a consistent, high-quality user experience across all editions.

### Key Features

- **Modern React Architecture**: Built with React 18, TypeScript, and Vite for optimal performance
- **Comprehensive UI Components**: Radix UI components with custom styling and theming
- **Web3 Integration**: Full support for Polkadot.js, MetaMask, and wallet connectivity
- **Responsive Design**: Mobile-first design with full desktop support
- **Dark/Light Themes**: Customizable theming system with dark mode support
- **Real-Time Updates**: TanStack Query for efficient server state management
- **Type Safety**: Full TypeScript coverage for type-safe development
- **Accessibility**: WCAG-compliant components with keyboard navigation
- **Performance Optimized**: Code splitting, lazy loading, and optimized builds

## 🎯 Editions

### Community Edition
- **Target**: Open-source community, developers, small businesses
- **Features**: 
  - Full ERP functionality
  - Web3 wallet integration
  - Self-hosting support
  - Community support
- **License**: MIT
- **Deployment**: Self-hosted, Docker, Vercel

### Commercial Edition
- **Target**: Enterprise customers, partners, resellers
- **Features**:
  - All Community features
  - White-label theming
  - Partner/reseller portal
  - Advanced analytics dashboard
  - Priority support
  - Custom branding
- **License**: Commercial
- **Deployment**: Cloud-hosted, managed service

**Note**: Both editions share the same codebase and are fully developed. The Commercial Edition includes additional features and support options.

## 🛠️ Technology Stack

### Core Framework
- **React 18.3.1**: Modern React with hooks and concurrent features
- **TypeScript 5.8.3**: Type-safe development
- **Vite 6.0.7**: Fast build tool and dev server
- **React Router 7.1.1**: Client-side routing

### UI & Styling
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **next-themes**: Theme management
- **class-variance-authority**: Component variants

### State Management
- **TanStack Query 5.83.0**: Server state management
- **React Context**: Client state management
- **React Hook Form 7.54.0**: Form state management

### Web3 Integration
- **@polkadot/api 16.4.9**: Polkadot blockchain interaction
- **@polkadot/extension-dapp 0.62.2**: Wallet extension integration
- **@polkadot/util 13.5.7**: Polkadot utilities

### Data Visualization
- **Recharts 2.15.1**: Chart library for analytics

### Testing
- **Vitest 2.1.9**: Unit testing framework
- **Playwright 1.49.1**: End-to-end testing
- **Testing Library**: Component testing utilities

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm/yarn/pnpm**: Package manager
- **Git**: Version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vjbollavarapu/modulyn-community.git
   cd modulyn-community/apps/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000 (backend must be running)

## 📁 Project Structure

```
apps/frontend/
├── public/                 # Static assets
│   ├── modulyn-logo.png   # Application logo
│   └── favicon.ico        # Favicon
├── src/
│   ├── components/        # Reusable React components
│   │   ├── auth/         # Authentication components
│   │   ├── common/        # Common UI components
│   │   ├── did/          # DID authentication
│   │   ├── landing/      # Landing page components
│   │   ├── layout/       # Layout components
│   │   ├── theme/        # Theme components
│   │   ├── wallet/       # Web3 wallet components
│   │   └── ui/           # Base UI components
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── EnhancedAuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   │   ├── LandingPage.tsx
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── services/          # API and service integrations
│   │   ├── api.ts        # API client
│   │   └── wallet/       # Wallet services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── web3/             # Web3 integration
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── tests/                # Test files
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── README.md            # This file
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run build:dev        # Build in development mode
npm run build:prod       # Build in production mode
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues

# Testing
npm run test             # Run unit tests with Vitest
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run E2E tests with Playwright
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:headed  # Run E2E tests in headed mode
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1

# Web3 Configuration
VITE_WEB3_ENABLED=true
VITE_POLKADOT_WS_URL=ws://127.0.0.1:9944
VITE_SUBSTRATE_NODE_URL=ws://127.0.0.1:9944

# Feature Flags
VITE_ENABLE_WEB3=true
VITE_ENABLE_DID=true
VITE_ENABLE_IPFS=true

# Application
VITE_APP_NAME=Modulyn
VITE_APP_VERSION=1.0.0
```

### Adding New Components

1. **Create component file**
   ```typescript
   // src/components/my-component/MyComponent.tsx
   import { cn } from "@/lib/utils";
   
   interface MyComponentProps {
     className?: string;
   }
   
   export function MyComponent({ className }: MyComponentProps) {
     return (
       <div className={cn("base-styles", className)}>
         {/* Component content */}
       </div>
     );
   }
   ```

2. **Add to component index** (if needed)
   ```typescript
   // src/components/index.ts
   export { MyComponent } from "./my-component/MyComponent";
   ```

### Theming

The application uses a comprehensive theming system:

```typescript
// Use theme in components
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { theme, setTheme, isDark } = useTheme();
  
  return (
    <button onClick={() => setTheme(isDark ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
}
```

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts
```

### Test Structure

```
tests/
├── unit/              # Unit tests
├── e2e/              # End-to-end tests
│   ├── auth.spec.ts
│   └── ...
└── setup.ts          # Test setup
```

## 📚 API Integration

### API Client

The frontend uses a centralized API client:

```typescript
import { api } from "@/services/api";

// GET request
const data = await api.get("/api/v1/organizations/");

// POST request
const result = await api.post("/api/v1/invoices/", {
  client: "123",
  amount: 1000,
});
```

### React Query Integration

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";

// Query
const { data, isLoading } = useQuery({
  queryKey: ["invoices"],
  queryFn: () => api.get("/api/v1/invoices/"),
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => api.post("/api/v1/invoices/", data),
});
```

## 🌐 Web3 Integration

### Wallet Connection

```typescript
import { usePolkadot } from "@/web3/polkadotWallet";

function WalletButton() {
  const { connect, disconnect, accounts, isConnected } = usePolkadot();
  
  return (
    <button onClick={connect}>
      {isConnected ? accounts[0]?.address : "Connect Wallet"}
    </button>
  );
}
```

### Substrate Transactions

```typescript
import { submitTransaction } from "@/web3/substrateTransactions";

const hash = await submitTransaction({
  contractAddress: "5F...",
  method: "store",
  params: { service_id: 1, data_hash: "0x..." },
});
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
npm run build:prod

# The build output will be in the `dist/` directory
```

### Vercel Deployment

1. **Connect repository to Vercel**
2. **Configure build settings**:
   - Build Command: `npm run build:prod`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set environment variables** in Vercel dashboard

### Docker Deployment

```bash
# Build Docker image
docker build -t modulyn-frontend .

# Run container
docker run -p 3000:80 modulyn-frontend
```

### Self-Hosting

1. **Build the application**
   ```bash
   npm run build:prod
   ```

2. **Serve with Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## 🔐 Security

### Best Practices

- **Environment Variables**: Never commit `.env` files
- **API Keys**: Store securely, use environment variables
- **Authentication**: Always use HTTPS in production
- **CORS**: Configure properly for API access
- **Content Security Policy**: Implement CSP headers

### Security Headers

Configure security headers in your deployment:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## 📖 Documentation

### Component Documentation

- **UI Components**: See `src/components/ui/` for base components
- **Layout Components**: See `src/components/layout/` for layout components
- **Web3 Components**: See `src/components/wallet/` for Web3 components

### API Documentation

- **Backend API**: http://localhost:8000/api/docs/
- **OpenAPI Spec**: Available at `/api/schema/`

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests
5. Run linting: `npm run lint`
6. Commit: `git commit -m 'Add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow ESLint rules
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

## 📄 License

- **Community Edition**: MIT License
- **Commercial Edition**: Commercial License

See [LICENSE](../../LICENSE) for details.

## 🆘 Support

### Community Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/vjbollavarapu/modulyn-community/issues)
- **Documentation**: [Read the docs](../../README.md)
- **Discussions**: [GitHub Discussions](https://github.com/vjbollavarapu/modulyn-community/discussions)

### Commercial Support

- **Email**: support@modulyn.io
- **Priority Support**: Available for Commercial Edition customers

## 🗺️ Roadmap

See our [Roadmap](../../docs/ROADMAP.md) for upcoming features.

### Upcoming Features

- Enhanced mobile experience
- Progressive Web App (PWA) support
- Advanced analytics dashboard
- Real-time collaboration features
- Enhanced Web3 integrations

## 🙏 Acknowledgments

- React and TypeScript communities
- Radix UI for accessible components
- TanStack for excellent libraries
- Web3 Foundation for blockchain support
- All open-source contributors

---

**Built with ❤️ for the Modulyn community and enterprise users worldwide.**

**Note**: This frontend is fully developed and maintained for both Community and Commercial editions of Modulyn ERP.
