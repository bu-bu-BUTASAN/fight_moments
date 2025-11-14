/**
 * Walrus SDK のセットアップ
 */

import { WALRUS_RELAY_URL } from "../constants";

/**
 * Walrus の設定
 */
export const walrusConfig = {
  relayUrl: WALRUS_RELAY_URL,
  // リトライ設定
  maxRetries: 3,
  retryDelay: 1000, // 1秒
};
