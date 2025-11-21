"use client";

import { useState, useEffect } from "react";
import { ampClient, RPC_SOURCE } from "../lib/runtime.ts";

type Log = {
  block_num: string;
  block_hash: string;
  address: string;
  timestamp: number;
  tx_hash: string;
};

export function LogsTable() {
  const [logs, setLogs] = useState<Array<Log>>([]);

  useEffect(() => {
    const abortController = new AbortController();

    const run = async () => {
      for await (const batch of ampClient.stream(
        `SELECT block_num, block_hash, address, timestamp, tx_hash FROM "${RPC_SOURCE}".logs`
      )) {
        setLogs((current) => [...current, ...batch]);
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
            All Logs
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
                    Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {logs.map((log) => (
                  <tr key={log.timestamp}>
                    <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-0 dark:text-white">
                      {log.block_num}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {log.timestamp}
                    </td>
                    <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {`0x${log.address}`}
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
