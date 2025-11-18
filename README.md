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
- Try pasting the contents of `amp.config.extended-example.ts` into `amp.config.ts` to see a working derived table (creates a new `counter_event_union` table that unions the events with a direction flag). Then tweak the SQL and rerun Amp to iterate quickly.
- When experimenting, clearing `infra/amp/data` and `infra/amp/datasets` can give you a clean slate for ingestion.
- When querying via CLI, qualify tables with the dataset: the default namespace is `_` and the dataset name here is `counter`, so use `"_/counter".incremented`, `"_/counter".decremented`, or `"_/counter".counter_event_union` (the slash requires quoting). Example:  
  `pnpm amp query "SELECT block_num, timestamp, count AS value, 'increment' AS direction FROM \"_/counter\".incremented UNION ALL SELECT block_num, timestamp, count AS value, 'decrement' AS direction FROM \"_/counter\".decremented"`.

### Development Commands

#### Basic Operations

- `just install` - Install all dependencies
- `just up [services]` - Start infrastructure services
- `just dev` - Run all development services in parallel
- `just down` - Stop all services and clean up
