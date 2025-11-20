# Support both docker and podman
docker := if `command -v podman >/dev/null 2>&1; echo $?` == "0" { "podman" } else { "docker" }

# Display available commands and their descriptions (default target)
default:
    @just --list

# Copy .env.example to .env if .env doesn't exist
copy_env:
    #!/usr/bin/env bash
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "Created .env from .env.example"
    fi

# Install dependencies
install:
    pnpm install
    forge build
    just copy_env

# Install amp
ampup:
    curl --proto '=https' --tlsv1.2 -sSf https://ampup.sh/install | sh

# Start service dependencies
up *args:
    @mkdir -p ./infra/postgres/data
    @mkdir -p ./infra/amp/data
    @mkdir -p ./infra/amp/datasets
    {{docker}} compose up -d --wait {{args}}
    just deploy

# Tail logs for service dependencies
logs *args:
    {{docker}} compose logs -f --tail 100 {{args}}

# Stop service dependencies
stop *args:
    {{docker}} compose stop {{args}}

# Stop all services and remove volumes
down:
    {{docker}} compose down --volumes
    @rm -rf ./infra/postgres/data
    @rm -rf ./infra/amp/data
    @rm -rf ./infra/amp/datasets

# Deploy the contract
[working-directory: "contracts"]
deploy:
    forge script script/DeployCounter.s.sol --broadcast --rpc-url http://localhost:8545 --private-key "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Run all development services in parallel
[parallel]
dev: dev-app dev-amp

# Run the app in development mode
[private]
dev-app:
    pnpm dev

# Deploy the dataset and watch for config changes
[private]
dev-amp:
    ampctl manifest generate --network anvil --kind evm-rpc --out ./infra/amp/anvil.json
    ampctl dataset register _/anvil -t 0.0.1 ./infra/amp/anvil.json
    ampctl dataset deploy _/anvil@dev
    pnpm amp build -o /tmp/amp-counter-manifest.json
    ampctl dataset register _/counter /tmp/amp-counter-manifest.json
    ampctl dataset deploy _/counter@dev
    pnpm amp dev

studio:
    pnpm run amp studio --open