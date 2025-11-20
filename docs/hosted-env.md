
# Hosted Environment Workflow

Ready to move from local Anvil development? This section covers configuring your Amp instance to consume published datasets hosted by Edge & Node.

## Supported Networks

- **ethereum-mainnet** - Ethereum L1
- **arbitrum-one** - Arbitrum L2
- **base-mainnet** - Base L2
- **base-sepolia** - Base Sepolia testnet

## Configuration

**Key concept:** You don't need to run your own blockchain indexer or configure custom providers. Your dataset simply declares a dependency on a published raw dataset (e.g., `edgeandnode/ethereum_mainnet@0.0.1`), and Amp handles the rest.

### Step 1: Update Your Environment

Rename `.env.example` to `.env`.

Then edit `.env`:

```bash
# Uncomment your target dataset and network, e.g.:
VITE_AMP_RPC_DATASET=edgeandnode/ethereum_mainnet@0.0.1
VITE_AMP_NETWORK=ethereum-mainnet
```

### Step 2: Update Your Dataset Configuration

Edit `amp.config.ts` to target your onchain network:

```typescript
import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

export default defineDataset(() => ({
  name: "counter",
  network: "ethereum-mainnet",  // Match your target network
  dependencies: {
    rpc: "edgeandnode/ethereum_mainnet@0.0.1",  // Use published raw dataset
  },
  tables: eventTables(abi, "rpc"),
  namespace: "your_namespace",  // Required for publishing
  description: "Counter dataset tracking increment/decrement events on Ethereum",
  keywords: ["Ethereum", "Counter", "Events"],
}))
```

**Important:** Your contract must be deployed to the target network, and the ABI must match the deployed contract.

**Discover More Patterns:**

Explore published datasets in the [Amp Dataset Registry](https://playground.amp.thegraph.com/) to discover novel ways to transform your data.

## Testing Your Hosted Environment Setup

Verify your dataset queries hosted datasets correctly.

### 1. Build Your Dataset Locally

```bash
pnpm amp build -o /tmp/test-manifest.json
```

This validates your SQL and configuration without deploying.

### 2. Query via CLI

Test querying the published raw dataset directly:

```bash
# Authenticate first (generates temporary token)
pnpm amp auth token --duration "1 hour"

# Query the raw dataset
pnpm amp query \
  --flight-url https://gateway.amp.staging.thegraph.com \
  --bearer-token YOUR_TOKEN_HERE \
  'SELECT block_num, hash FROM "edgeandnode/ethereum_mainnet@0.0.1".blocks ORDER BY block_num DESC LIMIT 5'
```

You should see recent Ethereum mainnet blocks, confirming you're querying published datasets representing onchain data.

### 3. Verify Contract Address

Ensure your queries reference the correct deployed contract address:

```bash
# Query logs from your contract
pnpm amp query \
  --flight-url https://gateway.amp.staging.thegraph.com \
  --bearer-token YOUR_TOKEN_HERE \
  'SELECT block_num, tx_hash FROM "edgeandnode/ethereum_mainnet@0.0.1".logs WHERE address = 0xYOUR_CONTRACT_ADDRESS LIMIT 10'
```

If you get results, your contract is emitting events on the target network.

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