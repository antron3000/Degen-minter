# Degen Minter — Bitcoin Ordinals Development Environment

A Nix-based development environment for building and testing Bitcoin Ordinals inscription applications using regtest mode, Docker, and Deno.

## Overview

This project provides a complete, reproducible development infrastructure for rapid Bitcoin Ordinals development and testing. It uses regtest mode for instant block generation, eliminating wait times and enabling fast iteration cycles.

**Key Technologies:**
- Bitcoin Core 28 (regtest mode)
- Deno runtime for TypeScript/JavaScript
- Nix for reproducible environments
- Docker Compose for containerization
- Just for task automation

## Features

- **Instant Testing**: Regtest mode with on-demand block mining
- **Reproducible Environment**: Nix shell with all dependencies pinned
- **Automated Setup**: One command to initialize wallet and mine blocks
- **Direct RPC Access**: Use `bitcoin-cli` directly (not docker exec)
- **Environment-Driven Config**: All settings via `.env` file
- **Organized Commands**: Prefixed Just recipes (`btc_*`, `deno_*`)

## Quick Start

### Prerequisites

- [Nix](https://nixos.org/download.html) (with flakes enabled)
- [Docker](https://docs.docker.com/get-docker/)
- [direnv](https://direnv.net/) (optional, for automatic environment activation)

### Setup

1. **Clone and enter the repository**
   ```
   git clone <repo-url>
   cd Degen-minter
   ```

2. **Create environment file**
   ```
   cp .env.example .env
   # Edit .env if needed (defaults work for most cases)
   ```

3. **Enter Nix shell**
   ```
   nix-shell
   # or with direnv: direnv allow
   ```

4. **Initialize Bitcoin regtest**
   ```
   just init
   ```
   This starts Bitcoin Core, creates a wallet, and mines 101 blocks.

### Available Commands

View all commands:
```
just
```

#### Bitcoin Node Management
```
just btc_start      # Start Bitcoin Core
just btc_stop       # Stop Bitcoin Core
just btc_restart    # Restart Bitcoin Core
just btc_logs       # View Bitcoin Core logs
just btc_info       # Get blockchain info
just btc_status     # Show detailed status
```

#### Bitcoin Wallet Operations
```
just btc_setup      # Initialize wallet and mine blocks
just btc_balance    # Check wallet balance
just btc_wallets    # List all wallets
just btc_newaddress # Generate new address
just btc_utxos      # List unspent outputs
```

#### Bitcoin Mining
```
just btc_mine       # Mine 1 block
just btc_mine 10    # Mine 10 blocks
```

#### Deno Development
```
just deno_run       # Run ordinals app
just deno_dev       # Run with hot reload
just deno_fmt       # Format code
just deno_check     # Type check
just deno_cache     # Cache dependencies
just deno_test      # Run tests
```

#### Convenience
```
just init           # Start + setup (one command)
just dev            # Start node + run app in watch mode
just status         # Quick status check
```

#### Maintenance
```
just clean_btc      # Clean blockchain data
just clean_deno     # Clean Deno cache
just clean          # Clean everything
just reset          # Full reset and reinitialize
```

## Development Workflow

### Typical Session

```
# Enter environment
nix-shell

# Start everything
just init

# Develop with hot reload
just deno_dev

# In another terminal: mine blocks as needed
just btc_mine 6

# Check status
just status
```

### Testing Inscriptions

```
# Mine some blocks for funds
just btc_mine 10

# Run your inscription code
just deno_run

# Mine blocks to confirm transactions
just btc_mine 1

# Check results
just btc_status
```

## Configuration

All configuration is in `.env`:

```
# Bitcoin RPC Configuration
BITCOIN_RPC_USER=bitcoin
BITCOIN_RPC_PASSWORD=bitcoin
BITCOIN_RPC_PORT=18443

# Wallet Configuration
BITCOIN_WALLET_NAME=ordinals

# Initial Setup
BITCOIN_INITIAL_BLOCKS=101
COMPOSE_PROFILES=regtest
```

## Architecture

```
┌─────────────────────────────────────────┐
│            Nix Shell                    │
│  ┌─────────────────────────────────┐   │
│  │   Deno Runtime (ordinals.ts)    │   │
│  └─────────────┬───────────────────┘   │
│                │ RPC Calls               │
│  ┌─────────────▼───────────────────┐   │
│  │   Bitcoin Core (Regtest)        │   │
│  │   - Port 18443 (RPC)            │   │
│  │   - Instant block generation    │   │
│  │   - txindex enabled             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Helper Scripts: btc-setup, btc-mine,  │
│                  btc-status, btc-cli   │
└─────────────────────────────────────────┘
```

## Project Structure

```
.
├── .env.example          # Environment configuration template
├── docker-compose.yaml   # Bitcoin Core container definition
├── justfile             # Task automation recipes
├── shell.nix            # Nix development environment
├── scripts/
│   ├── setup.sh         # Initialize regtest environment
│   ├── mine.sh          # Mine blocks on demand
│   └── status.sh        # Display blockchain status
└── ordinals.ts          # Your Deno inscription app (create this)
```

## Why Regtest?

**Advantages:**
- **Instant feedback**: Mine blocks on command (no waiting)
- **Complete control**: Unlimited Bitcoin, deterministic behavior
- **No sync required**: Start testing immediately
- **Offline development**: Works without internet
- **Cost-free testing**: No testnet faucets needed

**When to use Signet instead:**
- Pre-mainnet validation with realistic timing
- Testing with 10-minute block times
- Multi-party testing scenarios

## Troubleshooting

### Bitcoin Core won't start
```
# Check logs
just btc_logs

# Restart
just btc_restart
```

### Wallet errors
```
# Recreate wallet
just btc_cli unloadwallet ordinals
just btc_setup
```

### RPC connection issues
```
# Verify Bitcoin Core is running
docker ps

# Check RPC connectivity
just btc_info
```

### Clean slate
```
# Full reset
just reset
```

## Next Steps

1. **Create your Deno inscription app** (`ordinals.ts`)
2. **Implement commit-reveal transactions**
3. **Test locally with regtest**
4. **Switch to signet for realistic testing**
5. **Deploy to mainnet with caution**

## Best Practices

- ✅ Always test on regtest first
- ✅ Use environment variables for sensitive data
- ✅ Mine 6+ blocks for transaction confirmations
- ✅ Check balance before creating inscriptions
- ✅ Use version control for your inscription app
- ⚠️ Never commit private keys or `.env` files

## Contributing

Contributions welcome! Please:
1. Test changes in regtest mode
2. Update documentation for new features
3. Follow existing code style (use `just deno_fmt`)
4. Add Just recipes for new workflows

## License

MIT (or specify your license)

## Disclaimer

This is a development environment for testing. Always verify transactions carefully before broadcasting to mainnet. The authors are not responsible for lost funds.