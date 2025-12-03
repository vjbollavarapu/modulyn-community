# Integrating Modulyn Components

## 🎯 Overview

This tutorial shows how developers can reuse and integrate Modulyn's components (Substrate pallets, Django apps, React components) into their own projects.

---

## 🔧 Reusable Components

### **1. Substrate Pallets**

Modulyn provides three custom Substrate pallets that can be integrated into any Substrate-based blockchain:

#### **Modulyn Ledger Pallet**
- **Purpose**: On-chain transaction ledger for audit trails
- **Location**: `apps/substrate/pallets/modulyn-ledger/`
- **Use Case**: Log financial transactions, invoices, payments on-chain

#### **Modulyn DID Pallet**
- **Purpose**: Decentralized identity management
- **Location**: `apps/substrate/pallets/modulyn-did/`
- **Use Case**: Create and manage DIDs, verifiable credentials

#### **Modulyn DAO Pallet**
- **Purpose**: On-chain governance and voting
- **Location**: `apps/substrate/pallets/modulyn-dao/`
- **Use Case**: Community governance, proposal voting, treasury management

---

## 📦 Integration Examples

### **Example 1: Using Modulyn Ledger Pallet**

#### **Step 1: Add to Your Substrate Runtime**

```rust
// runtime/src/lib.rs

use pallet_modulyn_ledger;

pub type Block = frame_system::mocking::MockBlock<Runtime>;

impl pallet_modulyn_ledger::Config for Runtime {
    type Event = Event;
    type Currency = Balances;
}

construct_runtime!(
    pub enum Runtime where
        Block = Block,
        NodeBlock = opaque::Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        // ... other pallets
        ModulynLedger: pallet_modulyn_ledger::{Pallet, Call, Storage, Event<T>},
    }
);
```

#### **Step 2: Use in Your Code**

```rust
// Create a ledger entry
let call = substrate.compose_call(
    call_module='ModulynLedger',
    call_function='create_ledger_entry',
    call_params={
        'transaction_type': 'invoice',
        'data_hash': '0x' + '12' * 32,
        'amount': 1000000
    }
);
```

#### **Step 3: Query Ledger Entries**

```javascript
// In Polkadot.js
const entry = await api.query.ModulynLedger.ledgerEntries(entryId);
console.log(entry.toHuman());
```

---

### **Example 2: Using Django Web3 Module**

#### **Step 1: Install Modulyn SDK**

```bash
pip install modulyn-sdk
```

#### **Step 2: Import and Use**

```python
from modulyn_sdk import ModulynClient
from modulyn_sdk.web3 import BlockchainService

# Initialize client
client = ModulynClient(
    api_url="https://api.modulyn.io",
    api_key="your-api-key"
)

# Use Web3 services
blockchain = BlockchainService(client)

# Create on-chain anchor
anchor = blockchain.create_anchor(
    data_type="invoice",
    data_hash="0x1234...",
    network="substrate"
)

print(f"Transaction hash: {anchor.tx_hash}")
```

---

### **Example 3: Using React Web3 Components**

#### **Step 1: Install Modulyn Frontend SDK**

```bash
npm install @modulyn/frontend-sdk
```

#### **Step 2: Use Components**

```typescript
import { WalletConnect, SubstrateTransaction } from '@modulyn/frontend-sdk';

function MyApp() {
  const [account, setAccount] = useState<string | null>(null);

  return (
    <div>
      <WalletConnect
        onConnect={(account) => setAccount(account)}
        networks={['polkadot', 'kusama']}
      />
      
      {account && (
        <SubstrateTransaction
          account={account}
          pallet="ModulynLedger"
          method="create_ledger_entry"
          params={{
            transaction_type: 'invoice',
            data_hash: '0x1234...',
            amount: 1000000
          }}
          onSuccess={(txHash) => console.log('Success:', txHash)}
        />
      )}
    </div>
  );
}
```

---

## 🔌 API Integration

### **REST API Endpoints**

Modulyn provides a comprehensive REST API that can be integrated into any application:

#### **Base URL**
```
https://api.modulyn.io/api/v1/
```

#### **Authentication**
```bash
# Get JWT token
curl -X POST https://api.modulyn.io/api/auth/login/ \
  -d '{"username":"user","password":"pass"}'

# Use token in requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.modulyn.io/api/v1/invoices/
```

