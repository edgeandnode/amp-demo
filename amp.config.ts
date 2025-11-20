import { defineDataset, eventTables } from "@edgeandnode/amp";
// @ts-ignore
import { abi } from "./app/src/lib/abi.ts";

export default defineDataset(() => {
  const baseTables = eventTables(abi, "rpc");

  return {
    name: "counter",
    network: process.env.VITE_AMP_NETWORK || "anvil",
    dependencies: {
      rpc: process.env.VITE_AMP_RPC_DATASET || "_/anvil@0.0.1",
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
          FROM rpc.blocks
          WHERE gas_used > 0
        `,
      },
    },
    namespace: "amp_demo",
    description: "Counter dataset with raw tables and a derived table",
  };
});