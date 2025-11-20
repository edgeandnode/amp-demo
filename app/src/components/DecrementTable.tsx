"use client";

import { ArrowFlight } from "@edgeandnode/amp";
import { useQuery } from "@tanstack/react-query";
import { Table } from "apache-arrow";
import { Chunk, Effect, Schema, Stream } from "effect";
import { runtime } from "../lib/runtime.ts";

const DecrementSchema = Schema.Struct({
  block_num: Schema.BigInt,
  timestamp: Schema.NonNegativeInt,
  count: Schema.String,
});
type DecrementSchema = typeof DecrementSchema.Type;

const DecrementQueryLive = Effect.gen(function* () {
  const arrow = yield* ArrowFlight.ArrowFlight;
  /**
   * This query hits your deployed dataset from running `pnpm amp dev`.
   * **Notice** the FROM clause structure:
   * - `amp_demo` -> namespace. `_` is the default. if you set the namespace in the amp.config.ts, then use that namespace here
   * - `counter` -> name; set in the amp.config.ts
   * - `dev` -> revision. `dev` is the default. if when you run the register and deploy commands, if you set the tag, (0.0.1 for example); use that value
   * - `decremented` -> the table named derived from your contract abis
   * => the end result: "amp_demo/conter@dev".decremented queries the decremented table on your dataset
   */
  const query = `SELECT block_num, timestamp, count FROM "amp_demo/counter@dev".decremented ORDER BY block_num DESC`;
  const queryTemplate: TemplateStringsArray = Object.assign([query], {
    raw: [query],
  });

  return yield* arrow.query(queryTemplate).pipe(Stream.runCollect);
});

export function DecrementTable() {
  const { data } = useQuery({
    queryKey: ["Amp", "Demo", { table: "decrements" }] as const,
    async queryFn() {
      const batch = Chunk.toArray(await runtime.runPromise(DecrementQueryLive));
      const table = new Table(batch);
      return [...table].map((row) => DecrementSchema.make(row));
    },
  });

  return (
    <div className="mt-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">
            Decrement Transactions
          </h1>
        </div>
      </div>
      <div className="mt-3 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="relative min-w-full divide-y divide-gray-300 dark:divide-white/15">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0 dark:text-white"
                  >
                    Block #
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Timestamp
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {(data ?? [])
                  .map((decrement) =>
                    Schema.encodeSync(DecrementSchema)(decrement)
                  )
                  .map((decrement) => (
                    <tr key={decrement.timestamp}>
                      <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-0 dark:text-white">
                        {decrement.block_num}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {decrement.timestamp}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {decrement.count}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
