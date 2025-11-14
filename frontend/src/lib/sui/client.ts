/**
 * Sui RPC クライアントのセットアップ
 */

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SUI_NETWORK } from "../constants";

/**
 * Sui RPC クライアントのインスタンス
 */
export const suiClient = new SuiClient({
  url: getFullnodeUrl(SUI_NETWORK as "testnet" | "devnet" | "mainnet"),
});
