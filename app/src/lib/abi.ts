import { Abi } from "viem"
import CounterAbi from "../../../contracts/out/Counter.sol/Counter.json" with {type:"json"}

export const abi = CounterAbi.abi as Abi
