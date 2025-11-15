/**
 * File upload via Walrus Upload Relay
 */

import { WALRUS_AGGREGATOR_URL } from "@/lib/constants";
import type { WalrusUploadResult } from "@/types/walrus";
import { walrusConfig } from "./client";

/**
 * Upload file to Walrus
 */
export async function uploadToWalrus(
  file: File,
  _onProgress?: (percentage: number) => void,
): Promise<WalrusUploadResult> {
  const { relayUrl, maxRetries, retryDelay } = walrusConfig;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${relayUrl}/v1/blobs`, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Walrus upload failed:\nStatus: ${response.status}\nURL: ${response.url}\nResponse: ${errorBody}`,
        );
        throw new Error(
          `Walrus upload failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      // Build URI according to Walrus response structure
      const blobId =
        result.newlyCreated?.blobObject?.blobId ||
        result.alreadyCertified?.blobId;

      if (!blobId) {
        throw new Error("Failed to get blob ID from Walrus response");
      }

      return {
        uri: `walrus://${blobId}`,
        blobId: blobId,
        hash: blobId, // In Walrus, blobId functions as hash
      };
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error("Upload failed after all retries");
}

/**
 * Generate view URL from Walrus URI
 */
export function getWalrusViewUrl(uri: string): string {
  // Extract blob_id from walrus://blob_id format
  const blobId = uri.replace("walrus://", "");
  return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
}
