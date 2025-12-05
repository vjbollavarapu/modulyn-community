# Modulyn Runtime

This directory contains the Substrate runtime for Modulyn ERP with integrated custom pallets.

## Overview

The Modulyn runtime integrates three custom pallets:
- **ModulynLedger**: On-chain invoice and transaction ledger
- **ModulynDid**: W3C DID-compliant decentralized identity
- **ModulynDao**: On-chain governance with proposals and voting

## Structure

- `src/lib.rs`: Main runtime file with all pallet configurations
- `Cargo.toml`: Runtime dependencies and features

## Configuration

### Standard FRAME Pallets
- `System`: Core system functionality
- `Balances`: Account balance management
- `Timestamp`: Block timestamp
- `Aura`: Block authoring
- `Grandpa`: Finality gadget
- `TransactionPayment`: Transaction fee handling
- `Sudo`: Administrative control

### Modulyn Custom Pallets

#### ModulynLedger
```rust
impl pallet_ledger::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
    type MaxMetadataLength = MaxMetadataLength;  // 1024 bytes
    type MaxInvoicesPerClient = MaxInvoicesPerClient;  // 1000 invoices
}
```

#### ModulynDid
```rust
impl pallet_did::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type MaxPublicKeyLength = MaxPublicKeyLength;  // 256 bytes
    type MaxMetadataLength = MaxDidMetadataLength;  // 1024 bytes
    type MaxDidLength = MaxDidLength;  // 256 bytes
}
```

#### ModulynDao
```rust
impl pallet_dao::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type Currency = Balances;
    type MaxTitleLength = MaxTitleLength;  // 256 bytes
    type MaxDescriptionLength = MaxDescriptionLength;  // 2048 bytes
    type MinVotingPeriod = MinVotingPeriod;  // 10 blocks
    type MaxVotingPeriod = MaxVotingPeriod;  // 1000 blocks
    type ProposalDeposit = ProposalDeposit;  // 1000 units
}
```

## Building

```bash
cd apps/substrate
cargo build --release -p modulyn-runtime
```

## Next Steps

To complete the node setup:
1. Create node structure (or use substrate-node-template)
2. Configure chain spec
3. Set up service builder
4. Build and run the node

See `../IMPLEMENTATION_STATUS.md` for detailed integration steps.