#### **Available Endpoints**
- `/api/v1/invoices/` - Invoice management
- `/api/v1/payments/` - Payment processing
- `/api/v1/web3/anchors/` - Blockchain anchors
- `/api/v1/did/` - Decentralized identity
- `/api/v1/ledger/` - On-chain ledger entries

---

## 📚 SDKs and Libraries

### **Python SDK**

```bash
pip install modulyn-sdk
```

**Usage**:
```python
from modulyn_sdk import ModulynClient

client = ModulynClient(api_url="https://api.modulyn.io")
invoices = client.invoices.list()
```

**Documentation**: See `packages/py-sdk/README.md`

### **JavaScript SDK**

```bash
npm install @modulyn/js-sdk
```

**Usage**:
```javascript
import { ModulynClient } from '@modulyn/js-sdk';

const client = new ModulynClient({
  apiUrl: 'https://api.modulyn.io'
});

const invoices = await client.invoices.list();
```

**Documentation**: See `packages/js-sdk/README.md`

---

## 🎨 Customization Examples

### **Custom Substrate Pallet Based on Modulyn**

```rust
// Use Modulyn pallets as reference
use pallet_modulyn_ledger as ledger;

#[pallet::pallet]
pub struct Pallet<T>(_);

#[pallet::call]
impl<T: Config> Pallet<T> {
    #[pallet::weight(10_000)]
    pub fn my_custom_function(origin: OriginFor<T>) -> DispatchResult {
        // Use Modulyn ledger pallet
        ledger::Pallet::<T>::create_ledger_entry(
            origin,
            "custom_type".into(),
            [0u8; 32].into(),
            None
        )?;
        
        Ok(())
    }
}
```

### **Custom Django App Using Modulyn Modules**

```python
# my_app/models.py
from apps.web3.models import OnChainAnchor

class MyCustomModel(models.Model):
    name = models.CharField(max_length=100)
    anchor = models.ForeignKey(OnChainAnchor, on_delete=models.CASCADE)
    
    def create_blockchain_anchor(self):
        # Use Modulyn's anchor service
        from apps.web3.services import anchor_service
        return anchor_service.create_anchor(
            data_type="my_custom_type",
            data_hash=self.get_data_hash()
        )
```

---

## 🔗 Integration Patterns

### **Pattern 1: Microservices Architecture**

```
Your Application
    ├─ Modulyn API (REST)
    ├─ Modulyn Substrate Node
    └─ Your Custom Services
```

### **Pattern 2: Embedded Components**

```
Your Application
    ├─ Modulyn React Components (embedded)
    ├─ Modulyn Django Apps (embedded)
    └─ Your Custom Code
```

### **Pattern 3: SDK Integration**

```
Your Application
    ├─ Modulyn Python/JS SDK
    └─ Your Custom Logic
```

---

## 📖 Best Practices

### **1. Security**
- Always validate inputs before sending to blockchain
- Use environment variables for API keys
- Implement proper error handling
- Follow security best practices

### **2. Performance**
- Cache blockchain data when possible
- Use batch operations for multiple transactions
- Optimize gas usage for smart contracts
- Implement rate limiting

### **3. Testing**
- Write unit tests for integrations
- Test with testnets before mainnet
- Use mock services for development
- Test error scenarios

---

## 🚀 Real-World Examples

### **Example: E-Commerce Platform Integration**

```python
# Integrate Modulyn for order verification
from modulyn_sdk import ModulynClient

client = ModulynClient()

def create_order_verification(order):
    # Create blockchain anchor for order
    anchor = client.web3.create_anchor(
        data_type="order",
        data_hash=order.get_hash(),
        network="substrate"
    )
    
    # Store anchor reference
    order.blockchain_anchor = anchor.tx_hash
    order.save()
    
    return anchor
```

### **Example: Supply Chain Integration**

```typescript
// Track shipments on blockchain
import { ModulynClient } from '@modulyn/js-sdk';

const client = new ModulynClient();

async function trackShipment(shipmentId: string) {
  // Create ledger entry for shipment
  const entry = await client.ledger.createEntry({
    transaction_type: 'shipment',
    data_hash: shipmentId,
    amount: 0
  });
  
  return entry;
}
```

---

## 📞 Support

- **Documentation**: See [Documentation Index](../../README.md#-documentation-index)
- **Issues**: [GitHub Issues](https://github.com/vjbollavarapu/modulyn-community/issues)
- **Discussions**: [GitHub Discussions](https://github.com/vjbollavarapu/modulyn-community/discussions)
- **Email**: dev@modulyn.io

---

**Happy Integrating! 🚀**

