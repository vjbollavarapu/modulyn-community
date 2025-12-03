# Modulyn Audit Trail

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Django](https://img.shields.io/badge/Django-4.2.7-green?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Web3](https://img.shields.io/badge/Web3-Ready-F16822?logo=web3.js&logoColor=white)](https://web3.foundation/)

A comprehensive, blockchain-anchored audit trail system for the Modulyn ERP platform, providing tamper-proof logging and verification capabilities for both Community and Commercial editions.

## 📋 Overview

The Modulyn Audit Trail module provides enterprise-grade audit logging with blockchain integration, Merkle tree verification, and IPFS storage. It captures all critical system events, financial transactions, and user actions with cryptographic proof of integrity.

### Key Features

- **Comprehensive Event Tracking**: Captures all system, financial, and user events
- **Blockchain Anchoring**: Immutable audit records on Substrate/Ethereum
- **Merkle Tree Verification**: Efficient batch verification of audit logs
- **IPFS Storage**: Decentralized storage for audit event data
- **Hash Verification**: SHA-256 hashing for data integrity
- **Real-Time Logging**: Automatic event capture from all modules
- **Verification Tools**: Built-in integrity verification commands
- **REST API**: Complete API for audit trail management
- **Compliance Ready**: GDPR, SOX, and regulatory compliance support

## 🎯 Editions

### Community Edition
- **Target**: Open-source community, developers, small businesses
- **Features**: 
  - Full audit event capture
  - Hash-based verification
  - IPFS storage
  - Basic blockchain anchoring
  - REST API access
- **License**: MIT

### Commercial Edition
- **Target**: Enterprise customers, regulated industries
- **Features**:
  - All Community features
  - Advanced blockchain anchoring
  - Enhanced Merkle tree verification
  - Compliance reporting
  - Advanced analytics
  - Priority support
- **License**: Commercial

**Note**: Both editions share the same codebase and are fully developed. The Commercial Edition includes additional enterprise features and compliance tools.

## 🏗️ Architecture

### Core Components

1. **Models** (`models.py`)
   - `AuditEvent`: Main audit event model
   - `AuditHash`: Hash records for verification
   - `MerkleTree`: Merkle tree structures
   - `OnChainRecord`: Blockchain-anchored records

2. **Services** (`services/`)
   - `AuditService`: High-level audit management
   - `HashService`: Hash generation and verification
   - `MerkleService`: Merkle tree operations
   - `BlockchainService`: Blockchain integration
   - `IPFSService`: IPFS storage integration

3. **API** (`views.py`, `serializers.py`, `urls.py`)
   - RESTful API endpoints
   - Event creation and retrieval
   - Verification endpoints
   - Statistics and reporting

## 📊 Event Types

### Financial Events
- `invoice_created`, `invoice_updated`, `invoice_deleted`
- `payment_created`, `payment_processed`, `payment_failed`
- `expense_created`, `expense_approved`, `expense_rejected`

### Sales Events
- `sale_created`, `sale_updated`
- `client_created`, `client_updated`
- `contract_created`, `contract_updated`

### HR Events
- `employee_created`, `employee_updated`
- `payroll_processed`
- `leave_approved`, `leave_rejected`

### System Events
- `user_login`, `user_logout`
- `permission_granted`, `permission_revoked`
- `data_export`, `system_backup`, `system_restore`

## 🚀 Quick Start

### Installation

The audit trail module is included in the Modulyn backend. No additional installation is required.

### Configuration

Add to `INSTALLED_APPS` in Django settings:

```python
INSTALLED_APPS = [
    # ...
    'apps.audit_trail',
]
```

### Environment Variables

```bash
# Blockchain Configuration
WEB3_ENABLED=True
WEB3_PROVIDER_URL=http://localhost:8545
SUBSTRATE_WS=ws://127.0.0.1:9944

# IPFS Configuration
IPFS_ENABLED=True
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Audit Trail Configuration
AUDIT_AUTO_HASH=True
AUDIT_AUTO_STORE_ON_CHAIN=False
AUDIT_AUTO_STORE_IPFS=False
```

### Database Migration

```bash
python manage.py migrate apps.audit_trail
```

## 💻 Usage

### Programmatic Usage

#### Capture Audit Event

```python
from apps.audit_trail.services import AuditService

audit_service = AuditService()

event = audit_service.capture_event(
    event_type='invoice_created',
    module='finance',
    object_id='123',
    object_type='Invoice',
    data={
        'invoice_number': 'INV-001',
        'amount': 1000.00,
        'client': 'Client ABC'
    },
    user=request.user,
    ip_address=request.META.get('REMOTE_ADDR'),
    user_agent=request.META.get('HTTP_USER_AGENT')
)
```

#### Verify Event Integrity

```python
from apps.audit_trail.services import HashService

hash_service = HashService()
is_valid = hash_service.verify_event_hash(event)
```

#### Store on Blockchain

```python
from apps.audit_trail.services import BlockchainService

blockchain_service = BlockchainService('substrate')
tx_hash = blockchain_service.store_audit_hash(
    event_hash=event.hash,
    metadata={'event_id': event.id}
)
```

#### Store in IPFS

```python
from apps.audit_trail.services import IPFSService

ipfs_service = IPFSService()
ipfs_hash = ipfs_service.store_event_data(event)
```

### Management Commands

#### Verify Audit Integrity

```bash
python manage.py verify_audit_integrity
```

This command:
- Verifies all audit event hashes
- Checks Merkle tree integrity
- Validates blockchain records
- Reports any inconsistencies

**Output:**
```
Audit Integrity Verification Report
===================================
Total Events: 1,234
Verified Events: 1,234
Failed Events: 0
Merkle Trees: 12
Valid Trees: 12
Blockchain Records: 456
Valid Records: 456
Status: ✅ All checks passed
```

### API Usage

#### Create Audit Event

```bash
POST /api/v1/audit-trail/events/
Content-Type: application/json

{
  "event_type": "invoice_created",
  "module": "finance",
  "object_id": "123",
  "object_type": "Invoice",
  "data": {
    "invoice_number": "INV-001",
    "amount": 1000.00
  }
}
```

#### List Audit Events

```bash
GET /api/v1/audit-trail/events/
?event_type=invoice_created
&module=finance
&ordering=-created_at
```

#### Get Audit Event

```bash
GET /api/v1/audit-trail/events/{id}/
```

#### Verify Event

```bash
POST /api/v1/audit-trail/verify/
Content-Type: application/json

{
  "event_id": 123,
  "expected_hash": "0x..."
}
```

#### Get Statistics

```bash
GET /api/v1/audit-trail/stats/
```

## 🔧 Services

### AuditService

High-level service for audit trail management.

```python
from apps.audit_trail.services import AuditService

service = AuditService()

# Capture event
event = service.capture_event(...)

# Hash event
service.hash_event(event)

# Store on blockchain
service.store_on_chain(event)

# Store in IPFS
service.store_in_ipfs(event)
```

### HashService

Hash generation and verification.

```python
from apps.audit_trail.services import HashService

hash_service = HashService()

# Generate hash
hash_value = hash_service.generate_hash(data)

# Verify hash
is_valid = hash_service.verify_hash(data, hash_value)
```

### MerkleService

Merkle tree operations for batch verification.

```python
from apps.audit_trail.services import MerkleService

merkle_service = MerkleService()

# Create Merkle tree
tree = merkle_service.create_tree(events)

# Get root hash
root_hash = tree.root_hash

# Verify event in tree
is_included = merkle_service.verify_inclusion(event, tree)
```

### BlockchainService

Blockchain integration for immutable storage.

```python
from apps.audit_trail.services import BlockchainService

# Substrate
substrate_service = BlockchainService('substrate')
tx_hash = substrate_service.store_hash(hash_value)

# Ethereum
ethereum_service = BlockchainService('ethereum')
tx_hash = ethereum_service.store_hash(hash_value)
```

### IPFSService

IPFS storage for decentralized file storage.

```python
from apps.audit_trail.services import IPFSService

ipfs_service = IPFSService()

# Store data
ipfs_hash = ipfs_service.upload_data(data)

# Retrieve data
data = ipfs_service.get_data(ipfs_hash)
```

## 📡 API Endpoints

### Events

- `GET /api/v1/audit-trail/events/` - List audit events
- `POST /api/v1/audit-trail/events/` - Create audit event
- `GET /api/v1/audit-trail/events/{id}/` - Get audit event
- `PATCH /api/v1/audit-trail/events/{id}/` - Update audit event

### Verification

- `POST /api/v1/audit-trail/verify/` - Verify event integrity
- `POST /api/v1/audit-trail/verify-batch/` - Batch verification
- `GET /api/v1/audit-trail/merkle-trees/` - List Merkle trees

### Statistics

- `GET /api/v1/audit-trail/stats/` - Get audit statistics
- `GET /api/v1/audit-trail/stats/by-module/` - Statistics by module
- `GET /api/v1/audit-trail/stats/by-event-type/` - Statistics by event type

### Blockchain

- `GET /api/v1/audit-trail/blockchain-records/` - List blockchain records
- `POST /api/v1/audit-trail/anchor-to-chain/` - Anchor event to blockchain

## 🔐 Security

### Hash Verification

All audit events are hashed using SHA-256:

```python
import hashlib
import json

def generate_hash(event_data):
    data_string = json.dumps(event_data, sort_keys=True)
    return hashlib.sha256(data_string.encode()).hexdigest()
```

### Merkle Tree Verification

Merkle trees enable efficient batch verification:

```python
# Verify single event in batch
is_included = merkle_service.verify_inclusion(
    event_hash=event.hash,
    merkle_root=tree.root_hash,
    proof=merkle_proof
)
```

### Blockchain Anchoring

Events can be anchored to blockchain for immutability:

```python
# Store hash on Substrate
tx_hash = blockchain_service.store_hash(
    hash_value=event.hash,
    metadata={'event_id': event.id}
)
```

## 🧪 Testing

### Unit Tests

```bash
python manage.py test apps.audit_trail.tests
```

### Integration Tests

```bash
pytest tests/integration/test_audit_trail.py
```

### Test Coverage

```bash
coverage run --source='apps.audit_trail' manage.py test apps.audit_trail
coverage report
```

## 📊 Monitoring

### Event Statistics

```python
from apps.audit_trail.models import AuditEvent
from django.db.models import Count

# Events by type
events_by_type = AuditEvent.objects.values('event_type').annotate(
    count=Count('id')
)

# Events by module
events_by_module = AuditEvent.objects.values('module').annotate(
    count=Count('id')
)
```

### Health Checks

```bash
# Verify integrity
python manage.py verify_audit_integrity

# Check blockchain connectivity
python manage.py check_blockchain_connection

# Check IPFS connectivity
python manage.py check_ipfs_connection
```

## 🚀 Deployment

### Production Configuration

```python
# settings/production.py
AUDIT_TRAIL_CONFIG = {
    'auto_hash_events': True,
    'auto_store_on_chain': True,
    'auto_store_ipfs': True,
    'blockchain_network': 'substrate',
    'ipfs_enabled': True,
    'batch_size': 100,
    'verification_interval': 3600,  # 1 hour
}
```

### Performance Optimization

- **Database Indexing**: All event fields are indexed
- **Batch Processing**: Events are processed in batches
- **Caching**: Frequently accessed events are cached
- **Async Processing**: Blockchain and IPFS operations are async

## 📖 Documentation

### Models

- **AuditEvent**: Main audit event model with all event data
- **AuditHash**: Hash records for verification
- **MerkleTree**: Merkle tree structures for batch verification
- **OnChainRecord**: Blockchain-anchored records

### Services

See service documentation in `services/` directory:
- `audit_service.py`: High-level audit management
- `hash_service.py`: Hash operations
- `merkle_service.py`: Merkle tree operations
- `blockchain_service.py`: Blockchain integration
- `ipfs_service.py`: IPFS storage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../../../CONTRIBUTING.md) for details.

## 📄 License

- **Community Edition**: MIT License
- **Commercial Edition**: Commercial License

See [LICENSE](../../../../LICENSE) for details.

## 🆘 Support

### Community Support

- **GitHub Issues**: [Report bugs](https://github.com/vjbollavarapu/modulyn-community/issues)
- **Documentation**: [Read the docs](../../../../README.md)

### Commercial Support

- **Email**: support@modulyn.io
- **Priority Support**: Available for Commercial Edition customers

---

**Built with ❤️ for the Modulyn community and enterprise users worldwide.**

**Note**: This audit trail module is fully developed and maintained for both Community and Commercial editions of Modulyn ERP.

