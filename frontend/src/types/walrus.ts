/**
 * Walrus アップロード結果の型定義
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
