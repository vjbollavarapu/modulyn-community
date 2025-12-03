# Modulyn Ledger Smart Contracts

## 🎯 **Overview**

This directory contains the smart contracts for the Modulyn ERP blockchain ledger functionality. The contracts enable tamper-proof logging of financial transactions to blockchain networks, providing enhanced transparency and audit capabilities.

## 📁 **Project Structure**

```
smart_contracts/ledger/
├── contracts/
│   └── ModulynLedger.sol          # Main ledger contract
├── scripts/
│   └── deploy.js                  # Deployment script
├── test/
│   └── ModulynLedger.test.js      # Comprehensive test suite
├── hardhat.config.js              # Hardhat configuration
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js (v16 or higher)
- npm or yarn
- Git

### **Installation**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Compile contracts:**
   ```bash
   npm run compile
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Deploy to local network:**
   ```bash
   npm run deploy:local
   ```

## 📋 **Available Scripts**

### **Development**
- `npm run compile` - Compile smart contracts
- `npm run test` - Run test suite
- `npm run test:coverage` - Run tests with coverage report
- `npm run gas-report` - Run tests with gas usage report
- `npm run clean` - Clean build artifacts

### **Deployment**
- `npm run deploy:local` - Deploy to local Hardhat network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run deploy:mumbai` - Deploy to Polygon Mumbai testnet
- `npm run deploy:bsc-testnet` - Deploy to BSC testnet
- `npm run deploy:mainnet` - Deploy to Ethereum mainnet
- `npm run deploy:polygon` - Deploy to Polygon mainnet
- `npm run deploy:bsc` - Deploy to BSC mainnet

### **Verification**
- `npm run verify:sepolia` - Verify contract on Etherscan (Sepolia)
- `npm run verify:mumbai` - Verify contract on Polygonscan (Mumbai)
- `npm run verify:bsc-testnet` - Verify contract on BSCScan (Testnet)
- `npm run verify:mainnet` - Verify contract on Etherscan (Mainnet)
- `npm run verify:polygon` - Verify contract on Polygonscan (Mainnet)
- `npm run verify:bsc` - Verify contract on BSCScan (Mainnet)

### **Security & Quality**
- `npm run lint` - Run Solidity linter
- `npm run lint:fix` - Fix linting issues
- `npm run slither` - Run Slither static analysis
- `npm run mythril` - Run Mythril security analysis
- `npm run security` - Run all security checks

## 🔧 **Configuration**

### **Environment Variables**

Create a `.env` file in the project root with the following variables:

```env
# Private key for deployment (NEVER commit this to version control)
PRIVATE_KEY=your_private_key_here

# RPC endpoints
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
GOERLI_RPC_URL=https://goerli.infura.io/v3/YOUR_INFURA_KEY
MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org

# API keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key

# Optional: Gas reporting
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
REPORT_GAS=true
```

### **Network Configuration**

The project supports multiple networks:

- **Local Development**: Hardhat local network
- **Testnets**: Sepolia, Goerli, Mumbai, BSC Testnet
- **Mainnets**: Ethereum, Polygon, BSC

Network configurations are defined in `hardhat.config.js`.

## 📖 **Contract Documentation**

### **ModulynLedger Contract**

The main contract that provides blockchain ledger functionality.

#### **Key Features**

- **Transaction Logging**: Log individual financial transactions
- **Batch Processing**: Log multiple transactions efficiently
- **Hash Verification**: Verify transaction integrity
- **Audit Trail**: Complete event logging for compliance
- **Access Control**: Organization-based permissions
- **Gas Optimization**: Efficient batch operations

#### **Core Functions**

```solidity
// Log a single transaction
function logTransaction(
    string memory transactionType,
    string memory sourceModule,
    string memory sourceId,
    string memory hash,
    address organization
) external payable returns (bytes32 transactionId);

// Log multiple transactions in a batch
function logBatch(
    string[] memory transactionTypes,
    string[] memory sourceModules,
    string[] memory sourceIds,
    string[] memory hashes,
    address organization
) external payable returns (bytes32 batchId);

// Verify transaction hash
function verifyTransaction(
    bytes32 transactionId,
    string memory expectedHash
) external view returns (bool verified);

// Get transaction details
function getTransaction(bytes32 transactionId) 
    external view returns (Transaction memory transaction);
```

#### **Events**

```solidity
event TransactionLogged(
    bytes32 indexed transactionId,
    string indexed transactionType,
    address indexed organization,
    string sourceModule,
    string sourceId,
    string hash,
    uint256 timestamp
);

event BatchLogged(
    bytes32 indexed batchId,
    address indexed organization,
    bytes32[] transactionIds,
    uint256 timestamp
);

event TransactionVerified(
    bytes32 indexed transactionId,
    bool verified,
    uint256 timestamp
);
```

## 🧪 **Testing**

### **Running Tests**

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with gas report
npm run gas-report

# Run specific test file
npx hardhat test test/ModulynLedger.test.js
```

### **Test Coverage**

The test suite covers:

