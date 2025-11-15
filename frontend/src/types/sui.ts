/**
 * Type definitions for Sui RPC responses
 */

import type { SuiObjectResponse } from "@mysten/sui/client";

/**
 * Generic type for Sui Objects
 */
export type { SuiObjectResponse };

/**
 * Type for Kiosk Owner Cap
 */
export interface KioskOwnerCap {
  id: string;
  kiosk: string;
}
