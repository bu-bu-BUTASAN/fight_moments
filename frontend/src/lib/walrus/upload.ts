/**
 * Walrus Upload Relay 経由のファイルアップロード
 */

import { WALRUS_AGGREGATOR_URL } from "@/lib/constants";
import type { WalrusUploadResult } from "@/types/walrus";
import { walrusConfig } from "./client";

/**
 * ファイルを Walrus にアップロードする
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

      // Walrus レスポンスの構造に合わせて URI を構築
      const blobId =
        result.newlyCreated?.blobObject?.blobId ||
        result.alreadyCertified?.blobId;

      if (!blobId) {
        throw new Error("Failed to get blob ID from Walrus response");
      }

      return {
        uri: `walrus://${blobId}`,
        blobId: blobId,
        hash: blobId, // Walrus では blobId がハッシュとして機能
      };
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      // リトライ前に待機
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error("Upload failed after all retries");
}

/**
 * Walrus URI から閲覧用 URL を生成
 */
export function getWalrusViewUrl(uri: string): string {
  // walrus://blob_id の形式から blob_id を抽出
  const blobId = uri.replace("walrus://", "");
  return `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;
}
