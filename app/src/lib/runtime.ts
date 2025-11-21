import { createConnectTransport } from "@connectrpc/connect-web";
import { createAuthInterceptor, createClient } from "@edgeandnode/amp";

const baseUrl = import.meta.env.VITE_AMP_QUERY_URL || "/amp";

const transport = createConnectTransport({
  baseUrl,
  /**
   * If present, adds your VITE_AMP_QUERY_TOKEN env var to the interceptor path.
   * This adds it to the connect-rpc transport layer and is passed to requests.
   * This is REQUIRED for querying published datasets through the gateway
   */
  interceptors: import.meta.env.VITE_AMP_QUERY_TOKEN
    ? [createAuthInterceptor(import.meta.env.VITE_AMP_QUERY_TOKEN)]
    : undefined,
});

export const ampClient = createClient(transport);

/**
 * Performs the given query with the AmpClient instance.
 * Waits for all batches to complete/resolve before returning.
 * @param query the query to run
 * @returns an array of the results from all resolved batches
 */
export async function performAmpQuery<T = any>(
  query: string
): Promise<Array<T>> {
  return await new Promise<Array<T>>(async (resolve) => {
    const data: Array<T> = [];

    for await (const batch of ampClient.query(query)) {
      data.push(...batch);
    }

    resolve(data);
  });
}

export const RPC_SOURCE =
  import.meta.env.VITE_AMP_RPC_DATASET || "_/anvil@0.0.1";
