import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

export default defineDataset(() => ({
  name: "counter",
  network: "anvil",
  description: "Basic Amp dataset demo that builds tables from foundry events ontop of anvil",
  readme: `# Amp Demo

Basic Amp dataset demo that builds tables from foundry events ontop of anvil
`,
  keywords: ["Anvil", "Logs", "Transactions"],
  dependencies: {
    anvil: "_/anvil@0.0.1",
  },
  tables: eventTables(abi),
}))
