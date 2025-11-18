import { createConnectTransport } from "@connectrpc/connect-web"
import { ArrowFlight } from "@edgeandnode/amp"
import { ManagedRuntime } from "effect"

const transport = createConnectTransport({ baseUrl: "/amp" })
const layer = ArrowFlight.layer(transport)

export const runtime = ManagedRuntime.make(layer)
