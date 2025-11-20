import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

export default defineDataset(() => ({
  namespace: "amp_demo", // Replace this value with a logical namepsace for you/your organization before publishing
  name: "counter",
  network: process.env.VITE_AMP_NETWORK || "anvil",
  description: "Basic Amp dataset demo that builds tables from foundry events ontop of anvil",
  readme: `# Amp Demo

Basic Amp dataset demo that builds tables from foundry events ontop of anvil
`,
  keywords: ["Logs", "Transactions"],
  dependencies: {
    rpc: process.env.VITE_AMP_RPC_DATASET || "_/anvil@0.0.1",
  },
  tables: eventTables(abi, "rpc"),
}))
