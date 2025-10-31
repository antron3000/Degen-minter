#!/usr/bin/env bash
set -e

BLOCKS="${1:-1}"

# Configuration from environment variables
BITCOIN_RPC_USER="${BITCOIN_RPC_USER:-bitcoin}"
BITCOIN_RPC_PASSWORD="${BITCOIN_RPC_PASSWORD:-bitcoin}"
BITCOIN_RPC_HOST="${BITCOIN_RPC_HOST:-localhost}"
BITCOIN_RPC_PORT="${BITCOIN_RPC_PORT:-18443}"
BITCOIN_WALLET_NAME="${BITCOIN_WALLET_NAME:-ordinals}"

CLI="bitcoin-cli -regtest -rpcuser=$BITCOIN_RPC_USER -rpcpassword=$BITCOIN_RPC_PASSWORD -rpcconnect=$BITCOIN_RPC_HOST -rpcport=$BITCOIN_RPC_PORT"

# Get new address
ADDRESS=$($CLI -rpcwallet="$BITCOIN_WALLET_NAME" getnewaddress)

# Mine blocks
$CLI generatetoaddress "$BLOCKS" "$ADDRESS" > /dev/null

# Display status
HEIGHT=$($CLI getblockcount)
BALANCE=$($CLI -rpcwallet="$BITCOIN_WALLET_NAME" getbalance)

echo "Mined $BLOCKS block(s)"
echo "Height:  $HEIGHT"
echo "Balance: $BALANCE BTC"
