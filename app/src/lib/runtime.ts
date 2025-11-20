import { Interceptor } from "@connectrpc/connect"
import { createConnectTransport } from "@connectrpc/connect-web"
import { ArrowFlight } from "@edgeandnode/amp"
import { ManagedRuntime } from "effect"

const baseUrl = import.meta.env.VITE_AMP_QUERY_URL || "/amp"

/**
 * If present, adds your VITE_AMP_QUERY_TOKEN env var to the interceptor path.
 * This adds it to the connect-rpc transport layer and is passed to requests.
 * This is REQUIRED for querying published datasets through the gateway
 */
const authInterceptor: Interceptor = (next) => async (req) => {
  const token = import.meta.env.VITE_AMP_QUERY_TOKEN
  if (token) {
    req.header.append("Authorization", `Bearer ${token}`)
  }
  return await next(req)
}

const transport = createConnectTransport({ baseUrl, interceptors: [authInterceptor] })
const layer = ArrowFlight.layer(transport)

export const runtime = ManagedRuntime.make(layer)

export const RPC_SOURCE = import.meta.env.VITE_AMP_RPC_DATASET || "_/anvil@0.0.1"