- ✅ Contract deployment
- ✅ Transaction logging (single and batch)
- ✅ Hash verification
- ✅ Access control
- ✅ Admin functions
- ✅ Event emission
- ✅ Error handling
- ✅ Edge cases
- ✅ Gas optimization

### **Test Structure**

```
test/
└── ModulynLedger.test.js
    ├── Deployment tests
    ├── Transaction logging tests
    ├── Batch logging tests
    ├── Verification tests
    ├── View function tests
    ├── Admin function tests
    ├── Audit event tests
    ├── Withdrawal tests
    └── Edge case tests
```

## 🚀 **Deployment**

### **Local Development**

1. **Start local Hardhat network:**
   ```bash
   npx hardhat node
   ```

2. **Deploy contracts:**
   ```bash
   npm run deploy:local
   ```

3. **Verify deployment:**
   ```bash
   npx hardhat console --network localhost
   ```

### **Testnet Deployment**

1. **Configure environment variables**
2. **Deploy to testnet:**
   ```bash
   npm run deploy:sepolia
   ```

3. **Verify contract:**
   ```bash
   npm run verify:sepolia
   ```

### **Mainnet Deployment**

⚠️ **WARNING**: Mainnet deployment requires careful consideration and testing.

1. **Final testing on testnet**
2. **Configure mainnet environment**
3. **Deploy to mainnet:**
   ```bash
   npm run deploy:mainnet
   ```

4. **Verify contract:**
   ```bash
   npm run verify:mainnet
   ```

## 🔒 **Security**

### **Security Best Practices**

- ✅ **Access Control**: Only authorized organizations can log transactions
- ✅ **Input Validation**: All inputs are validated
- ✅ **Reentrancy Protection**: ReentrancyGuard implemented
- ✅ **Pausable**: Contract can be paused in emergencies
- ✅ **Ownership**: Admin functions restricted to owner
- ✅ **Gas Limits**: Protection against gas limit attacks

### **Security Audits**

Run security analysis tools:

```bash
# Run all security checks
npm run security

# Individual tools
npm run slither      # Static analysis
npm run mythril      # Security analysis
npm run lint         # Code quality
```

### **Known Considerations**

- **Private Key Security**: Never commit private keys to version control
- **Gas Costs**: Monitor gas costs for batch operations
- **Network Congestion**: Consider network conditions for deployment
- **Upgrade Path**: Plan for contract upgrades if needed

## 📊 **Gas Optimization**

### **Optimization Strategies**

- **Batch Operations**: Group multiple transactions
- **Efficient Storage**: Optimize data structures
- **Event Usage**: Use events for off-chain data
- **Gas Limits**: Set appropriate gas limits

### **Gas Usage Estimates**

| Operation | Gas Cost (Approx.) |
|-----------|-------------------|
| Single Transaction | ~150,000 |
| Batch (10 transactions) | ~800,000 |
| Verification | ~5,000 |
| Admin Functions | ~50,000 |

## 🔧 **Integration**

### **Django Integration**

The smart contracts integrate with the Django backend:

```python
from apps.ledger.services import TransactionService

# Create transaction service
service = TransactionService(organization_id="your-org-id")

# Log transaction to blockchain
transaction = service.create_transaction(
    transaction_type="invoice",
    source_module="finance",
    source_id="INV-001",
    transaction_data={"amount": 1000.00, "currency": "USD"},
    organization_id="your-org-id"
)

# Submit to blockchain
success = service.submit_transaction(transaction)
```

### **Frontend Integration**

```javascript
// Web3 integration example
const contract = new web3.eth.Contract(abi, contractAddress);

// Log transaction
const result = await contract.methods.logTransaction(
    "invoice",
    "finance", 
    "INV-001",
    "transaction_hash",
    organizationAddress
).send({ from: userAddress, value: fee });
```

## 📚 **Documentation**

### **Additional Resources**

- [Smart Contract Ledger Implementation Plan](../../docs/technical-specs/SMART_CONTRACT_LEDGER_IMPLEMENTATION_PLAN.md)
- [Integration Guide](../../docs/technical-specs/SMART_CONTRACT_LEDGER_INTEGRATION_GUIDE.md)
- [API Documentation](../../docs/API.md)
- [Web3 Integration Guide](../../docs/web3/WEB3_TECHNICAL_IMPLEMENTATION.md)

### **Contract ABI**

The contract ABI is generated during compilation and available at:
- `artifacts/contracts/ModulynLedger.sol/ModulynLedger.json`

## 🤝 **Contributing**

### **Development Workflow**

1. **Fork the repository**
2. **Create a feature branch**
3. **Make changes**
4. **Add tests**
5. **Run security checks**
6. **Submit pull request**

### **Code Standards**

- Follow Solidity style guide
- Write comprehensive tests
- Document all functions
- Use meaningful variable names
- Add security considerations

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🆘 **Support**

For support and questions:

- **Documentation**: Check the integration guide
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub discussions
- **Security**: Report security issues privately

---

**This smart contract implementation provides a robust, secure, and efficient blockchain ledger for Modulyn ERP, enabling tamper-proof financial transaction logging with comprehensive audit capabilities.**
