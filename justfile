# Default recipe - show help
_default:
    @just --list

# ============================================================================
# Bitcoin Node Management
# ============================================================================

# Start Bitcoin Core with Docker Compose
btc_start:
    docker compose up -d
    @echo "Waiting for Bitcoin Core to start..."
    @sleep 5

# Stop Bitcoin Core
btc_stop:
    docker compose down

# Restart Bitcoin Core
btc_restart: btc_stop btc_start

# View Bitcoin Core logs
btc_logs:
    docker compose logs -f bitcoin-core

# Get blockchain info
btc_info:
    btc-cli getblockchaininfo | jq

# Show blockchain and wallet status
btc_status:
    btc-status

# ============================================================================
# Bitcoin Wallet Operations
# ============================================================================

# Setup regtest environment (create wallet and mine initial blocks)
btc_setup:
    btc-setup

# Check wallet balance
btc_balance:
    btc-cli -rpcwallet=$BITCOIN_WALLET_NAME getbalance

# List wallets
btc_wallets:
    btc-cli listwallets

# Get new address
btc_newaddress label="":
    @if [ -z "{{label}}" ]; then \
        btc-cli -rpcwallet=$BITCOIN_WALLET_NAME getnewaddress; \
    else \
        btc-cli -rpcwallet=$BITCOIN_WALLET_NAME getnewaddress "{{label}}"; \
    fi

# List unspent outputs
btc_utxos:
    btc-cli -rpcwallet=$BITCOIN_WALLET_NAME listunspent | jq

# ============================================================================
# Bitcoin Mining
# ============================================================================

# Mine N blocks (default 1)
btc_mine blocks="1":
    btc-mine {{blocks}}

# ============================================================================
# Bitcoin CLI
# ============================================================================

# Execute arbitrary bitcoin-cli command
btc_cli *ARGS:
    btc-cli {{ARGS}}

# ============================================================================
# Deno Application
# ============================================================================

# Run Deno ordinals app
deno_run:
    deno run --allow-net --allow-env --allow-read ordinals.ts

# Run Deno app in watch mode for development
deno_dev:
    deno run --watch --allow-net --allow-env --allow-read ordinals.ts

# Format Deno code
deno_fmt:
    deno fmt

# Type check Deno code
deno_check:
    deno check ordinals.ts

# Install/cache Deno dependencies
deno_cache:
    deno cache ordinals.ts

# Run Deno tests
deno_test:
    deno test --allow-net --allow-env

# ============================================================================
# Convenience Aliases
# ============================================================================

# Start and setup in one command
init: btc_start btc_setup

# Run development workflow (start node and run app in watch mode)
dev: btc_start deno_dev

# Quick status check
status: btc_status btc_balance

# ============================================================================
# Maintenance
# ============================================================================

# Clean Bitcoin blockchain data only
clean_btc:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "⚠️  This will delete Bitcoin blockchain data!"
    read -p "Are you sure? (y/N) " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        docker compose down -v
        rm -rf ./data 2>/dev/null || true
        echo "✓ Cleaned Bitcoin data"
    else
        echo "Cancelled"
        exit 1
    fi

# Clean Deno cache only
clean_deno:
    @rm -rf .deno 2>/dev/null || true
    @echo "✓ Cleaned Deno cache"

clean: clean_btc clean_deno

# Full reset and reinitialize
reset: clean init
