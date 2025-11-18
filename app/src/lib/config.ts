import { anvil } from "viem/chains";
import { createConfig, webSocket } from "wagmi";

export const wagmiConfig = createConfig({
  chains: [anvil],
  transports: {
    [anvil.id]: webSocket("/rpc"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}