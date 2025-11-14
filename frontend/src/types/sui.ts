/**
 * Sui RPC レスポンスの型定義
 */

import type { SuiObjectResponse } from "@mysten/sui/client";

/**
 * Sui Object の汎用型
 */
export type { SuiObjectResponse };

/**
 * Kiosk Owner Cap の型
 */
export interface KioskOwnerCap {
  id: string;
  kiosk: string;
}
