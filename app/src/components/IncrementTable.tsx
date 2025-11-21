"use client";

import { useQuery } from "@tanstack/react-query";
import { performAmpQuery } from "../lib/runtime.ts";

type Increment = {
  block_num: string;
  timestamp: number;
  count: string;
};

export function IncrementTable() {
  const { data } = useQuery({
    queryKey: ["Amp", "Demo", { table: "increments" }] as const,
    async queryFn() {
      /**
       * This query hits your deployed dataset from running `pnpm amp dev`.
       * **Notice** the FROM clause structure:
       * - `eth_global` -> namespace. `_` is the default. if you set the namespace in the amp.config.ts, then use that namespace here
       * - `counter` -> name; set in the amp.config.ts
       * - `dev` -> revision. `dev` is the default. if when you run the register and deploy commands, if you set the tag, (0.0.1 for example); use that value
       * - `incremented` -> the table named derived from your contract abis
       * => the end result: "eth_global/conter@dev".incremented queries the incremented table on your dataset
       */
      return await performAmpQuery<Increment>(
        `SELECT block_num, timestamp, count FROM "eth_global/counter@dev".incremented ORDER BY block_num DESC`
      );
    },
  });

  return (
    <div className="mt-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">
            Increment Transactions
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
                {(data ?? []).map((increment) => (
                  <tr key={increment.timestamp}>
                    <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-0 dark:text-white">
                      {increment.block_num}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {increment.timestamp}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {increment.count}
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
