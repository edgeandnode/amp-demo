# Amp - Query Your Smart Contracts with SQL

**Amp turns your smart contract events into SQL-queryable datasets automatically.** Deploy a contract, emit events, and instantly query them with SQL—no backend, no indexers, no configuration.

Build real-time dashboards, analytics tools, and data-driven applications using the language you already know: SQL.

Perfect for hackathons, prototypes, and production applications that need fast access to on-chain data.

## What You'll Build

This template shows you how to:

- Query blockchain data using SQL (both from the CLI and in your app)
- Create custom datasets by combining and transforming on-chain data
- Build a React app that displays live blockchain data

**The Magic:** Write a Solidity contract with events → Deploy to your local chain → Query with SQL immediately. No indexing code required.

## How It Works

1. **Your contracts emit events** - Standard Solidity events from your smart contracts
2. **Amp creates datasets automatically** - Events become SQL tables you can query instantly
3. **Build with familiar tools** - Use SQL in TypeScript, Python, Rust, or from the CLI

Works seamlessly with **Foundry**, **Hardhat**, and other local development environments.

## The Graph Amp Prize Info

**The Best Use of Amp Datasets**
🥇 1st place - $3,000
🥈 2nd place - $2,000
🥉 3rd place - $1,000

**Rewarding the most compelling end-to-end product built on Amp datasets.**

Example Use Cases:

- Cross-chain portfolio dashboard that aggregates wallet positions and liquidity using Amp token datasets
- Risk analytics or MEV monitor that visualizes transaction patterns or protocol surface exposure
- NFT trait liquidity explorer that ranks collections by floor depth and trading velocity using Amp NFT datasets

**Qualification Requirements**
Builders should demonstrate how Amp datasets can power real-world insights, analytics, alerts, agent workflows, risk dashboards, or user experiences across DeFi, NFTs, RWAs, or AI.

Learn about other prize tracks such as building with Subgraphs, Substreams, Token API, and The Graph's MCP servers [here](https://ethglobal.com/events/buenosaires/prizes/the-graph)

## Prerequisites

**note: these dependencies and all other instructions assume you are using the Typescript SDK. There are also Rust and Python clients available for users that prefer.**

### Required Software

