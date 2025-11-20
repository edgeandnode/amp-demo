import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

export default defineDataset(() => ({
  name: "counter",
  network: process.env.VITE_AMP_NETWORK || "anvil",
  dependencies: {
    rpc: process.env.VITE_AMP_RPC_DATASET || "_/anvil@0.0.1",
  },
  tables: eventTables(abi, "rpc"),
}))
