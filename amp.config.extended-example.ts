import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

// Example config that layers a derived table on top of the ABI-driven event tables.
export default defineDataset(() => {
  const baseTables = eventTables(abi)

  return {
    name: "counter",
    network: "anvil",
    description: "Demo dataset that shows a simple derived table built from eventTables(abi).",
    keywords: ["Anvil", "Derived", "Demo"],
    dependencies: {
      anvil: "_/anvil@0.0.1",
    },
    tables: {
      ...baseTables,
      // Basic transformation: combine both events into one table with a direction flag.
      counter_event_union: {
        sql: `
          SELECT block_num, timestamp, count AS value, 'increment' AS direction FROM incremented
          UNION ALL
          SELECT block_num, timestamp, count AS value, 'decrement' AS direction FROM decremented
        `,
      },
    },
  }
})
