import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

export default defineDataset(() => ({
  namespace: "eth_global", // replace this with a namespace of your choosing that will be a grouping of your datasets
  name: "counter",
  // readme: `
  // # eth_global/counter.
  //
  // provide additional, helpful details about your dataset, its purpose and usage.
  // `,
  // description: "High-level description of your dataset and its use-case/purpose",
  keywords: ["ETHGlobal"], // Add other keywords that help define/explain your dataset
  // sources: ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"],
  network: process.env.VITE_AMP_NETWORK || "anvil",
  dependencies: {
    rpc: process.env.VITE_AMP_RPC_DATASET || "_/anvil@0.0.1",
  },
  tables: eventTables(abi, "rpc"),
}))
