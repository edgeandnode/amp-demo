import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

// Example config showing how to work with event tables and the anvil dependency
export default defineDataset(() => {
  const baseTables = eventTables(abi)

  return {
    name: "counter",
    network: "anvil",
    description: "Demo dataset with event tables and a custom table from anvil blocks.",
    readme: `# Amp Demo - Extended Example

This demonstrates event tables plus a simple derived table from the anvil dependency.

## Event Tables (from eventTables)
- \`decremented\`: Decrement events from the contract
- \`incremented\`: Increment events from the contract

## Derived Tables (custom SQL)
- \`block_summary\`: Simple aggregation showing block count
`,
    keywords: ["Anvil", "Derived", "Demo"],
    dependencies: {
      anvil: "_/anvil@0.0.1",
    },
    tables: {
      ...baseTables,
      // Custom table: Blocks with gas usage from anvil dependency
      block_summary: {
        sql: `
          SELECT
            block_num,
            hash AS block_hash,
            timestamp,
            gas_used,
            gas_limit,
            miner
          FROM anvil.blocks
          WHERE gas_used > 0
        `,
      },
    },
  }
})
