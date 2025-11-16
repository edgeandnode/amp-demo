import { defineDataset, eventTables } from "@edgeandnode/amp"
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts"

export default defineDataset(() => ({
  name: "counter",
  network: "anvil",
  dependencies: {
    anvil: "_/anvil@0.0.1",
  },
  tables: eventTables(abi),
}))
