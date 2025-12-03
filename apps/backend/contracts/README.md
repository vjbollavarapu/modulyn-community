# Modulyn Substrate Smart Contracts

This folder contains **ink! smart contracts** for Substrate blockchain integration. These contracts are used by the Modulyn backend for on-chain service verification, audit trails, and Web3 functionality.

## 📋 Overview

These are Rust-based smart contracts using the ink! framework, designed to be deployed on Substrate-based blockchains (Polkadot, Kusama, or custom Substrate chains).

## 📁 Structure

```
apps/backend/contracts/
├── escrow-sla/          # Escrow smart contract with SLA features
├── substrate-poc/       # Proof of concept service verification contract
├── substrate-pallet/     # Substrate pallet contract
└── artifacts/           # Compiled contract artifacts and ABI files
```

## 🔗 Integration with Backend

These contracts are integrated with the Django backend through:

1. **Python Scripts**: `apps/backend/substrate_poc/` - Deployment and interaction scripts
2. **Management Commands**: `apps/backend/backend/management/commands/demo_submit.py`
3. **Services**: `apps/backend/services/substrate_client.py` - Substrate client service

## 🚀 Quick Start

### Compile Contracts

```bash
cd apps/backend/contracts/substrate-poc
cargo +nightly contract build
```

### Deploy Contract

```bash
cd apps/backend/substrate_poc
python deploy_contract.py \
    --wasm ../contracts/substrate-poc/target/ink/service_verification_poc.wasm \
    --metadata ../contracts/substrate-poc/target/ink/metadata.json
```

### Submit Service Verification

```bash
cd apps/backend
python manage.py demo_submit \
    --contract <CONTRACT_ADDRESS> \
    --service-id 1 \
    --payload "demo"
```

## 📚 Contract Details

### substrate-poc

Proof of concept contract for service verification:
- Stores service verification records on-chain
- Uses SHA-256 hashing for data integrity
- Minimal contract for demonstration

### escrow-sla

Escrow contract with Service Level Agreement features:
- Escrow payment management
- SLA enforcement
- Dispute resolution

### substrate-pallet

Substrate pallet contract for custom runtime integration.

## 🔧 Development

### Prerequisites

- Rust toolchain (stable and nightly)
- `cargo-contract` for ink! development
- Substrate node running locally

### Building Contracts

```bash
# Install cargo-contract
cargo install cargo-contract --force

# Build contract
cargo +nightly contract build

# Test contract
cargo +nightly test
```

## 📖 Documentation

- **Contract Source**: See individual contract directories
- **Backend Integration**: See `apps/backend/substrate_poc/README.md`
- **Deployment**: See `apps/backend/substrate_poc/deploy_contract.py`

## 🤝 Contributing

When adding new contracts:
1. Create contract directory in `apps/backend/contracts/`
2. Follow ink! contract structure
3. Update backend integration scripts
4. Add tests and documentation

---

**Note**: These contracts are part of the Modulyn backend and are used for Substrate blockchain integration. For Ethereum smart contracts, see `apps/backend/smart_contracts/`.
