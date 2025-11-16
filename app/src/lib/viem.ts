import { createPublicClient, getContract, webSocket } from "viem"
import { anvil } from "viem/chains"
import { abi } from "./abi"

export const client = createPublicClient({
  chain: anvil,
  transport: webSocket("/rpc"),
})

export const counter = getContract({
  address: "0x6F6B8249aC2D544cb3d5CB21fFfD582F8c7e9FE5",
  abi,
  client,
})
