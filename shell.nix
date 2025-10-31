{ pkgs ? import <nixpkgs> {} }:

let
  # Package external scripts
  setupScript = pkgs.writeScriptBin "btc-setup" ''
    exec ${pkgs.bash}/bin/bash ${./scripts/setup.sh} "$@"
  '';

  mineScript = pkgs.writeScriptBin "btc-mine" ''
    exec ${pkgs.bash}/bin/bash ${./scripts/mine.sh} "$@"
  '';

  statusScript = pkgs.writeScriptBin "btc-status" ''
    exec ${pkgs.bash}/bin/bash ${./scripts/status.sh} "$@"
  '';

  # CLI wrapper for convenience
  cliScript = pkgs.writeScriptBin "btc-cli" ''
    BITCOIN_RPC_USER="''${BITCOIN_RPC_USER:-bitcoin}"
    BITCOIN_RPC_PASSWORD="''${BITCOIN_RPC_PASSWORD:-bitcoin}"
    BITCOIN_RPC_HOST="''${BITCOIN_RPC_HOST:-localhost}"
    BITCOIN_RPC_PORT="''${BITCOIN_RPC_PORT:-18443}"
    
    exec ${pkgs.bitcoin}/bin/bitcoin-cli \
      -regtest \
      -rpcuser="$BITCOIN_RPC_USER" \
      -rpcpassword="$BITCOIN_RPC_PASSWORD" \
      -rpcconnect="$BITCOIN_RPC_HOST" \
      -rpcport="$BITCOIN_RPC_PORT" \
      "$@"
  '';

in pkgs.mkShell {
  name = "bitcoin-ordinals-deno-dev";

  buildInputs = with pkgs; [
    # Container orchestration
    docker
    docker-compose

    # Task runner
    just

    # Deno runtime
    deno

    # Bitcoin tools
    bitcoin

    # Utilities
    jq
    curl
    git

    # Optional: Rust for ord
    rustc
    cargo
    
    # Build tools
    gcc
    gnumake
    pkg-config
    openssl

    # Custom scripts
    setupScript
    mineScript
    statusScript
    cliScript
  ];

  shellHook = ''
    # Load .env file if it exists
    if [ -f .env ]; then
      set -a
      source .env
      set +a
    fi

    # Set default environment variables
    export BITCOIN_RPC_USER=''${BITCOIN_RPC_USER:-bitcoin}
    export BITCOIN_RPC_PASSWORD=''${BITCOIN_RPC_PASSWORD:-bitcoin}
    export BITCOIN_RPC_HOST=''${BITCOIN_RPC_HOST:-localhost}
    export BITCOIN_RPC_PORT=''${BITCOIN_RPC_PORT:-18443}
    export BITCOIN_WALLET_NAME=''${BITCOIN_WALLET_NAME:-ordinals}
    export BITCOIN_INITIAL_BLOCKS=''${BITCOIN_INITIAL_BLOCKS:-101}

    # Deno configuration
    export DENO_DIR="$PWD/.deno"

    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║   Bitcoin Ordinals Development Environment (Regtest)  ║"
    echo "║                    Powered by Deno                     ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "Run 'just' to see available commands"
    echo ""
  '';

  DOCKER_BUILDKIT = "1";
  COMPOSE_DOCKER_CLI_BUILD = "1";
}
