import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

export default defineDataset(() => {
  const baseTables = eventTables(abi)

  return {
    name: "simple_filter",
    network: "anvil",
    description: "Demo dataset with event tables and a derived table from anvil blocks.",
    readme: `# Amp Demo - Extended Example

Demonstrates combining event tables (from eventTables) with a derived table (custom SQL).

## Tables
- \`incremented\` / \`decremented\`: Event tables auto-generated from contract ABI
- \`simple_filter\`: Derived table filtering blocks by gas usage from anvil dependency
`,
    keywords: ["Anvil", "Derived", "Demo"],
    dependencies: {
      anvil: "_/anvil@0.0.1",
    },
    tables: {
      ...baseTables,
      simple_filter: {
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
