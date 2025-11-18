import { type Address, getAddress } from "viem";

interface Transaction {
  hash: string;
  transactionType: string;
  contractName: string;
  contractAddress: string;
  additionalContracts?: Array<AdditionalContract>;
}

interface AdditionalContract {
  transactionType: string;
  address: string;
  initCode: string;
}

interface BroadcastFile {
  transactions: Array<Transaction>;
  receipts: Array<any>;
  libraries: Array<any>;
  pending: Array<any>;
  returns: any;
  timestamp: number;
  chain: number;
  commit: string;
}

const DEFAULT_CONTRACT_ADDRESS: Address =
  "0x6f6b8249ac2d544cb3d5cb21fffd582f8c7e9fe5";

/**
 * Parses a Foundry broadcast file to extract the deployed contract address.
 * Looks for a CALL transaction with a CREATE additional contract.
 *
 * @param broadcastData - The parsed JSON data from the broadcast file
 * @returns The deployed contract address or default address if not found
 */
export function parseDeployedContractAddress(
  broadcastData: BroadcastFile
): Address {
  // Find the CALL transaction
  const callTransaction = broadcastData.transactions.find(
    (tx) => tx.transactionType === "CALL"
  );

  if (!callTransaction || !callTransaction.additionalContracts) {
    return DEFAULT_CONTRACT_ADDRESS;
  }

  // Find the CREATE additional contract
  const createContract = callTransaction.additionalContracts.find(
    (contract) => contract.transactionType === "CREATE"
  );

  return getAddress(createContract?.address || DEFAULT_CONTRACT_ADDRESS);
}

/**
 * Reads and parses a Foundry broadcast file to extract the deployed contract address.
 *
 * @param filePath - Path to the broadcast JSON file
 * @returns The deployed contract address or default address if not found
 */
export async function parseDeployedContractAddressFromFile(
  filePath: string
): Promise<Address> {
  const fs = await import("fs/promises");
  const fileContent = await fs.readFile(filePath, "utf-8");
  const broadcastData: BroadcastFile = JSON.parse(fileContent);
  return parseDeployedContractAddress(broadcastData);
}

// Example usage:
// const address = await parseDeployedContractAddressFromFile(
//   "contracts/broadcast/DeployCounter.s.sol/31337/run-latest.json"
// );
// console.log("Deployed contract address:", address);
