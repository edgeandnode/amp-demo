import { createConnectTransport } from "@connectrpc/connect-web"
import { ArrowFlight } from "@edgeandnode/amp"

const transport = createConnectTransport({ baseUrl: "/amp" }) as any
export const layer = ArrowFlight.layer(transport)
