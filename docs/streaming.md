# Streaming SQL in Amp

This guide explains how Amp's streaming model works and what SQL operations you can use when defining derived tables.

## Overview

Amp processes blockchain data as a **continuous stream**. When you define a derived table, Amp incrementally updates it as new blocks arrive rather than recomputing the entire table each time.

This streaming model enables real-time data processing but requires SQL queries to be **incrementally updatable**—meaning Amp can add new rows without recalculating everything.

## Key Concepts

**What happens when you define a derived table:**
1. Amp reads new blocks from the blockchain
2. It runs your SQL query on the new data
3. It appends the results to your derived table
4. The process repeats for each new block

**Important:** Your SQL must work correctly when run incrementally. Operations that require seeing all data at once (like `GROUP BY` with aggregates) don't work in this model.

## Supported Operations

These SQL operations work in derived table definitions because they can be computed incrementally:

### Filtering with WHERE

```typescript
tables: {
  high_value_transfers: {
    sql: `
      SELECT *
      FROM anvil.logs
      WHERE topic0 = '0x...' -- Transfer event signature
        AND value > 1000000000000000000 -- > 1 ETH
    `,
  },
}
```

### Projections and Transformations

```typescript
tables: {
  formatted_blocks: {
    sql: `
      SELECT
        block_num,
        hash AS block_hash,
        timestamp,
        gas_used,
        gas_used * 100 / gas_limit AS gas_utilization_pct
      FROM anvil.blocks
    `,
  },
}
```

### Joins with Dependency Tables

```typescript
tables: {
  transactions_with_blocks: {
    sql: `
      SELECT
        t.hash AS tx_hash,
        t.from_addr,
        t.to_addr,
        b.timestamp,
        b.block_num
      FROM anvil.transactions t
      JOIN anvil.blocks b ON t.block_num = b.block_num
    `,
  },
}
```

### UNION ALL

```typescript
tables: {
  all_token_events: {
    sql: `
      SELECT * FROM "_/token-a@dev".transfers
      UNION ALL
      SELECT * FROM "_/token-b@dev".transfers
    `,
  },
}
```

### CASE Expressions

```typescript
tables: {
  categorized_transactions: {
    sql: `
      SELECT
        hash,
        gas_used,
        CASE
          WHEN gas_used < 21000 THEN 'minimal'
          WHEN gas_used < 100000 THEN 'moderate'
          ELSE 'complex'
        END AS complexity
      FROM anvil.transactions
    `,
  },
}
```

## Unsupported Operations in Table Definitions

These SQL operations **cannot** be used when defining derived tables because they require seeing all data at once:

### ❌ LIMIT and OFFSET

```typescript
// ❌ INVALID - Cannot limit a stream
tables: {
  recent_blocks: {
    sql: `
      SELECT * FROM anvil.blocks
      LIMIT 100  -- Error: non-incremental operation
    `,
  },
}
```

**Workaround:** Use `LIMIT` when querying the table, not in its definition:
```bash
# ✅ Valid - LIMIT at query time
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented LIMIT 100'
```

### ❌ ORDER BY (Global)

```typescript
// ❌ INVALID - Cannot globally sort a stream
tables: {
  sorted_transactions: {
    sql: `
      SELECT * FROM anvil.transactions
      ORDER BY gas_used DESC  -- Error: cannot order unbounded stream
    `,
  },
}
```

**Workaround:** Use `ORDER BY` when querying:
```bash
# ✅ Valid - ORDER BY at query time
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented ORDER BY block_num DESC'
```

### ❌ GROUP BY with Aggregates

```typescript
// ❌ INVALID - Aggregates need all data
tables: {
  block_summary: {
    sql: `
      SELECT
        block_num,
        COUNT(*) as tx_count,
        SUM(gas_used) as total_gas
      FROM anvil.transactions
      GROUP BY block_num  -- Error: aggregate not supported
    `,
  },
}
```

**Workaround:** Use aggregates when querying:
```bash
# ✅ Valid - GROUP BY at query time
pnpm amp query '
  SELECT block_num, COUNT(*) as tx_count
  FROM anvil.transactions
  GROUP BY block_num
'
```

### ❌ DISTINCT

```typescript
// ❌ INVALID - Requires tracking all seen values
tables: {
  unique_addresses: {
    sql: `
      SELECT DISTINCT from_addr
      FROM anvil.transactions  -- Error: DISTINCT not supported
    `,
  },
}
```

**Workaround:** Use `DISTINCT` at query time.

### ❌ Window Functions

```typescript
// ❌ INVALID - Window functions need partitioned data
tables: {
  ranked_transactions: {
    sql: `
      SELECT
        hash,
        gas_used,
        ROW_NUMBER() OVER (PARTITION BY block_num ORDER BY gas_used DESC) as rank
      FROM anvil.transactions  -- Error: window functions not supported
    `,
  },
}
```

**Workaround:** Use window functions at query time.

### ❌ Non-Deterministic Functions

```typescript
// ❌ INVALID - Results would differ on each reprocessing
tables: {
  random_sample: {
    sql: `
      SELECT * FROM anvil.blocks
      WHERE RANDOM() < 0.1  -- Error: non-deterministic
    `,
  },
}
```

### ❌ Self-Referencing

