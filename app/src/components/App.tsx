"use client";

import { useQueryClient } from "@tanstack/react-query";
import { privateKeyToAccount } from "viem/accounts";
import { useWriteContract } from "wagmi";
import { abi } from "../lib/abi.ts";
import { wagmiConfig } from "../lib/config.ts";
import { address as contractAddress } from "../lib/viem.ts";
import { DecrementTable } from "./DecrementTable.tsx";
import { IncrementTable } from "./IncrementTable.tsx";
import { LogsTable } from "./LogsTable.tsx";
import { TransactionsTable } from "./TransactionsTable.tsx";

/**
 * This is one of the private keys created by anvil and is available to perform transactions for.
 * Any of the private keys can be used.
 */
const account = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);
const address = account.address;

export function App() {
  return (
    <div className="min-h-full">
      <div className="border-b border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex shrink-0 items-center">Amp Demo</div>
            </div>
            <div className="w-fit flex items-center">
              {`${address.substring(0, 6)}...${address.substring(
                address.length - 6,
                address.length
              )}`}
            </div>
          </div>
        </div>
      </div>
      <main className="w-full flex flex-col gap-y-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <p className="w-full text-sm">
          Increment and decrement the counter using the buttons. See the anvil
          transactions and logs queried using Amp!
        </p>
        <div className="flex items-center gap-x-2">
          <IncrementCTA />
          <DecrementCTA />
        </div>
        <div className="w-full grid grid-cols-2 gap-x-2">
          <IncrementTable />
          <DecrementTable />
        </div>
        <LogsTable />
        <TransactionsTable />
      </main>
    </div>
  );
}

function IncrementCTA() {
  const queryClient = useQueryClient();
  const { writeContract, status } = useWriteContract({
    config: wagmiConfig,
  });

  return (
    <button
      type="button"
      className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500 cursor-pointer  disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
      disabled={status === "pending"}
      onClick={() =>
        writeContract(
          {
            abi,
            address: contractAddress,
            functionName: "increment",
            account,
          },
          {
            onSuccess() {
              // clear the increment query key on event to refresh the data
              setTimeout(() => {
                void queryClient.refetchQueries({
                  queryKey: ["Amp", "Demo", { table: "increments" }] as const,
                });
              }, 1_000);
            },
          }
        )
      }
    >
      Increment
    </button>
  );
}

function DecrementCTA() {
  const queryClient = useQueryClient();
  const { writeContract, status } = useWriteContract({
    config: wagmiConfig,
  });

  return (
    <button
      type="button"
      className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 shadow-xs hover:bg-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-400 dark:shadow-none dark:hover:bg-indigo-500/30 cursor-pointer disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
      disabled={status === "pending"}
      onClick={() =>
        writeContract(
          {
            abi,
            address: contractAddress,
            functionName: "decrement",
            account,
          },
          {
            onSuccess() {
              // clear the increment query key on event to refresh the data
              setTimeout(() => {
                void queryClient.refetchQueries({
                  queryKey: ["Amp", "Demo", { table: "decrements" }] as const,
                });
              }, 1_000);
            },
          }
        )
      }
    >
      Decrement
    </button>
  );
}