- **Node.js** (v22+) with **Pnpm** (v10+)
- **Docker** for running services
- **Foundry** for smart contract development (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- **Just** as task runner (`cargo install just`)
- **Amp** (`curl --proto '=https' --tlsv1.2 -sSf https://ampup.sh/install | sh`)

> **Version Check**
>
> Verify with `node --version` and `pnpm --version`. Older versions may cause issues.

## Quick Start

```bash
# Clone with submodules
git clone --recursive <repository-url>
cd amp-demo

# Install dependencies
just install

# Start infrastructure and deploy contracts
just up

# Start development servers (frontend + Amp)
just dev
```

Open http://localhost:5173 in your browser. Click the counter buttons to generate transactions.

## Your First Query

In a new terminal, query your dataset:

```bash
# See the events your contract emitted
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented LIMIT 5'
```

You just queried blockchain data with SQL! The `incremented` table was automatically created from your contract's `Incremented` event.

## Understanding Datasets

**Datasets** are collections of SQL tables derived from blockchain data. Think of them as your data warehouse for on-chain events.

### Dataset Naming

Datasets use the format `"namespace/name@version"`:

- `"_/counter@dev"` - Your local development dataset
- `"_/anvil@0.0.1"` - Published Anvil blockchain data (blocks, transactions, logs)
- `@dev` for local development, `@latest` or `@1.0.0` for published datasets

The underscore `_/` is your personal namespace for local development.

### What This Template Gives You

This template includes:

1. A **Counter** smart contract that emits `Incremented` and `Decremented` events
2. An Amp dataset that automatically creates SQL tables from those events
3. A React frontend that queries and displays the data

The dataset configuration is in `amp.config.ts`. It uses `eventTables(abi)` to automatically generate SQL tables from your contract events—no additional code needed.

## Creating Derived Datasets

Raw tables (example: `anvil.blocks`) contain the chain data and are populated for you; with them you can create and deploy **derived datasets** that pre-compute transformations for faster queries (like a materialized view).

### Example: Filtering Blocks

Edit `amp.config.ts` to add a custom table:

```typescript
import { defineDataset, eventTables } from "@edgeandnode/amp";
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts";

export default defineDataset(() => {
  const baseTables = eventTables(abi);

  return {
    namespace: "eth_global",
    name: "counter",
    network: "anvil",
    description: "Counter dataset with event tables and custom queries",
    dependencies: {
      anvil: "_/anvil@0.0.1", // Access to blocks, transactions, logs
    },
    tables: {
      ...baseTables, // Your contract's event tables

      // Add a custom derived table
      active_blocks: {
        sql: `
          SELECT
            block_num,
            hash AS block_hash,
            timestamp,
            gas_used
          FROM anvil.blocks
          WHERE gas_used > 0
        `,
      },
    },
  };
});
```

Amp automatically detects changes to `amp.config.ts` and generates your new `active_blocks` table.

Query the new table:

```bash
pnpm amp query 'SELECT * FROM "_/counter@dev".active_blocks LIMIT 10'
```

**Filtering for a specific contract:**

```bash
pnpm amp query 'SELECT * FROM anvil.logs WHERE address = 0xYOUR_CONTRACT_ADDRESS LIMIT 10'
```

### Derived Dataset Tips

- **Dependencies** give you access to other datasets (like `anvil.blocks`, `anvil.logs`)
- You can `JOIN`, `FILTER`, and transform data from dependencies
- Derived tables use a **streaming model** with some SQL limitations (no `GROUP BY`, `LIMIT`, or `ORDER BY` in the table definition)
- See [docs/streaming.md](docs/streaming.md) for detailed streaming SQL documentation

**Prototype with Amp Studio:**

```bash
just studio
```

This opens a web interface where you can test SQL queries before adding them to your config.

## Querying in Your Application

The frontend (`app/src`) shows how to query Amp datasets from TypeScript. See [`app/src/components/IncrementTable.tsx`](app/src/components/IncrementTable.tsx) for a complete example.

## Client Libraries

This template uses **TypeScript**, but Amp supports multiple languages:

- **TypeScript/JavaScript** - `@edgeandnode/amp` (used in this template)
- **Rust** - Available via Amp CLI
- **Python** - Available via Amp CLI

All clients use the same SQL query language and connect to the same Amp server.

## Supported Chains

Local

- **Anvil or Hardhat** (local development)

On hosted instance (https://playground.amp.thegraph.com/)

- **Ethereum** mainnet
- **Arbitrum** mainnet
- **Base** mainnet
- **Base** Sepolia

Roadmap includes all major chains.

## Hosted Environment Development

Amp easily transitions from local development to developing on datasets located in a hosted environment.

Follow this **[guide](docs/hosted-env.md)** to transition Amp from local datasets to published datasets hosted by Edge & Node.

## Interactive Development

```bash
# Open Amp Studio for web-based queries
just studio

# Watch service logs
just logs

# Query from CLI
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented LIMIT 10'
```

## Next Steps

- **[docs/hosted-env.md](docs/hosted-env.md)** - Move from querying local datasets to datasets hosted by Edge & Node
- **[docs/streaming.md](docs/streaming.md)** - Complete guide to streaming SQL limitations and patterns
- **[docs/troubleshooting.md](docs/troubleshooting.md)** - Troubleshooting guide and detailed command reference
- **[Configuration Guide](https://github.com/edgeandnode/amp/blob/main/docs/config.md)** - Advanced configuration (object stores, providers, environment variables)
- **[Operational Modes](https://github.com/edgeandnode/amp/blob/main/docs/modes.md)** - Production deployment patterns
- **[Glossary](https://github.com/edgeandnode/amp/blob/main/docs/glossary.md)** - Terminology and architecture concepts
- **[UDFs](https://github.com/edgeandnode/amp/blob/main/docs/udfs.md)** - Built-in SQL functions for blockchain data

## Common Questions

**Q: Do I need to write indexing code?**
No. Amp automatically creates SQL tables from your contract events using `eventTables(abi)`.

**Q: Can I use this with Hardhat?**
Yes! Amp works with any local Ethereum development environment. Just point it at your local chain.

**Q: What's the difference between raw and derived tables?**
Raw tables map 1:1 with contract events. Derived tables let you pre-compute joins and transformations for faster queries.

**Q: Why does my query need `@dev`?**
Local datasets use the `@dev` tag. Published datasets use version numbers like `@1.0.0` or `@latest`.

## Project Structure

```
amp-demo/
├── amp.config.ts                    # Dataset configuration (your SQL tables)
├── contracts/src/Counter.sol        # Smart contract with events
├── app/                             # React frontend
│   ├── src/components/              # Components that query Amp datasets
│   └── src/lib/                     # Utils to query Amp datasets/setup viem, etc
├── infra/
│   ├── amp/
│   │   ├── providers/               # Network connection configs
│   │   ├── data/                    # Runtime data (generated)
│   │   └── datasets/                # Build artifacts (generated)
│   └── docker-compose.yaml          # Infrastructure services
└── justfile                         # Task runner commands
```

## Need Help?

- **Troubleshooting:** See [docs/troubleshooting.md](docs/troubleshooting.md)
- **Detailed Docs:** See [Amp Documentation](https://github.com/edgeandnode/amp/tree/main/docs)
- **Questions:** Open an issue on GitHub