```typescript
// ❌ INVALID - Cannot query tables in the same dataset
export default defineDataset(() => {
  return {
    name: "my-dataset",
    tables: {
      table_a: {
        sql: `SELECT * FROM anvil.blocks`,
      },
      table_b: {
        sql: `
          SELECT * FROM "_/my-dataset@dev".table_a  -- Error: self-reference
        `,
      },
    },
  };
});
```

**Why:** Amp needs to determine table build order. Self-references create circular dependencies.

**Workaround:** Create multiple datasets or use dependencies.

## Common Patterns

### Pattern 1: Pre-Filter High-Volume Tables

Instead of querying millions of logs each time, pre-filter to just the events you need:

```typescript
tables: {
  usdc_transfers: {
    sql: `
      SELECT *
      FROM anvil.logs
      WHERE address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' -- USDC
        AND topic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' -- Transfer
    `,
  },
}
```

Then query with fast aggregations:
```bash
pnpm amp query '
  SELECT COUNT(*) as transfer_count
  FROM "_/my-dataset@dev".usdc_transfers
'
```

### Pattern 2: Enrich Events with Block Data

Join events with block metadata to avoid querying blocks separately later:

```typescript
tables: {
  transfers_with_time: {
    sql: `
      SELECT
        l.address AS token,
        l.data,
        l.topics,
        b.timestamp,
        b.block_num
      FROM anvil.logs l
      JOIN anvil.blocks b ON l.block_num = b.block_num
      WHERE l.topic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    `,
  },
}
```

### Pattern 3: Combine Multiple Event Types

Use `UNION ALL` to create a unified view of related events:

```typescript
tables: {
  all_value_transfers: {
    sql: `
      SELECT block_num, from_addr, to_addr, value, 'eth' AS type
      FROM anvil.transactions
      WHERE value > 0

      UNION ALL

      SELECT block_num, from_addr, to_addr, value, 'token' AS type
      FROM "_/erc20-events@dev".transfers
    `,
  },
}
```

### Pattern 4: Decode and Transform

Use Amp's built-in functions to decode event data (see [UDFs](https://github.com/edgeandnode/amp/blob/main/docs/udfs.md)):

```typescript
tables: {
  decoded_swaps: {
    sql: `
      SELECT
        block_num,
        evm_decode_log(
          data,
          topics,
          'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'
        ) AS decoded_data
      FROM anvil.logs
      WHERE topic0 = evm_topic('Swap(address,uint256,uint256,uint256,uint256,address)')
    `,
  },
}
```

## Testing Your SQL

Before deploying a derived table, test your SQL:

### 1. Prototype in Amp Studio

```bash
just studio
```

Run your query interactively. If it works in Studio, it will work as a derived table (assuming it follows streaming limitations).

### 2. Validate Build

```bash
pnpm amp build -o /tmp/test-manifest.json
```

This checks your SQL syntax and streaming compliance without deploying.

### 3. Deploy and Test

```bash
just down
just up
pnpm amp query 'SELECT * FROM "_/your-dataset@dev".your_table LIMIT 5'
```

## Performance Tips

### Tip 1: Filter Early

```typescript
// ✅ Good - Filter before joining
sql: `
  SELECT t.hash, b.timestamp
  FROM (
    SELECT * FROM anvil.transactions WHERE value > 0
  ) t
  JOIN anvil.blocks b ON t.block_num = b.block_num
`

// ❌ Less efficient - Join then filter
sql: `
  SELECT t.hash, b.timestamp
  FROM anvil.transactions t
  JOIN anvil.blocks b ON t.block_num = b.block_num
  WHERE t.value > 0
`
```

### Tip 2: Use Specific Columns

```typescript
// ✅ Good - Only select what you need
sql: `
  SELECT block_num, hash, timestamp
  FROM anvil.blocks
`

// ❌ Wasteful - Selects all columns
sql: `
  SELECT *
  FROM anvil.blocks
`
```

### Tip 3: Index-Friendly Filters

Use equality on indexed columns (like `block_num`, `address`) for faster scans:

```typescript
sql: `
  SELECT *
  FROM anvil.logs
  WHERE address = '0x...'  -- ✅ Indexed
    AND block_num >= 1000000  -- ✅ Indexed
`
```

## When to Use Derived Tables vs Query-Time Processing

### Use Derived Tables When:
- You repeatedly query the same filtered/joined data
- You need subsecond query latency
- Your transformations are streaming-compatible
- You want to pre-compute complex joins

### Use Query-Time Processing When:
- You need aggregations (`COUNT`, `SUM`, `AVG`)
- You need sorting or limiting
- You're exploring data and queries change frequently
- The transformation is simple (single `WHERE` clause)

## Examples from the Template

The template includes `amp.config.extended-example.ts` with working examples:

```bash
# View the extended example
cat amp.config.extended-example.ts
```

This shows:
- Filtering dependency tables
- Joining blocks with transactions
- Using built-in functions
- Proper SQL structure for streaming

## Need Help?

- **Syntax errors:** Check [DuckDB SQL docs](https://duckdb.org/docs/sql/introduction) (Amp uses DuckDB SQL)
- **Streaming errors:** Review the [Unsupported Operations](#unsupported-operations-in-table-definitions) section
- **Performance issues:** See [Performance Tips](#performance-tips)
- **Questions:** Open an issue on GitHub
