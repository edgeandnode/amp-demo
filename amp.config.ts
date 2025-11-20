import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

export default defineDataset(() => ({
  // Required fields
  name: "counter",
  network: process.env.VITE_AMP_NETWORK || "anvil",
  dependencies: {
    rpc: process.env.VITE_AMP_RPC_DATASET || "_/anvil@0.0.1",
  },
  tables: eventTables(abi, "rpc"),
  // Optional fields (namespace required for publishing)
  namespace: "amp_demo",
  description: "Basic Amp dataset demo that builds tables from foundry events ontop of anvil",
  readme: `# Amp Demo

Basic Amp dataset demo that builds tables from foundry events ontop of anvil
`,
  keywords: ["Logs", "Transactions"],
}))
