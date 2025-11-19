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
__note: these dependencies and all other instructions assume you are using the Typescript SDK. There are also Rust and Python clients available for users that prefer.__

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

Deploy your changes:

```bash
just down
just up
```

Query your new table:

```bash
pnpm amp query 'SELECT * FROM "_/counter@dev".active_blocks LIMIT 10'
```

### Derived Dataset Tips

- **Dependencies** give you access to other datasets (like `anvil.blocks`, `anvil.logs`)
- You can `JOIN`, `FILTER`, and transform data from dependencies
- Derived tables use a **streaming model** with some SQL limitations (no `GROUP BY`, `LIMIT`, or `ORDER BY` in the table definition)
- See [docs/STREAMING.md](docs/streaming.md) for detailed streaming SQL documentation

**Prototype with Amp Studio:**

```bash
just studio
```

This opens a web interface where you can test SQL queries before adding them to your config.

## Querying in Your Application

The frontend (`app/src`) shows how to query Amp datasets from TypeScript using the `@edgeandnode/amp` client library.

Example from `app/src/components/IncrementTable.tsx`:

```typescript
import { useQuery } from "@edgeandnode/amp";

const { data } = useQuery(`
  SELECT * FROM "_/counter@dev".incremented
  ORDER BY block_num DESC
  LIMIT 10
`);
```

The library is built on Apache Arrow Flight for high-performance data transfer.

## Client Libraries

This template uses **TypeScript**, but Amp supports multiple languages:
- **TypeScript/JavaScript** - `@edgeandnode/amp` (used in this template)
- **Rust** - Available via Amp CLI
- **Python** - Available via Amp CLI

All clients use the same SQL query language and connect to the same Amp server.

## Supported Chains

Local
- **Foundry Anvil** (local development)

