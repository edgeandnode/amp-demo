"use client";

import { ArrowFlight } from "@edgeandnode/amp";
import { Table } from "apache-arrow";
import { Effect, Schema, Stream } from "effect";
import { useState, useEffect } from "react";
import { runtime } from "../lib/runtime.ts";

const TransactionSchema = Schema.Struct({
  block_num: Schema.BigInt,
  block_hash: Schema.Uint8ArrayFromHex,
  timestamp: Schema.NonNegativeInt,
  tx_hash: Schema.Uint8ArrayFromHex,
  nonce: Schema.BigInt,
  to: Schema.Uint8ArrayFromHex,
  from: Schema.Uint8ArrayFromHex,
});
type TransactionSchema = typeof TransactionSchema.Type;

const TransactionsQueryLive = Effect.gen(function* () {
  const arrow = yield* ArrowFlight.ArrowFlight;
  const query = `SELECT block_num, block_hash, timestamp, tx_hash, nonce, "to", "from" FROM anvil.transactions`;
  const queryTemplate: TemplateStringsArray = Object.assign([query], {
    raw: [query],
  });

  return arrow.stream(queryTemplate).pipe(Stream.toAsyncIterable);
});

export function TransactionsTable() {
  const [transactions, setTransactions] = useState<Array<TransactionSchema>>(
    []
  );

  useEffect(() => {
    const abortController = new AbortController();

    const run = async () => {
      const iterator = await runtime.runPromise(TransactionsQueryLive, {
        signal: abortController.signal,
      });

      for await (const item of iterator) {
        const table = new Table(item.data);
        const decoded = [...table].map((item) => TransactionSchema.make(item));
        setTransactions((current) => [...current, ...decoded]);
      }

      return () => abortController.abort();
    };

    run();
  }, []);

  return (
    <div className="mt-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">
            All Transactions
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
                    Nonce
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    To
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    From
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {transactions
                  .map((log) => Schema.encodeSync(TransactionSchema)(log))
                  .map((log) => (
                    <tr key={log.nonce}>
                      <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-0 dark:text-white">
                        {log.block_num}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {log.timestamp}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {log.nonce}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {`0x${log.to}`}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {`0x${log.from}`}
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
