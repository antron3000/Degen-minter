#!/usr/bin/env bash
set -e

echo "==========================================="
echo "Setting up Bitcoin Regtest Environment"
echo "==========================================="

# Configuration from environment variables
BITCOIN_RPC_USER="${BITCOIN_RPC_USER:-bitcoin}"
BITCOIN_RPC_PASSWORD="${BITCOIN_RPC_PASSWORD:-bitcoin}"
BITCOIN_RPC_HOST="${BITCOIN_RPC_HOST:-localhost}"
BITCOIN_RPC_PORT="${BITCOIN_RPC_PORT:-18443}"
BITCOIN_WALLET_NAME="${BITCOIN_WALLET_NAME:-ordinals}"
BITCOIN_INITIAL_BLOCKS="${BITCOIN_INITIAL_BLOCKS:-101}"

CLI="bitcoin-cli -regtest -rpcuser=$BITCOIN_RPC_USER -rpcpassword=$BITCOIN_RPC_PASSWORD -rpcconnect=$BITCOIN_RPC_HOST -rpcport=$BITCOIN_RPC_PORT"

# Wait for Bitcoin Core to be ready
echo "Waiting for Bitcoin Core..."
max_attempts=30
attempt=0
while ! $CLI getblockchaininfo &> /dev/null; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "Error: Bitcoin Core not responding after $max_attempts attempts"
    exit 1
  fi
  echo "Attempt $attempt/$max_attempts..."
  sleep 2
done

echo "✓ Bitcoin Core is ready"

# Create wallet if it doesn't exist
echo "Creating wallet: $BITCOIN_WALLET_NAME..."
if $CLI createwallet "$BITCOIN_WALLET_NAME" 2>/dev/null; then
  echo "✓ Wallet created"
else
  echo "⚠ Wallet already exists or error creating (attempting to load)"
  $CLI loadwallet "$BITCOIN_WALLET_NAME" 2>/dev/null || true
fi

# Get current block height
CURRENT_BLOCKS=$($CLI getblockcount)
echo "Current block height: $CURRENT_BLOCKS"

# Mine blocks if needed
if [ "$CURRENT_BLOCKS" -lt "$BITCOIN_INITIAL_BLOCKS" ]; then
  BLOCKS_TO_MINE=$((BITCOIN_INITIAL_BLOCKS - CURRENT_BLOCKS))
  echo "Mining $BLOCKS_TO_MINE blocks to reach $BITCOIN_INITIAL_BLOCKS..."
  
  ADDRESS=$($CLI -rpcwallet="$BITCOIN_WALLET_NAME" getnewaddress)
  echo "Address: $ADDRESS"
  
  $CLI generatetoaddress "$BLOCKS_TO_MINE" "$ADDRESS" > /dev/null
  echo "✓ Mining complete"
else
  echo "✓ Already have $CURRENT_BLOCKS blocks"
fi

# Display final status
BALANCE=$($CLI -rpcwallet="$BITCOIN_WALLET_NAME" getbalance)
BLOCKS=$($CLI getblockcount)

echo ""
echo "==========================================="
echo "Setup Complete!"
echo "==========================================="
echo "Wallet:  $BITCOIN_WALLET_NAME"
echo "Balance: $BALANCE BTC"
echo "Blocks:  $BLOCKS"
echo "==========================================="
