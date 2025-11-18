# Amp Demo

Template for building an Amp Dataset and ingesting the Dataset data in an application. Demos simple Amp config usage and consumption.

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
  - [User-Defined Functions (UDFs)](#user-defined-functions-udfs)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Command Reference](#command-reference)

## Prerequisites

### Required Software

- **Node.js** (v22+) with **Pnpm** (v10+)
- **Docker** for running services
- **Foundry** for smart contract development (`curl -L https://foundry.paradigm.xyz | bash`)
- **Just** as task runner (`cargo install just`)
- **Amp** (`curl --proto '=https' --tlsv1.2 -sSf https://ampup.sh/install | sh`)

> **⚠️ Version Requirements**
>
> Verify versions with `node --version` and `pnpm --version`. Older versions may cause compatibility issues.

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

Open http://localhost:5173 in your browser. Interact with the counter to generate transactions.

### Verify Everything Works

```bash
# In a new terminal, query your dataset
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented LIMIT 5'

# Or open Amp Studio
just studio
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

## Core Concepts

### Datasets Generating Event Tables vs Derived Tables

**Event Tables** (from `eventTables(abi)`):
- Automatically generated from your smart contract ABI
- Map directly to blockchain events (e.g., `Incremented`, `Decremented`)
- Available immediately after deployment
- Use for ad-hoc queries and exploration

**Derived Tables** (optional custom SQL in `amp.config.ts`):
- Materialized views created from SQL queries
- Must follow streaming model constraints
- Can only query tables from **dependencies** (e.g., `anvil.blocks`, `anvil.logs`)
- Cannot reference other tables in the same dataset (no self-referencing)
- Use for complex transformations and optimized repeated queries

### Streaming Model Limitations

Derived tables use an **incremental/streaming model** - they process new blocks as they arrive. This requires all operations to be incrementally updatable.

**✅ Supported Operations:**
- `WHERE` - Filter rows
- `JOIN` - Join with dependency tables
- `UNION ALL` - Combine queries
- Window functions with `PARTITION BY block_num`
- Projections and column transformations

**❌ Unsupported Operations:**
- `LIMIT`, `OFFSET` - Cannot limit streaming data
- `ORDER BY` (global) - Cannot sort unbounded streams
- `DISTINCT` in subqueries - Aggregate operation
- `GROUP BY` with aggregates in subqueries
- Unbounded window functions (e.g., `ROW_NUMBER()`)
- Non-deterministic functions (`RANDOM()`, `NOW()`)
- Self-referencing (cannot query tables in same dataset)

**Example - Valid Derived Table:**
```typescript
// ✅ Queries dependency (anvil.blocks)
tables: {
  block_summary: {
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
// ❌ Self-reference (queries incremented in counter dataset)
tables: {
  combined: {
    sql: `SELECT * FROM incremented UNION ALL SELECT * FROM decremented`,
  },
}
```

**Best Practices for Self-Referencing:**
1. **Query-time joins** - Combine tables in your application queries
2. **UDFs** - Write custom TypeScript functions (see [UDFs](#user-defined-functions-udfs))

### Dataset Tags (@dev vs @latest)

Amp uses version tags to reference datasets:

- `@dev` - Development datasets (local, unpublished)
- `@0.0.1`, `@1.2.3` - Specific published versions
- `@latest` - Latest published version

**Critical:** Development datasets must use `@dev`:
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

# Query decremented events
pnpm amp query 'SELECT * FROM "_/counter@dev".decremented LIMIT 10'

# Join with anvil dependency
pnpm amp query 'SELECT i.count, b.timestamp FROM "_/counter@dev".incremented i JOIN "_/anvil@0.0.1".blocks b ON i.block_num = b.block_num'

# Check if data exists
pnpm amp query 'SELECT COUNT(*) FROM "_/counter@dev".incremented'
```

**Important:**
- Always use `@dev` for development datasets
- Tables are empty until you interact with the frontend to generate transactions
- Full SQL capabilities available (unlike derived tables in `amp.config.ts`)

## Advanced Features

### User-Defined Functions (UDFs)

UDFs allow custom TypeScript/JavaScript functions to process and transform data beyond SQL limitations. Use cases:

- Combining event tables from the same dataset
- Complex transformations not expressible in streaming SQL
- Custom business logic requiring procedural code
- Data enrichment via external APIs

#### Define UDF in amp.config.ts

```typescript
import { defineDataset, eventTables } from "@edgeandnode/amp"

export default defineDataset(({ functionSource }) => ({
  name: "counter",
  network: "anvil",
  dependencies: {
    anvil: "_/anvil@0.0.1",
  },
  tables: eventTables(abi),
  functions: {
    combineEvents: {
      source: functionSource("./functions/combineEvents.ts"),
      inputTypes: ["incremented", "decremented"],
      outputType: "combined_events",
    },
  },
}))
```

#### Implement UDF

Create `functions/combineEvents.ts`:

```typescript
// Process rows from incremented and decremented tables
export default function combineEvents(incremented: any[], decremented: any[]) {
  const combined = [
    ...incremented.map(row => ({ ...row, event_type: 'increment' })),
    ...decremented.map(row => ({ ...row, event_type: 'decrement' })),
  ]

  // Sort by block number and timestamp
  return combined.sort((a, b) =>
    a.block_num - b.block_num || a.block_timestamp - b.block_timestamp
  )
}
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
rm -rf infra/amp/data infra/amp/datasets
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

This adds a `block_summary` table querying the `anvil` dependency. Modify the SQL to experiment with derived tables.

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

**"table 'incremented' must be qualified":**
- You're trying to self-reference. Use dependency tables instead or UDFs.

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
