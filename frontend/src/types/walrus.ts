/**
 * Type definitions for Walrus upload results
 */

export interface WalrusUploadResult {
  uri: string;
  blobId: string;
  hash: string;
}

export interface WalrusUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
