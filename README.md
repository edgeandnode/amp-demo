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
cd battleship
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

## Usage

### Development Commands

#### Basic Operations

- `just install` - Install all dependencies
- `just up [services]` - Start infrastructure services
- `just dev` - Run all development services in parallel
- `just down` - Stop all services and clean up
