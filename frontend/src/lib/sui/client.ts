/**
 * Sui RPC client setup
 */

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SUI_NETWORK } from "../constants";

/**
 * Sui RPC client instance
 */
export const suiClient = new SuiClient({
  url: getFullnodeUrl(SUI_NETWORK as "testnet" | "devnet" | "mainnet"),
});
