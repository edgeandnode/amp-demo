# Amp - Quickstart Template for ETHGlobal Argentina

Template for building an Amp Dataset and ingesting the Dataset data in an application. Demos simple Amp config usage and consumption from a local and onchain development.

For more detailed documentation on Amp, see the [Amp Docs](docs/README.md). 

## Current Supported Chains

 - Foundry Anvil (local development)
 - Ethereum mainnet 
 - Arbitrum mainnet
 - Base mainnet
 - Base Sepolia. 

Roadmap includes all major chains.  

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Core Concepts](#core-concepts)
  - [Event Tables vs Derived Tables](#event-tables-vs-derived-tables)
  - [Streaming Model Limitations](#streaming-model-limitations)
  - [Dataset Tags (@dev vs @latest)](#dataset-tags-dev-vs-latest)
- [Querying Data](#querying-data)
  - [TypeScript/JavaScript API](#typescriptjavascript-api)
  - [CLI Queries](#cli-queries)
- [Advanced Features](#advanced-features)
  - [Built-in SQL Functions](#built-in-sql-functions)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Command Reference](#command-reference)
- [Further Reading](#further-reading)

# Prerequisites

## Required Software

- **Node.js** (v22+) with **Pnpm** (v10+)
- **Docker** for running services
- **Foundry** for smart contract development (`curl -L https://foundry.paradigm.xyz | bash`)
- **Just** as task runner (`cargo install just`)
- **Amp** (`curl --proto '=https' --tlsv1.2 -sSf https://ampup.sh/install | sh`)

> **⚠️ Version Requirements**
>
> Verify versions with `node --version` and `pnpm --version`. Older versions may cause compatibility issues.

# Quick Start

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

Open http://localhost:5173 in your browser. Interact with the counter to generate transactions.

## Test Processes With a Query

```bash
# In a new terminal, query your dataset
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented LIMIT 5'
```

## Project Structure

```
amp-demo/
├── amp.config.ts                    # Main dataset configuration
├── amp.config.extended-example.ts   # Example with derived tables
├── contracts/src/Counter.sol        # Smart contract (Incremented/Decremented events)
├── app/                             # Frontend application
│   └── src/components/              # Query usage examples
├── infra/
│   ├── amp/
│   │   ├── providers/               # Network connection configs
│   │   ├── data/                    # Runtime data (generated, not committed)
│   │   └── datasets/                # Build artifacts (generated, not committed)
│   └── docker-compose.yaml          # Infrastructure services
└── justfile                         # Task runner commands
```

## Amp Core Concepts

### Datasets

Datasets are a collection of tables that represents a unit of ownership, publishing and versioning. Datasets are identified by a namespace, name, and version/revision, and define how data is extracted, transformed, and materialized into Parquet files for querying.

Read more about Datasets in the [docs/glossary.md](docs/glossary.md).

#### Datasets Generate Queryable Tables 

`amp.config.ts` is responsible for defining datasets as well as the tables generated from these datasets. 

By passing in our abis to `eventTables(abi)`, tables are automatically generated and filled with decoded raw blockchain data. 

#### Event Tables vs Derived Tables

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

##### Streaming Model Limitations

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

#### Dataset Tags (@dev vs @latest)

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

## Querying Data

### TypeScript/JavaScript API

The frontend uses `@edgeandnode/amp` - a type-safe library built on Apache Arrow Flight.

### CLI Queries

```bash
# Query incremented events
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented LIMIT 10'

```


## Development Workflow

### Making Changes to amp.config.ts

1. Edit `amp.config.ts` (or copy from `amp.config.extended-example.ts`)
2. Restart services to re-register and deploy:
   ```bash
   just down
   just up
   ```
3. The dev server will automatically pick up changes

### Testing Derived Tables

Before deploying, validate your SQL:

```bash
# Build manifest to check for errors
pnpm amp build -o /tmp/test-manifest.json
```

Common errors:
- `UnqualifiedTable` - Forgot to qualify table name (use `anvil.blocks`, not `blocks`)
- `non-incremental operation: Limit` - Used unsupported operation
- `non-incremental operation: Aggregate` - Used DISTINCT/GROUP BY in complex context

### Iterating Quickly

```bash
# Clean slate (clears cached data)
just down
just up
```

### Using amp.config.extended-example.ts

The extended example shows a working derived table:

```bash
# Copy extended example
cp amp.config.extended-example.ts amp.config.ts

# Restart to apply
just down && just up
```

new naming

This adds a `simple_filter` table querying the `anvil` dependency. Modify the SQL to experiment with derived tables.


## Advanced Features

### Built-in SQL Functions and UDFs

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

## Troubleshooting

### "Unknown dataset reference '_/counter@latest'"

**Cause:** Development datasets use `@dev`, not `@latest`.

**Fix:**
```bash
# ❌ Wrong
pnpm amp query 'SELECT * FROM "_/counter".incremented'

# ✅ Correct
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented'
```

### No Data in Tables

**Cause:** No transactions generated yet.

**Fix:** Interact with the frontend (http://localhost:5173) to increment/decrement the counter.

### Dataset Not Deploying

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

### Config Changes Not Applying

**Cause:** Services need full restart to re-register dataset.

**Fix:**
```bash
just down
just up
```

### Build Errors

**"non-incremental operation: Limit":**
- Remove `LIMIT`, `ORDER BY`, `DISTINCT` from derived table SQL.

**"invalid value 'dev' for '--tag'":**
- Don't use `-t dev` flag. Use `@dev` in dataset reference only.

## Command Reference

### Basic Operations

- `just install` - Install all dependencies (npm + forge)
- `just up` - Start infrastructure, deploy contracts, register datasets
- `just dev` - Run frontend + Amp dev server (parallel)
- `just down` - Stop all services, clean volumes
- `just studio` - Open Amp Studio for interactive queries

### Advanced Commands

- `just logs [service]` - Tail service logs
- `just stop [service]` - Stop specific service
- `pnpm amp build` - Build dataset manifest (validate SQL)
- `pnpm ampctl dataset deploy _/counter@dev` - Manually deploy dataset
- `pnpm amp query "<sql>"` - Run ad-hoc query

### Services Started by `just up`

- **PostgreSQL** (port 5432) - Database backend
- **Anvil** (port 8545) - Local Ethereum node
- **Amp** (ports 1602, 1603, 1610) - Data engineering layer
- **Adminer** (port 7402) - Database explorer UI

### What `just dev` Runs

1. **Frontend** (`pnpm dev`) - Vite dev server on port 5173
2. **Amp Dev Server** (`pnpm amp dev`) - Watches config changes, proxies queries

## Further Reading

- **[docs/config.md](docs/config.md)** - Complete Amp configuration reference (object stores, providers, environment variables)
- **[docs/modes.md](docs/modes.md)** - Production deployment patterns (single-node vs distributed, scaling strategies)
- **[docs/glossary.md](docs/glossary.md)** - Terminology and architecture concepts
- **[docs/udfs.md](docs/udfs.md)** - Complete built-in SQL function reference
