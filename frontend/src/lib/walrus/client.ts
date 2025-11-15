/**
 * Walrus SDK setup
 */

import { WALRUS_RELAY_URL } from "../constants";

/**
 * Walrus configuration
 */
export const walrusConfig = {
  relayUrl: WALRUS_RELAY_URL,
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};
