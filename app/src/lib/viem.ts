import { createPublicClient, getContract, webSocket } from "viem";
import { anvil } from "viem/chains";
import BroadcastData from "../../../contracts/broadcast/DeployCounter.s.sol/31337/run-latest.json" with {type:"json"}
import { abi } from "./abi.ts";
import { parseDeployedContractAddress } from "./parseContractAddress.ts";

export const client = createPublicClient({
  chain: anvil,
  transport: webSocket("/rpc"),
});

export const address = parseDeployedContractAddress(BroadcastData)

export const counter = getContract({
  address,
  abi,
  client,
});
