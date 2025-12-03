# Modulyn Substrate Node

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Substrate](https://img.shields.io/badge/Substrate-4.0.0-purple?logo=parity&logoColor=white)](https://substrate.io/)
[![Polkadot](https://img.shields.io/badge/Polkadot-Ready-E6007A?logo=polkadot&logoColor=white)](https://polkadot.network/)

A production-ready Substrate-based blockchain node for the Modulyn ERP system with custom pallets for enterprise resource planning, decentralized identity, and on-chain governance. Fully developed for both Community and Commercial editions.

## 📋 Overview

The Modulyn Substrate Node is a custom blockchain runtime built on Substrate framework, providing on-chain capabilities for the Modulyn ERP system. It includes three custom pallets that enable blockchain-anchored audit trails, decentralized identity management, and on-chain governance.

### Key Features

- **Custom Pallets**: Three specialized pallets for ERP functionality
- **Substrate Framework**: Built on latest Substrate 4.0.0
- **Polkadot Compatible**: Ready for Polkadot/Kusama parachain deployment
- **Enterprise Ready**: Production-grade code with comprehensive testing
- **Developer Friendly**: Well-documented with examples
- **Performance Optimized**: Efficient runtime with benchmarking

## 🎯 Editions

### Community Edition
- **Target**: Open-source community, developers, Web3 Foundation grant applicants
- **Features**: 
  - All three custom pallets
  - Local development node
  - Testnet deployment support
  - Community support
  - Full source code access
- **License**: Apache-2.0
- **Deployment**: Self-hosted, local development

### Commercial Edition
- **Target**: Enterprise customers, production deployments
- **Features**:
  - All Community features
  - Production parachain deployment
  - Enhanced security features
  - Performance optimizations
  - Priority support
  - Custom pallet development
- **License**: Apache-2.0 (with commercial support)
- **Deployment**: Polkadot/Kusama parachain, dedicated nodes

**Note**: Both editions share the same codebase and are fully developed. The Commercial Edition includes additional enterprise features, support, and deployment options.

## 🏗️ Architecture

### Custom Pallets

1. **pallet-modulyn-ledger** (`pallets/modulyn-ledger/`)
   - ERP invoice and transaction ledger on-chain
   - Immutable audit trail storage
   - Transaction verification
   - Batch operations support

2. **pallet-modulyn-did** (`pallets/modulyn-did/`)
   - Decentralized identity management
   - DID document storage
   - Verification method management
   - Identity revocation

3. **pallet-modulyn-dao** (`pallets/modulyn-dao/`)
   - On-chain governance
   - Proposal creation and voting
   - Treasury management
   - Decision execution

### Node Structure

```
apps/substrate/
├── node/              # Node implementation
│   ├── src/
│   │   ├── chain_spec.rs
│   │   ├── command.rs
│   │   └── service.rs
│   └── Cargo.toml
├── runtime/           # Runtime logic
│   ├── src/
│   │   └── lib.rs
│   └── Cargo.toml
├── pallets/           # Custom pallets
│   ├── modulyn-ledger/
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── mock.rs
│   │   │   └── tests.rs
│   │   └── Cargo.toml
│   ├── modulyn-did/
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── mock.rs
│   │   │   └── tests.rs
│   │   └── Cargo.toml
│   └── modulyn-dao/
│       ├── src/
│       │   ├── lib.rs
│       │   ├── mock.rs
│       │   └── tests.rs
│       └── Cargo.toml
├── Cargo.toml         # Workspace configuration
├── Makefile           # Build automation
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- **Rust**: Stable and nightly toolchains
- **Substrate**: Development environment
- **Make**: Build automation (optional)
- **Git**: Version control

### Install Rust

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Configure toolchains
rustup default stable
rustup update
rustup update nightly
rustup target add wasm32-unknown-unknown --toolchain nightly
```

### Build

#### Using Makefile (Recommended)

```bash
# Build release version
make build

# Build with benchmarks
make build-benchmarks
```

#### Manual Build

```bash
# Build release
cargo build --release

# Build with benchmarks
cargo build --release --features runtime-benchmarks
```

### Run

#### Development Node

```bash
# Using Makefile
make run

# Manual
./target/release/modulyn-node --dev
```

#### Custom Chain Spec

```bash
# Generate chain spec
./target/release/modulyn-node build-spec --chain=local > chain-spec.json

# Run with custom spec
./target/release/modulyn-node --chain=chain-spec.json --alice
```

### Access Points

- **WebSocket RPC**: `ws://127.0.0.1:9944`
- **HTTP RPC**: `http://127.0.0.1:9933`
- **P2P Port**: `30333`

## 🧪 Testing

### Run All Tests

```bash
# Using Makefile
make test

# Manual
cargo test --all
```

### Run Specific Tests

```bash
# Test specific pallet
cargo test -p pallet-modulyn-ledger

# Test with output
cargo test -- --nocapture
```

### Integration Tests

```bash
# Run integration tests
cargo test --test integration
```

## 📊 Pallets Documentation

### pallet-modulyn-ledger

Manages on-chain ledger entries for invoices and transactions.

#### Extrinsics

- `create_ledger_entry(entry_id, entry_data)` - Create a new ledger entry
- `update_ledger_status(entry_id, status)` - Update entry status
- `anchor_transaction(tx_hash, block_data)` - Anchor transaction hash on-chain
- `batch_create_entries(entries)` - Create multiple entries in batch

#### Storage

- `LedgerEntries<T: Config>` - Map of entry ID to ledger data
- `TransactionAnchors<T: Config>` - Map of transaction hash to block data
- `EntryCount<T: Config>` - Total number of entries

#### Events

- `LedgerEntryCreated(EntryId, AccountId)`
- `LedgerStatusUpdated(EntryId, Status)`
- `TransactionAnchored(TxHash, BlockNumber)`

#### Usage Example

```rust
// Create ledger entry
let entry_data = LedgerData {
    invoice_id: 123,
    amount: 1000,
    timestamp: now(),
};
ModulynLedger::create_ledger_entry(
    RuntimeOrigin::signed(account),
    entry_id,
    entry_data,
)?;

// Anchor transaction
ModulynLedger::anchor_transaction(
    RuntimeOrigin::signed(account),
    tx_hash,
    block_data,
)?;
```

### pallet-modulyn-did

Decentralized identity management for users and organizations.

#### Extrinsics

- `create_did(did, document)` - Create a new DID document
- `update_did(did, document)` - Update DID document
- `revoke_did(did)` - Revoke a DID
- `add_verification_method(did, method)` - Add verification method
- `remove_verification_method(did, method_id)` - Remove verification method

#### Storage

- `DIDDocuments<T: Config>` - Map of DID to document data
- `VerificationMethods<T: Config>` - Map of DID to verification methods
- `RevokedDIDs<T: Config>` - Set of revoked DIDs

#### Events

- `DIDCreated(DID, AccountId)`
- `DIDUpdated(DID, AccountId)`
- `DIDRevoked(DID, AccountId)`
- `VerificationMethodAdded(DID, MethodId)`

#### Usage Example

```rust
// Create DID
let document = DIDDocument {
    id: did.clone(),
    controller: account.clone(),
    verification_methods: vec![],
};
ModulynDID::create_did(
    RuntimeOrigin::signed(account),
    did,
    document,
)?;

// Add verification method
let method = VerificationMethod {
    id: method_id,
    type_: "Ed25519VerificationKey2020".into(),
    controller: did.clone(),
    public_key: public_key,
};
ModulynDID::add_verification_method(
    RuntimeOrigin::signed(account),
    did,
    method,
)?;
```

### pallet-modulyn-dao

On-chain governance for business proposals and voting.

#### Extrinsics

- `create_proposal(title, description, voting_duration)` - Create a new proposal
- `vote(proposal_id, vote)` - Vote on a proposal
- `execute_proposal(proposal_id)` - Execute approved proposal
- `close_proposal(proposal_id)` - Close a proposal

#### Storage

- `Proposals<T: Config>` - Map of proposal ID to proposal data
- `Votes<T: Config>` - Map of (proposal ID, voter) to vote data
- `ProposalCount<T: Config>` - Total number of proposals
- `Treasury<T: Config>` - DAO treasury balance

#### Events

- `ProposalCreated(ProposalId, AccountId)`
- `VoteCast(ProposalId, AccountId, Vote)`
- `ProposalExecuted(ProposalId)`
- `ProposalClosed(ProposalId)`

#### Usage Example

```rust
// Create proposal
let proposal_id = ModulynDAO::create_proposal(
    RuntimeOrigin::signed(account),
    "Upgrade System".into(),
    "Proposal to upgrade ERP system".into(),
    7 * 24 * 60 * 60, // 7 days
)?;

// Vote on proposal
ModulynDAO::vote(
    RuntimeOrigin::signed(voter),
    proposal_id,
    Vote::Yes,
)?;

// Execute proposal
ModulynDAO::execute_proposal(
    RuntimeOrigin::signed(account),
    proposal_id,
)?;
```

## 🔗 Integration

### Django Backend Integration

The Django backend connects to this Substrate node via:

1. **WebSocket RPC**: `ws://127.0.0.1:9944`
2. **substrate-interface**: Python library for Substrate interaction
3. **Ledger Service**: `apps/backend/apps/ledger/`

#### Python Example

```python
from substrateinterface import SubstrateInterface

# Connect to node
substrate = SubstrateInterface(url="ws://127.0.0.1:9944")

# Create ledger entry
call = substrate.compose_call(
    call_module='ModulynLedger',
    call_function='create_ledger_entry',
    call_params={
        'entry_id': 123,
        'entry_data': {
            'invoice_id': 456,
            'amount': 1000,
        }
    }
)

# Submit transaction
extrinsic = substrate.create_signed_extrinsic(
    call=call,
    keypair=keypair
)
result = substrate.submit_extrinsic(extrinsic, wait_for_inclusion=True)
```

### Frontend Integration

The React frontend connects via Polkadot.js:

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';

// Connect to node
const provider = new WsProvider('ws://127.0.0.1:9944');
const api = await ApiPromise.create({ provider });

// Create ledger entry
await api.tx.modulynLedger
  .createLedgerEntry(entryId, entryData)
  .signAndSend(account);
```

## 🔧 Development

### Adding a New Pallet

1. **Create pallet directory**
   ```bash
   mkdir -p pallets/my-pallet/src
   ```

2. **Add to workspace** (`Cargo.toml`)
   ```toml
   members = [
       # ...
       "pallets/my-pallet",
   ]
   ```

3. **Implement pallet** (`pallets/my-pallet/src/lib.rs`)
   ```rust
   #![cfg_attr(not(feature = "std"), no_std)]
   
   pub use pallet::*;
   
   #[frame_support::pallet]
   pub mod pallet {
       use frame_support::pallet_prelude::*;
       use frame_system::pallet_prelude::*;
       
       #[pallet::pallet]
       pub struct Pallet<T>(_);
       
       // Implementation
   }
   ```

4. **Add to runtime** (`runtime/src/lib.rs`)
   ```rust
   construct_runtime!(
       pub enum Runtime {
           // ...
           ModulynMyPallet: pallet_my_pallet,
       }
   );
   ```

### Running Benchmarks

```bash
# Build with benchmarks
cargo build --release --features runtime-benchmarks

# Run benchmarks
./target/release/modulyn-node benchmark pallet \
    --pallet=pallet_modulyn_ledger \
    --extrinsic='*' \
    --steps=50 \
    --repeat=20 \
    --output=./pallets/modulyn-ledger/src/weights.rs
```

### Code Formatting

```bash
# Format code
cargo fmt

# Check formatting
cargo fmt --check
```

### Linting

```bash
# Run clippy
cargo clippy --all-targets --all-features -- -D warnings
```

## 🌐 Deployment

### Local Development

```bash
# Run dev node
./target/release/modulyn-node --dev

# Run with specific account
./target/release/modulyn-node --dev --alice
```

### Testnet Deployment

1. **Generate chain spec**
   ```bash
   ./target/release/modulyn-node build-spec --chain=testnet > testnet-spec.json
   ```

2. **Generate raw chain spec**
   ```bash
   ./target/release/modulyn-node build-spec \
       --chain=testnet-spec.json \
       --raw > testnet-spec-raw.json
   ```

3. **Deploy to testnet**
   ```bash
   ./target/release/modulyn-node \
       --chain=testnet-spec-raw.json \
       --validator \
       --name=MyNode
   ```

### Parachain Deployment

1. **Register as parachain** on Polkadot/Kusama
2. **Upload runtime** via runtime upgrade
3. **Connect collators** to relay chain
4. **Monitor** via Polkadot.js Apps

## 📖 Documentation

### Pallets

- **Modulyn Ledger**: See `pallets/modulyn-ledger/README.md`
- **Modulyn DID**: See `pallets/modulyn-did/README.md`
- **Modulyn DAO**: See `pallets/modulyn-dao/README.md`

### API Documentation

Generate documentation:

```bash
# Generate docs
cargo doc --open

# Generate docs for specific pallet
cargo doc -p pallet-modulyn-ledger --open
```

## 🔐 Security

### Best Practices

- **Private Keys**: Never commit private keys
- **Runtime Upgrades**: Test thoroughly before deploying
- **Access Control**: Implement proper access control in pallets
- **Input Validation**: Validate all inputs in extrinsics
- **Error Handling**: Handle errors gracefully

### Security Audits

- Regular security audits recommended
- Follow Substrate security guidelines
- Keep dependencies updated
- Monitor for vulnerabilities

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
cargo test

# Run specific test
cargo test test_create_ledger_entry
```

### Integration Tests

```bash
# Run integration tests
cargo test --test integration
```

### Test Coverage

```bash
# Install cargo-tarpaulin
cargo install cargo-tarpaulin

# Run coverage
cargo tarpaulin --out Html
```

## 📊 Monitoring

### Connect with Polkadot.js Apps

1. Open [Polkadot.js Apps](https://polkadot.js.org/apps/)
2. Click network selector (top left)
3. Select "Development" → "Local Node"
4. Ensure endpoint is `ws://127.0.0.1:9944`
5. Click "Switch"

### Metrics

Monitor node metrics:
- Block production rate
- Transaction throughput
- Storage usage
- Network connectivity

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run tests and benchmarks
6. Submit a pull request

### Code Standards

- **Rust Style**: Follow Rust style guide
- **Documentation**: Comprehensive doc comments
- **Testing**: High test coverage
- **Benchmarks**: Performance benchmarks for extrinsics

## 📄 License

Apache-2.0 License

See [LICENSE](../../LICENSE) for details.

## 🆘 Support

### Community Support

- **GitHub Issues**: [Report bugs](https://github.com/vjbollavarapu/modulyn-community/issues)
- **Documentation**: [Read the docs](../../README.md)
- **Discussions**: [GitHub Discussions](https://github.com/vjbollavarapu/modulyn-community/discussions)

### Commercial Support

- **Email**: support@modulyn.io
- **Priority Support**: Available for Commercial Edition customers

## 📚 Resources

- [Substrate Documentation](https://docs.substrate.io/)
- [Polkadot Documentation](https://wiki.polkadot.network/)
- [Substrate Recipes](https://substrate.dev/recipes/)
- [Polkadot.js Documentation](https://polkadot.js.org/docs/)

## 🗺️ Roadmap

See our [Roadmap](../../docs/ROADMAP.md) for upcoming features.

### Upcoming Features

- Additional custom pallets
- Cross-chain integration
- Enhanced governance features
- Performance optimizations
- Advanced analytics

---

**Built with ❤️ for the Modulyn community and enterprise users worldwide.**

**Note**: This Substrate node is fully developed and maintained for both Community and Commercial editions of Modulyn ERP.
