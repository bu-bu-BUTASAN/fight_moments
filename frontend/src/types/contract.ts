/**
 * Fight Moments NFT コントラクトの型定義
 */

/**
 * Moment の種類（コントラクトでは String 型）
 */
export const MOMENT_TYPES = {
  KO: "KO",
  SUBMISSION: "SUBMISSION",
  DECISION: "DECISION",
  TKO: "TKO",
  DRAW: "DRAW",
  HIGHLIGHT: "HIGHLIGHT",
} as const;

export type MomentType = (typeof MOMENT_TYPES)[keyof typeof MOMENT_TYPES];

/**
 * Moment の種類を表示用文字列に変換
 */
export function momentTypeToString(type: string): string {
  return type;
}

/**
 * Mintable Moment オブジェクト
 */
export interface MintableMoment {
  id: string;
  matchId: string;
  fighterA: string;
  fighterB: string;
  momentType: string;
  videoWalrusUri: string;
  thumbnailWalrusUri: string;
  thumbnailBlobId: string;
  videoBlobId: string;
  walrusHash: string;
  maxSupply: number;
  mintedCount: number;
  isActive?: boolean;
  createdAt?: number;
}

/**
 * Fight Moment NFT オブジェクト
 */
export interface FightMomentNFT {
  id: string;
  momentId: string;
  matchId: string;
  fighterA: string;
  fighterB: string;
  momentType: string;
  videoUri: string;
  thumbnailUri: string;
  serialNumber: number;
  mintedAt: number;
  collectionId: string;
  creator: string;
}

/**
 * Kiosk Listing 情報
 */
export interface KioskListing {
  nftId: string;
  kioskId: string;
  price: number; // in MIST
  seller: string;
  nft: FightMomentNFT;
}

/**
 * Kiosk と KioskOwnerCap のペア情報
 */
export interface UserKiosk {
  kioskId: string;
  capId: string;
}

/**
 * Moment Registry のメタデータ
 * Contract の MomentMetadata 構造体に対応
 */
export interface MomentMetadata {
  moment_id: string;
  match_id: string;
  fighter_a: string;
  fighter_b: string;
  moment_type: string;
  video_blob_id: string;
  thumbnail_blob_id: string;
  max_supply: string;
  current_supply: string;
  creator: string;
  is_active: boolean;
}

/**
 * Moment Registry オブジェクト
 */
export interface MomentRegistry {
  id: { id: string };
  moments: {
    type: string;
    fields: {
      id: { id: string };
      size: string;
    };
  };
  moment_ids: string[];
}
