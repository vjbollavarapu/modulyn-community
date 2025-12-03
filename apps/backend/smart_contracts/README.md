# Modulyn Smart Contracts

This directory contains the smart contracts for Modulyn ERP's Web3 integration, located within the backend monorepo structure.

## 📁 **Directory Structure**

```
apps/backend/smart_contracts/
├── contracts/           # Solidity smart contracts
│   ├── ModulynERP.sol   # Main ERP contract
│   ├── ModulynToken.sol # Governance token
│   └── ModulynDAO.sol   # DAO governance
├── scripts/             # Deployment scripts
│   └── deploy.js        # Main deployment script
├── test/                # Test files
│   └── ModulynERP.test.js
├── hardhat.config.js    # Hardhat configuration
├── package.json         # Node.js dependencies
└── README.md           # This file
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 16+ and npm
- Hardhat development environment

### **Installation**

```bash
# Navigate to smart contracts directory
cd apps/backend/smart_contracts

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### **Development Commands**

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to local network
npm run deploy:local

# Deploy to testnet
npm run deploy:sepolia
npm run deploy:polygon
npm run deploy:moonbeam
```

## 🔗 **Backend Integration**

The smart contracts are integrated with the Django backend through:

1. **Web3 Service**: `apps/backend/apps/web3/services/blockchain_service.py`
2. **Contract Configuration**: `apps/backend/backend/settings/base.py`
3. **Environment Variables**: `apps/backend/env.example`

### **Contract Addresses**

After deployment, update the contract addresses in your backend environment:

```env
Modulyn_ERP_CONTRACT_ADDRESS=0x...
Modulyn_TOKEN_CONTRACT_ADDRESS=0x...
Modulyn_DAO_CONTRACT_ADDRESS=0x...
```

## 📊 **Contract Overview**

| Contract | Purpose | Features |
|----------|---------|----------|
| **ModulynERP** | Main ERP contract | Invoice management, payment processing, data anchoring |
| **ModulynToken** | Governance token | ERC20 with staking, vesting, rewards |
| **ModulynDAO** | Decentralized governance | Proposals, voting, treasury management |

## 🌐 **Network Support**

- **Ethereum**: Mainnet, Sepolia
- **Polygon**: Mainnet, Mumbai
- **Moonbeam**: Mainnet, Moonbase Alpha
- **Astar**: Mainnet, Shiden

## 🔧 **Development Workflow**

1. **Develop**: Write and test smart contracts
2. **Deploy**: Deploy to testnets for testing
3. **Integrate**: Update backend with contract addresses
4. **Test**: Test full integration with backend
5. **Deploy**: Deploy to mainnets for production

## 📚 **Documentation**

- [Smart Contract API](contracts/README.md)
- [Deployment Guide](scripts/README.md)
- [Testing Guide](test/README.md)
- [Backend Integration](../apps/web3/README.md)

## 🤝 **Contributing**

1. Make changes to smart contracts
2. Run tests to ensure functionality
3. Deploy to testnet for integration testing
4. Update backend configuration
5. Submit pull request

---

**Note**: This directory is part of the Modulyn ERP monorepo. The smart contracts are integrated with the Django backend for complete Web3 functionality.