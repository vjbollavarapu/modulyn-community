.PHONY: build run test clean check fmt clippy benchmarks help

# Default target
help:
	@echo "Modulyn Substrate Node - Build Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  make build        - Build the node in release mode"
	@echo "  make run          - Run the development node"
	@echo "  make test         - Run all tests"
	@echo "  make check        - Check code without building"
	@echo "  make fmt          - Format code with rustfmt"
	@echo "  make clippy       - Run clippy linter"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make benchmarks   - Run runtime benchmarks"
	@echo ""

# Build the node in release mode
build:
	@echo "Building Modulyn Substrate node..."
	cargo build --release
	@echo "Build complete! Binary: ./target/release/Modulyn-node"

# Build in debug mode (faster compilation)
build-dev:
	@echo "Building Modulyn Substrate node (debug)..."
	cargo build
	@echo "Build complete! Binary: ./target/debug/Modulyn-node"

# Run the development node
run:
	@echo "Starting Modulyn Substrate development node..."
	@echo "WebSocket endpoint: ws://127.0.0.1:9944"
	@echo "HTTP RPC endpoint: http://127.0.0.1:9933"
	@echo ""
	./target/release/Modulyn-node --dev --tmp

# Run with custom port
run-custom:
	@echo "Starting Modulyn Substrate node on custom ports..."
	./target/release/Modulyn-node --dev \
		--ws-port 9944 \
		--rpc-port 9933 \
		--tmp

# Run all tests
test:
	@echo "Running all tests..."
	cargo test --all
	@echo "All tests passed!"

# Run tests with output
test-verbose:
	@echo "Running tests with verbose output..."
	cargo test --all -- --nocapture

# Run tests for specific pallet
test-ledger:
	cargo test -p pallet-Modulyn-ledger

test-did:
	cargo test -p pallet-Modulyn-did

test-dao:
	cargo test -p pallet-Modulyn-dao

# Check code without building
check:
	@echo "Checking code..."
	cargo check --all

# Format code
fmt:
	@echo "Formatting code..."
	cargo fmt --all

# Run clippy linter
clippy:
	@echo "Running clippy..."
	cargo clippy --all --all-targets -- -D warnings

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cargo clean
	@echo "Clean complete!"

# Build runtime for benchmarking
build-benchmarks:
	@echo "Building with benchmark features..."
	cargo build --release --features runtime-benchmarks

# Run runtime benchmarks
benchmarks: build-benchmarks
	@echo "Running benchmarks for Modulyn Ledger pallet..."
	./target/release/Modulyn-node benchmark pallet \
		--pallet=pallet_Modulyn_ledger \
		--extrinsic='*' \
		--steps=50 \
		--repeat=20 \
		--output=./pallets/Modulyn-ledger/src/weights.rs

# Purge chain data
purge:
	@echo "Purging development chain data..."
	./target/release/Modulyn-node purge-chain --dev -y

# Build and run
all: build run

# Install Rust and dependencies
setup:
	@echo "Setting up Substrate development environment..."
	@echo "Installing Rust..."
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
	@echo "Configuring Rust..."
	rustup default stable
	rustup update
	rustup update nightly
	rustup target add wasm32-unknown-unknown --toolchain nightly
	rustup component add rust-src
	@echo "Setup complete!"

# Update dependencies
update:
	@echo "Updating dependencies..."
	cargo update

# Generate documentation
docs:
	@echo "Generating documentation..."
	cargo doc --no-deps --open

# Watch for changes and rebuild
watch:
	@echo "Watching for changes..."
	cargo watch -x build

# Run node with detailed logging
run-debug:
	@echo "Starting node with debug logging..."
	RUST_LOG=debug ./target/release/Modulyn-node --dev --tmp

# Try runtime for testing runtime upgrades
try-runtime:
	cargo build --release --features try-runtime
	./target/release/Modulyn-node try-runtime

