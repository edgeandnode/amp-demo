# Hosted Environment Workflow

Ready to move beyond local development? This guide covers how to work with Amp's hosted service maintained by Edge & Node.

## What Is the Hosted Service?

Edge & Node maintains published datasets that contain blocks, transactions, and logs indexed in real-time, queryable via SQL.

**Why use it?**
- **No infrastructure** - No blockchain nodes, no indexers, no database setup
- **Instant queries** - Query and transform mainnet data immediately with SQL
- **Production ready** - Build applications on reliable, hosted datasets
- **Composable** - Combine multiple published datasets in your queries

## Supported Networks

- **ethereum-mainnet** - Ethereum L1
- **arbitrum-one** - Arbitrum L2
- **base-mainnet** - Base L2
- **base-sepolia** - Base Sepolia testnet

Roadmap includes all major chains.

## Three Entry Points

1. **Query existing datasets** - Build on published datasets immediately
2. **Transition from local to hosted** - Move your local development to hosted networks
3. **Publish your dataset** - Share your dataset for others to use

---

# Query Existing Datasets

Build applications on published blockchain data without local setup.


## Step 1: Test 

Run test queries at [playground.amp.thegraph.com](https://playground.amp.thegraph.com/) and determine if you are getting the data you need. 

## Step 2: Generate Auth Token

```bash
pnpm amp auth token --duration "3 days"
```

Save this token—you'll use it for CLI queries and configure it in your application's environment variables.

## Step 3: Query 

### From Your CLI

```bash
pnpm amp query \
  --flight-url https://gateway.amp.staging.thegraph.com \
  --bearer-token YOUR_TOKEN_HERE \
  'SELECT block_num, hash FROM "edgeandnode/ethereum_mainnet@0.0.1".blocks ORDER BY block_num DESC LIMIT 5'
```

**Filter for specific contracts:**

```bash
pnpm amp query \
  --flight-url https://gateway.amp.staging.thegraph.com \
  --bearer-token YOUR_TOKEN_HERE \
  'SELECT block_num, tx_hash FROM "edgeandnode/ethereum_mainnet@0.0.1".logs WHERE address = 0xYOUR_CONTRACT_ADDRESS LIMIT 10'
```

### From Your Application

Add the gateway URL and token to your environment:

```bash
VITE_AMP_QUERY_URL=https://gateway.amp.staging.thegraph.com
VITE_AMP_QUERY_TOKEN=amp_your_token_here
```

Configure your Amp client to use these values. This template includes the auth pattern in `app/src/lib/runtime.ts`.

```typescript
import { ArrowFlight } from "@edgeandnode/amp";
import { Effect, Stream } from "effect";

const query = Effect.gen(function* () {
  const arrow = yield* ArrowFlight.ArrowFlight;

  // Query any published dataset
  const sql = `
    SELECT block_num, hash, gas_used
    FROM "edgeandnode/ethereum_mainnet@0.0.1".blocks
    WHERE gas_used > 0
    ORDER BY block_num DESC
    LIMIT 100
  `;

  return yield* arrow.query([sql] as any).pipe(Stream.runCollect);
});
```

---

# Transition from Local to Hosted

Move your local development to the hosted environment.

## Prerequisites

- Contract deployed to target network
- ABI matches deployed contract

**Key concept:** You don't need to run your own blockchain indexer or configure custom providers. Your dataset declares a dependency on a published raw dataset (e.g., `edgeandnode/ethereum_mainnet@0.0.1`), and Amp handles the rest.

## Step 1: Configure Environment

Rename `.env.example` to `.env` and edit:

```bash
cp .env.example .env
```

Uncomment your target network in `.env`:

```bash
VITE_AMP_RPC_DATASET=edgeandnode/ethereum_mainnet@0.0.1
VITE_AMP_NETWORK=ethereum-mainnet
```

## Step 2: Update Dataset Config

Edit `amp.config.ts` to target your onchain network:

```typescript
import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

export default defineDataset(() => ({
  name: "counter",
  network: "ethereum-mainnet",  // Match .env
  dependencies: {
    rpc: "edgeandnode/ethereum_mainnet@0.0.1",  // Match .env
  },
  tables: eventTables(abi, "rpc"),
}))
```

The ABI must match your deployed contract.

## Step 3: Test Configuration

### Validate Build

```bash
pnpm amp build -o /tmp/test-manifest.json
```

### Generate Token

```bash
pnpm amp auth token --duration "3 days"
```

Add this token to `.env` as `VITE_AMP_QUERY_TOKEN`.

### Verify Connection

Query the hosted dataset:

```bash
pnpm amp query \
  --flight-url https://gateway.amp.staging.thegraph.com \
  --bearer-token YOUR_TOKEN_HERE \
  'SELECT block_num, hash FROM "edgeandnode/ethereum_mainnet@0.0.1".blocks ORDER BY block_num DESC LIMIT 5'
```

### Verify Your Contract

Confirm your contract is emitting events:

```bash
pnpm amp query \
  --flight-url https://gateway.amp.staging.thegraph.com \
  --bearer-token YOUR_TOKEN_HERE \
  'SELECT block_num, tx_hash FROM "edgeandnode/ethereum_mainnet@0.0.1".logs WHERE address = 0xYOUR_CONTRACT_ADDRESS LIMIT 10'
```

If you see results, you're connected.

## Step 4: Run Your App

```bash
just dev
```

---

# Publish Your Dataset

Share your dataset publicly via the Amp registry.

## Prerequisites

- Local queries return expected data
- Contract deployed to target network
- Dataset configured in `amp.config.ts`

## Step 1: Add Publishing Metadata

**Update `amp.config.ts`:**

```typescript
import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

export default defineDataset(() => ({
  name: "counter",
  network: "ethereum-mainnet",  // Target network
  dependencies: {
    rpc: "edgeandnode/ethereum_mainnet@0.0.1",  // Published raw dataset
  },
  tables: eventTables(abi, "rpc"),

  // Required for publishing
  namespace: "your_namespace",  // Your 0x address, ENS, or organization
  description: "Counter dataset tracking increment/decrement events",
  keywords: ["Ethereum", "Counter", "Events"],
}))
```

## Step 2: Authenticate

```bash
pnpm amp auth login
```

## Step 3: Publish

```bash
pnpm amp publish --tag "0.0.1" --changelog "Initial release"
```

Your dataset is now published at: `your_namespace/counter@0.0.1`

**View in registry:** [playground.amp.thegraph.com](https://playground.amp.thegraph.com/)

## Step 4: Query Your Published Dataset

Anyone can query your dataset:

```bash
pnpm amp query \
  --flight-url https://gateway.amp.staging.thegraph.com \
  --bearer-token YOUR_TOKEN \
  'SELECT * FROM "your_namespace/counter@0.0.1".incremented LIMIT 10'
```

Update your application queries:

```typescript
// Local development
const query = 'SELECT * FROM "_/counter@dev".incremented LIMIT 10'

// Published - specific version
const query = 'SELECT * FROM "your_namespace/counter@0.0.1".incremented LIMIT 10'

// Published - always use latest
const query = 'SELECT * FROM "your_namespace/counter@latest".incremented LIMIT 10'
```

## Updating Your Dataset

Publish new versions:

```bash
pnpm amp publish --tag "0.0.2" --changelog "Added derived table"
```

Users can query `@0.0.2` or `@latest` to automatically use the most recent.

## Dataset Versioning

- `@dev` - Local development (unpublished)
- `@0.0.1`, `@1.2.3` - Specific published versions
- `@latest` - Most recent published version (updates automatically)


## Publishing Your Dataset (Optional)

Once your dataset is configured and tested, you can publish it to make it publicly queryable via the Amp registry.

### Prerequisites

- Dataset configured for target network (steps above completed)
- Contract deployed to target network
- Tested queries return expected data

### Step 1: Update Dataset Metadata

Add recommended metadata to `amp.config.ts` for discoverability:

```typescript
export default defineDataset(() => ({
  name: "counter",
  network: "ethereum-mainnet",
  dependencies: {
    rpc: "edgeandnode/ethereum_mainnet@0.0.1",
  },
  tables: eventTables(abi, "rpc"),

  // Required for publishing
  namespace: "your_namespace",  // Your 0x address, ENS name, or organization

  // Recommended for discoverability
  description: "Tracks increment and decrement events from the Counter contract on Ethereum mainnet",
  readme: `# Counter Dataset

This dataset indexes Incremented and Decremented events from the Counter smart contract.

## Tables
- \`incremented\` - All increment events with count values
- \`decremented\` - All decrement events with count values

## Usage
\`\`\`sql
SELECT block_num, count FROM "your_namespace/counter@0.0.1".incremented LIMIT 10
\`\`\`
  `,
  keywords: ["Ethereum", "Counter", "Events", "Demo"],
  sources: ["0xYourContractAddress"],  // Deployed contract addresses
  // private: true,  // Uncomment to make dataset private (only you can query)
}))
```

### Step 2: Authenticate

```bash
pnpm amp auth login
```

This opens a browser for wallet or social authentication.

### Step 3: Publish

```bash
pnpm amp publish --tag "0.0.1" --changelog "Initial release"
```

- `--tag` (REQUIRED) - Semantic version: `{major}.{minor}.{patch}`
- `--changelog` (optional) - Describe changes in this version

Your dataset is now published to the registry at: `your_namespace/counter@0.0.1`

### Step 4: Generate Auth Token

Generate a long-lived token for your application:

```bash
pnpm amp auth token --duration "30 days"
```

Copy the token and update your `.env`:

```bash
VITE_AMP_QUERY_TOKEN=amp_your_token_here
```

### Step 5: Update Dataset References

In your application code, update queries to reference the published version:

```typescript
// Before (local dev)
const query = 'SELECT * FROM "_/counter@dev".incremented LIMIT 10'

// After (published)
const query = 'SELECT * FROM "your_namespace/counter@0.0.1".incremented LIMIT 10'
```

Or use `@latest` to always query the most recent published version:

```typescript
const query = 'SELECT * FROM "your_namespace/counter@latest".incremented LIMIT 10'
```

### Step 6: Query Your Published Dataset

Your dataset is now publicly available. Anyone can query it:

```bash
pnpm amp query \
  --flight-url https://gateway.amp.staging.thegraph.com \
  --bearer-token YOUR_TOKEN \
  'SELECT * FROM "your_namespace/counter@0.0.1".incremented LIMIT 10'
```

**View in registry:** https://playground.amp.thegraph.com/

### Updating Your Dataset

To publish a new version:

1. Update your `amp.config.ts`
2. Increment the version: `pnpm amp publish --tag "0.0.2" --changelog "Added new derived table"`
3. Users can query `@0.0.2` for the new version or `@latest` to automatically use it

### Version Tags

- `@dev` - Local development (unpublished)
- `@0.0.1`, `@1.2.3` - Specific published versions
- `@latest` - Most recent published version (updates automatically)