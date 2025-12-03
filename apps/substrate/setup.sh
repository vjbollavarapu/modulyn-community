#!/bin/bash

# Modulyn Substrate Node Setup Script
# This script sets up the complete Substrate development environment

set -e

echo "🚀 Modulyn Substrate Node Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Rust is installed
echo "📦 Checking Rust installation..."
if ! command -v rustc &> /dev/null; then
    echo -e "${YELLOW}Rust not found. Installing Rust...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
else
    echo -e "${GREEN}✓ Rust already installed${NC}"
fi

# Update Rust
echo "🔄 Updating Rust toolchain..."
rustup default stable
rustup update
rustup update nightly
rustup target add wasm32-unknown-unknown --toolchain nightly
rustup component add rust-src
echo -e "${GREEN}✓ Rust toolchain updated${NC}"

# Check if substrate-node-template needs to be cloned
if [ ! -d "node" ] || [ ! -d "runtime" ]; then
    echo ""
    echo "📥 Cloning substrate-node-template..."
    echo -e "${YELLOW}This will download the Substrate node template${NC}"
    
    # Clone to temporary directory
    git clone --depth 1 --branch polkadot-v1.6.0 \
        https://github.com/substrate-developer-hub/substrate-node-template.git temp
    
    # Copy node and runtime
    if [ ! -d "node" ]; then
        cp -r temp/node ./node
        echo -e "${GREEN}✓ Node copied${NC}"
    fi
    
    if [ ! -d "runtime" ]; then
        cp -r temp/runtime ./runtime
        echo -e "${GREEN}✓ Runtime copied${NC}"
    fi
    
    # Cleanup
    rm -rf temp
    echo -e "${GREEN}✓ Template cloned successfully${NC}"
else
    echo -e "${GREEN}✓ Node and runtime already exist${NC}"
fi

# Update Cargo.toml if needed
echo ""
echo "📝 Configuring workspace..."
if ! grep -q "Modulyn-node" node/Cargo.toml 2>/dev/null; then
    echo -e "${YELLOW}Updating node package name...${NC}"
    sed -i.bak 's/name = "node-template"/name = "Modulyn-node"/' node/Cargo.toml 2>/dev/null || \
    sed -i '' 's/name = "node-template"/name = "Modulyn-node"/' node/Cargo.toml
    echo -e "${GREEN}✓ Node package name updated${NC}"
fi

if ! grep -q "Modulyn-runtime" runtime/Cargo.toml 2>/dev/null; then
    echo -e "${YELLOW}Updating runtime package name...${NC}"
    sed -i.bak 's/name = "node-template-runtime"/name = "Modulyn-runtime"/' runtime/Cargo.toml 2>/dev/null || \
    sed -i '' 's/name = "node-template-runtime"/name = "Modulyn-runtime"/' runtime/Cargo.toml
    echo -e "${GREEN}✓ Runtime package name updated${NC}"
fi

# Build the project
echo ""
echo "🔨 Building the project..."
echo -e "${YELLOW}This may take 15-30 minutes on first build...${NC}"
cargo build --release

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo ""
    echo "🎉 Setup Complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Run the node: make run"
    echo "  2. Connect via Polkadot.js: https://polkadot.js.org/apps/"
    echo "  3. WebSocket endpoint: ws://127.0.0.1:9944"
    echo ""
    echo "Node binary location: ./target/release/Modulyn-node"
else
    echo -e "${RED}✗ Build failed${NC}"
    echo "Please check the error messages above"
    exit 1
fi