On hosted instance (https://playground.amp.thegraph.com/)
- **Ethereum** mainnet
- **Arbitrum** mainnet
- **Base** mainnet
- **Base** Sepolia

Roadmap includes all major chains.

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

- **[docs/streaming.md](docs/streaming.md)** - Complete guide to streaming SQL limitations and patterns
- **[docs/troubleshooting.md](docs/troubleshooting.md)** - Troubleshooting guide and detailed command reference
- **[docs/config.md](docs/config.md)** - Advanced configuration (object stores, providers, environment variables)
- **[docs/modes.md](docs/modes.md)** - Production deployment patterns
- **[docs/glossary.md](docs/glossary.md)** - Terminology and architecture concepts
- **[docs/udfs.md](docs/udfs.md)** - Built-in SQL functions for blockchain data
- **[PUBLISH.md](./PUBLISH.md)** - Publishing datasets to the network
- **[Amp Dataset Registry](https://playground.amp.thegraph.com/)** - Explore published datasets

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
├── amp.config.extended-example.ts   # Extended example with more patterns
├── contracts/src/Counter.sol        # Smart contract with events
├── app/                             # React frontend
│   └── src/components/              # Components that query Amp datasets
├── infra/
│   ├── amp/
│   │   ├── providers/               # Network connection configs
│   │   ├── data/                    # Runtime data (generated)
│   │   └── datasets/                # Build artifacts (generated)
│   └── docker-compose.yaml          # Infrastructure services
└── justfile                         # Task runner commands
```

## Need Help?

- **Troubleshooting:** See [docs/TROUBLESHOOTING.md](docs/troubleshooting.md)
- **Detailed Docs:** See [docs/README.md](docs/README.md)
- **Questions:** Open an issue on GitHub
Datasets are a collection of tables that represents a unit of ownership, publishing and versioning. Datasets are identified by a namespace, name, and version/revision, and define how data is extracted, transformed, and materialized into Parquet files for querying.

Read more about datasets in the [docs/glossary.md](docs/glossary.md).

Explore published datasets in the [Amp Dataset Registry](https://playground.amp.thegraph.com/).

## Generating Tables 

`amp.config.ts` is responsible for defining datasets as well as the tables generated from these datasets. 

There are two types of tables, raw tables and derived tables.

**Raw Tables** (from `eventTables(abi)`):
- Purpose: Store decoded blockchain event data that maps 1:1 with on-chain events. Best for simple queries or when you need flexibility to transform data at query-time. Query latency scales with transformation complexity.
- Automatically generated from smart contract ABIs.
- Maps directly to blockchain events (e.g. in this template demo app, our raw tables map to `Incremented`, `Decremented`)
- Available immediately after deployment

**Derived Tables** (optional custom SQL in `amp.config.ts`):
- Purpose: Store pre-transformed blockchain data for complex queries. Use when you need subsecond query latency on complex joins or computations. 
- Example of a simple custom SQL statement generating a derived table in `amp.config.extended-example.ts`.
- Current caveats:
   - Can only query tables from **dependencies** (e.g., `anvil.blocks`, `anvil.logs`)
   - Cannot reference other tables in the same dataset (no self-referencing)
   - Must follow [streaming model limitations](#streaming-model-limitations)

### Streaming Model Limitations

Derived tables use an **incremental/streaming model** - they process new blocks as they arrive. This requires all operations to be incrementally updatable.

**✅ Supported Streaming Operations:**
These SQL operations can be used to generate derived tables for querying. 
- `WHERE` - Filter rows
- `JOIN` - Join with dependency tables
- `UNION ALL` - Combine queries
- Projections and column transformations

**❌ Unsupported Streaming Operations:**
Please note: These operations are supported by batch queries

- `LIMIT`, `OFFSET` - Cannot limit streaming data
- `ORDER BY` (global) - Cannot sort unbounded streams
- `DISTINCT` in subqueries - Aggregate operation
- `GROUP BY` with aggregates in subqueries
- Non-deterministic functions (`RANDOM()`, `NOW()`)
- Self-referencing (cannot query tables in same dataset)
- Window functions

**Example - Valid Derived Table:**
```typescript
// ✅ Queries dependency (anvil.blocks)
tables: {
  simple_filter: {
    sql: `
      SELECT block_num, hash, timestamp, gas_used
      FROM anvil.blocks
      WHERE gas_used > 0
    `,
  },
}
```

**Example - Invalid:**
```typescript
// ❌ Uses GROUP BY aggregation (not supported in streaming model)
tables: {
  block_summary: {
    sql: `
      SELECT block_num, COUNT(*) as event_count
      FROM anvil.logs
      GROUP BY block_num
    `,
  },
}
```

**Workaround for Unsupported Operations:**
   - Perform these operations at **query-time** instead of in derived tables. Raw tables support all SQL operations when queried, including `GROUP BY`, `DISTINCT`, `ORDER BY`, and `LIMIT`.

# Querying Data

## TypeScript/JavaScript API

The frontend uses `@edgeandnode/amp` - a type-safe library built on Apache Arrow Flight.

## CLI Queries

```bash
# Query incremented events
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented LIMIT 10'
```

## Dataset Tags (@dev vs @latest)
Amp uses version tags to reference Datasets:

- `@dev` - Development datasets (local, unpublished)
- `@0.0.1`, `@1.2.3` - Specific published versions
- `@latest` - Latest published version

Development datasets must use `@dev`:
```bash
# ❌ Wrong - defaults to @latest
pnpm amp query 'SELECT * FROM "_/counter".incremented'

# ✅ Correct - explicitly use @dev
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented'
```

# Local Development Workflows

## Querying Data

Once your infrastructure is running (`just up` and `just dev`), you can query your dataset:

```bash
# Query event tables
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented LIMIT 10'
pnpm amp query 'SELECT * FROM "_/counter@dev".decremented LIMIT 10'

# Query with filtering and ordering
pnpm amp query 'SELECT block_num, count FROM "_/counter@dev".incremented WHERE count > 5 ORDER BY block_num DESC'
```

**Interactive querying:**
```bash
# Open Amp Studio for a web-based query interface
just studio
```

## Creating a Derived Dataset

Derived tables let you pre-transform data for faster queries instead of doing transformations at query-time. 

**1. Start with the extended example:**
```bash
# Copy the example config with a derived table
cp amp.config.extended-example.ts amp.config.ts
```

**2. Understand the pattern:**
```typescript
tables: {
  ...baseTables,  // Spread existing event tables
  simple_filter: {  // Add a derived table 
    sql: `
      SELECT block_num, gas_used
      FROM anvil.blocks
      WHERE gas_used > 0
    `,
  },
}
```

**3. Deploy changes:**
```bash
just down
just up
```

**4. Test:**
```bash
# Query the new derived table
pnpm amp query 'SELECT * FROM "_/simple_filter@dev".simple_filter LIMIT 10'
```

**5. Use Amp Studio to prototype queries:**
1. Run `just studio` to open the web interface
2. Test your SQL against existing dependency tables (e.g., `anvil.blocks`, `anvil.logs`)
3. Once working, add the SQL to your `amp.config.ts` as a derived table
4. Remember: Studio supports all SQL operations, but derived tables have [streaming limitations](#streaming-model-limitations)


**6. Explore other derived datasets**
Explore published datasets in the [Amp Dataset Registry](https://playground.amp.thegraph.com/) and discover novel ways to transform your data.


# Advanced Features

## Built-in SQL Functions and UDFs

Amp provides specialized SQL functions for blockchain data operations:

**When you need them:**
- Working directly with raw logs from dependencies (e.g., `anvil.logs`)
- Custom encoding/decoding beyond what `eventTables(abi)` provides
- Making read-only contract calls via `eth_call`

**Available functions:**
- `evm_decode_log` - Decode raw event logs
- `evm_topic` - Get topic hash from event signature
- `evm_decode_params` / `evm_encode_params` - Decode/encode function parameters
- `evm_decode_type` / `evm_encode_type` - Decode/encode Solidity types
- `${dataset}.eth_call` - Execute read-only contract calls

**Note:** `eventTables(abi)` already handles event decoding automatically. You typically only need these functions for advanced use cases.

For complete documentation and examples, see [docs/udfs.md](docs/udfs.md).

# Troubleshooting

## Iterating Quickly

```bash
# Clean slate (clears cached data)
just down
just up
```

## Testing Derived Tables

**Validate SQL before deploying:**

```bash
# Build manifest to check for errors
pnpm amp build -o /tmp/test-manifest.json
```

## "Unknown dataset reference '_/counter@latest'"

**Cause:** Development datasets use `@dev`, not `@latest`.

**Fix:**
```bash
# ❌ Wrong
pnpm amp query 'SELECT * FROM "_/counter".incremented'

# ✅ Correct
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented'
```

## No Data in Tables

**Cause:** No transactions generated yet.

**Fix:** Interact with the frontend (http://localhost:5173) to increment/decrement the counter.

## Dataset Not Deploying

**Symptoms:** Queries fail, no data directories created.

**Debug steps:**
```bash
# Check logs
docker compose logs amp | grep counter

# Verify data directory exists
ls -la infra/amp/data/counter/

# Manually deploy
pnpm ampctl dataset deploy _/counter@dev
```

**Common causes:**
- SQL errors in derived tables (check build output)
- Streaming violations (see [Streaming Model Limitations](#streaming-model-limitations))
- Services not fully started (wait for `just up` to complete)
- Query returns no data - interact with Counter from the frontend to generate event data

## Config Changes Not Applying

**Cause:** Services need full restart to re-register dataset.

**Fix:**
```bash
just down
just up
```

## Build Errors

**"non-incremental operation: Limit":**
- Remove `LIMIT`, `ORDER BY`, `DISTINCT` from derived table SQL.

**"invalid value 'dev' for '--tag'":**
- Don't use `-t dev` flag. Use `@dev` in dataset reference only.

# Command Reference

## Basic Operations

- `just install` - Install all dependencies (npm + forge)
- `just up` - Start infrastructure, deploy contracts, register datasets
- `just dev` - Run frontend + Amp dev server (parallel)
- `just down` - Stop all services, clean volumes
- `just studio` - Open Amp Studio for interactive queries
- `just logs` - View logs from all processes

## Advanced Commands

- `just logs [service]` - Tail service logs
- `just stop [service]` - Stop specific service
- `pnpm amp build` - Build dataset manifest (validate SQL)
- `pnpm ampctl dataset deploy _/counter@dev` - Manually deploy dataset
- `pnpm amp query "<sql>"` - Run ad-hoc query

## Services Started by `just up`

- **PostgreSQL** (port 5432) - Database backend
- **Anvil** (port 8545) - Local Ethereum node
- **Amp** (ports 1602, 1603, 1610) - Data engineering layer
- **Adminer** (port 7402) - Database explorer UI

## What `just dev` Runs

1. **Frontend** (`pnpm dev`) - Vite dev server on port 5173
2. **Amp Dev Server** (`pnpm amp dev`) - Watches config changes, proxies queries

# Further Reading

- **[docs/config.md](docs/config.md)** - Complete Amp configuration reference (object stores, providers, environment variables)
- **[docs/modes.md](docs/modes.md)** - Production deployment patterns (single-node vs distributed, scaling strategies)
- **[docs/glossary.md](docs/glossary.md)** - Terminology and architecture concepts
- **[docs/udfs.md](docs/udfs.md)** - Complete built-in SQL function reference
>>>>>>> d69ce1a (Cleanup)
