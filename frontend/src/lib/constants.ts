/**
 * アプリケーション全体で使用する定数
 */

// Sui Network Configuration
export const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
export const SUI_RPC_URL =
  process.env.NEXT_PUBLIC_SUI_RPC_URL || "https://fullnode.testnet.sui.io:443";

// Sui Contract Configuration
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "";
export const TRANSFER_POLICY_ID =
  process.env.NEXT_PUBLIC_TRANSFER_POLICY_ID || "";
export const ADMIN_CAP_ID = process.env.NEXT_PUBLIC_ADMIN_CAP_ID || "";
export const TRANSFER_POLICY_CAP_ID =
  process.env.NEXT_PUBLIC_TRANSFER_POLICY_CAP_ID || "";
export const COLLECTION_ID =
  process.env.NEXT_PUBLIC_COLLECTION_ID || "fight-moments-v1";

// Sui System Objects
export const CLOCK_ID = "0x6"; // Shared Clock object

// Walrus Configuration
export const WALRUS_RELAY_URL =
  process.env.NEXT_PUBLIC_WALRUS_RELAY_URL ||
  "https://publisher.walrus-testnet.walrus.space";

// Video Constraints
export const MAX_VIDEO_DURATION_SECONDS = 30;

// MIST to SUI conversion
export const MIST_PER_SUI = 1_000_000_000;

/**
 * MIST を SUI に変換
 */
export function mistToSui(mist: number): number {
  return mist / MIST_PER_SUI;
}

/**
 * SUI を MIST に変換
 */
export function suiToMist(sui: number): number {
  return Math.floor(sui * MIST_PER_SUI);
}

/**
 * Suiscan Explorer の URL を生成
 */
export function getSuiscanUrl(digest: string): string {
  const network = SUI_NETWORK === "mainnet" ? "mainnet" : "testnet";
  return `https://suiscan.xyz/${network}/tx/${digest}`;
}
