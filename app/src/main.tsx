import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import { anvil } from "viem/chains";
import { createConfig, WagmiProvider, webSocket } from "wagmi";

const wagmiConfig = createConfig({
  chains: [anvil],
  transports: {
    [anvil.id]: webSocket("/rpc"),
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <WagmiProvider config={wagmiConfig}>
        <App />
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>,
);
