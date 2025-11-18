# Amp Demo

Template for building an Amp Dataset and ingesting the Dataset data in an application. Demos simple Amp config usage and consumption.

## Table of Contents

This document is broken up into parts to get you from 0 -> 1 -> published for your Amp Dataset.

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Dev Commands](#development-commands)

## Prerequisites

### Required Software

- **Node.js** (v22+) with **Pnpm** (v10+)
- **Docker** for running services
- **Foundry** for smart contract development (`curl -L https://foundry.paradigm.xyz | bash`)
- **Just** as task runner (recommended, `cargo install just`)
- **Amp** for running Amp (`curl --proto '=https' --tlsv1.2 -sSf https://ampup.sh/install | sh`)

> **⚠️ Version Requirements ⚠️**
>
> Please verify you're running Node.js v22+ and Pnpm v10+ before proceeding. Older versions may cause compatibility issues. Check your versions with `node --version` and `pnpm --version`.

## Quick Start

1. **Clone and install dependencies:**

   ```bash
   # NOTE: Make sure to use `--recursive` to also clone the `forge-std` git submodule
   git clone --recursive <repository-url>
   cd amp-demo
   just install
   ```

2. **Install Amp**

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://ampup.sh/install | sh
   ```

3. **Start services:**

   ```bash
   just up
   ```

4. **Start development servers:**
   ```bash
   just dev
   ```
5. **Open your browser:**
   - UI: http://localhost:5173

## Installation

### 1. Environment Setup

Clone the repository (with `--recursive`) and install dependencies:

```bash
# NOTE: Make sure to use `--recursive` to also clone the `forge-std` git submodule
git clone --recursive <repository-url>
cd amp-demo
just install
```

### 2. Start Infrastructure Services

Launch PostgreSQL, Anvil (local Ethereum), and other services:

```bash
just up
```

This starts:

- **PostgreSQL** (port 5432) - Database backend
- **Anvil** (port 8545) - Local Ethereum node
- **Amp** (ports 1602, 1603, 1610) - Data engineering layer
- **Adminer** (port 7402) - Database explorer

### 3. Start Application

Start the application frontend and the Amp development & proxy servers.

```bash
just dev
```

### 4. Validate Queries

Start the Amp local studio to view and query your Amp Dataset and contract events; as well as the raw anvil logs, transactions and blogs.

```bash
just studio
```

## Important Directories and Files

- `amp.config.ts` — The main dataset manifest to read first; shows how ABI events become tables and where you add/iterate on derived SQL tables (see inline example). Start here to see how Amp wires the Counter ABI into queryable tables, then layer on your own transformations using SQL to create custom materialized views of event data.
- `amp.config.extended-example.ts` — Optional example config that includes a derived union table to illustrate stacking transformations on top of the generated event tables.
- `infra/amp/providers/` — Amp provider configs (e.g., Anvil connection credentials/endpoints).
- `infra/amp/data` — Local data directory Amp uses at runtime (DuckDB/cache artifacts).
- `infra/amp/datasets` — Generated dataset artifacts and cache produced by Amp runs.
- `contracts/src/Counter.sol` — Demo smart contract emitting the `Incremented`/`Decremented` events the dataset ingests.

### Understanding Datasets

- Raw tables (from `eventTables(abi)`) expose blockchain logs/events directly. Use them for ad-hoc exploration, debugging, and on-the-fly transforms at query time.
- Derived tables (your SQL in `amp.config.ts`) materialize transformed results as new tables. Use them when you need faster repeat queries, curated shapes for the app, or heavier logic you don’t want to recompute per request.

Quick start:
- Run `just up` then `just studio` to inspect raw tables (e.g., `incremented`, `decremented`) and try ad-hoc queries.
- Try pasting the contents of `amp.config.extended-example.ts` into `amp.config.ts` to see a working derived table (creates a new `block_summary` table from the anvil dependency). Then tweak the SQL and rerun Amp to iterate quickly.
- **After updating `amp.config.ts`**: Run `just down` then `just up` to re-register the dataset with your new tables. The dev server (`just dev`) will pick up the changes automatically.
- When experimenting, clearing `infra/amp/data` and `infra/amp/datasets` can give you a clean slate for ingestion.
- When querying via CLI, qualify tables with the dataset: the default namespace is `_` and the dataset name here is `counter`, so use `"_/counter".incremented`, `"_/counter".decremented`, or `"_/counter".block_summary` (the slash requires quoting). Example:
  `pnpm amp query "SELECT block_num, timestamp, count AS value, 'increment' AS direction FROM \"_/counter\".incremented UNION ALL SELECT block_num, timestamp, count AS value, 'decrement' AS direction FROM \"_/counter\".decremented"`.

### Streaming Model Limitations

Derived tables in Amp use an **incremental/streaming model** to process new blocks as they arrive. This requires all SQL operations to be **incrementally updatable**. The following operations are **not supported** in derived tables:

**Supported Operations:**
- `WHERE` - Filter rows based on conditions
- `JOIN` - Join with tables from dependencies (e.g., `anvil.blocks`, `anvil.logs`)
- `UNION ALL` - Combine multiple queries
- Window functions with partitioning (e.g., `PARTITION BY block_num`)
- Simple projections and column transformations

**Unsupported Operations:**
- `LIMIT` - Cannot limit results in a streaming context
- `OFFSET` - Cannot skip rows in a streaming context
- `ORDER BY` (global) - Cannot globally sort unbounded streaming data
- `DISTINCT` - Aggregate operation not supported in subqueries or complex contexts
- `GROUP BY` with aggregates in subqueries (e.g., `SELECT DISTINCT` in `WHERE IN`)
- Window functions with unbounded frames (e.g., `ROW_NUMBER()` over entire table)
- Non-deterministic functions (e.g., `RANDOM()`, `NOW()`)
- Self-joins or recursive queries referencing tables in the same dataset

**Best Practices:**
- Always include `block_num` in your queries for efficient incremental processing
- Use `WHERE` clauses to filter early and reduce data volume
- Partition window functions by `block_num` when possible
- Test your derived table SQL with `pnpm amp build` before deploying

**Important Limitation - Self-Referencing:**
- Derived tables **cannot reference other tables in the same dataset**
- You cannot query `incremented` or `decremented` from within a derived table in the `counter` dataset
- Derived tables can only query tables from **dependencies** (e.g., `anvil.blocks`, `anvil.logs`, `anvil.transactions`)
- If you need to combine event tables (like `incremented` + `decremented`), you have two options:
  1. **Query time** - Combine them in your application queries (e.g., using `UNION ALL` in your app)
  2. **User-Defined Functions (UDFs)** - Write custom functions to process and combine event data (see `amp.config.ts` for UDF examples)
- Example: ✅ `SELECT * FROM anvil.blocks` (queries dependency) vs ❌ `SELECT * FROM incremented` (self-reference)

> **Note:** UDFs allow you to write custom TypeScript/JavaScript functions that can process rows from event tables and output combined/transformed data. This is the recommended approach for complex transformations that can't be expressed in SQL or need to reference tables within the same dataset.

### User-Defined Functions (UDFs)

UDFs allow you to write custom TypeScript/JavaScript functions to process and transform data beyond what's possible with SQL alone. This is particularly useful for:

- **Combining event tables** from the same dataset (e.g., merging `incremented` and `decremented`)
- **Complex transformations** that can't be expressed in streaming SQL
- **Custom business logic** that requires procedural code
- **Data enrichment** by calling external APIs or performing calculations

#### UDF Structure

UDFs are defined in the `functions` section of your `amp.config.ts`:

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
    // Define your UDF here
    combineEvents: {
      source: functionSource("./functions/combineEvents.ts"),
      inputTypes: ["incremented", "decremented"],
      outputType: "combined_events",
    },
  },
}))
```

#### UDF Implementation

Create a function file (e.g., `functions/combineEvents.ts`):

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

### Development Commands


#### Basic Operations

- `just install` - Install all dependencies
- `just up [services]` - Start infrastructure services
- `just dev` - Run all development services in parallel
- `just down` - Stop all services and clean up
