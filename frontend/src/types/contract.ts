/**
 * Type definitions for Fight Moments NFT contract
 */

/**
 * Moment types (String type in contract)
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
 * Convert moment type to display string
 */
export function momentTypeToString(type: string): string {
  return type;
}

/**
 * Mintable Moment object
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
 * Fight Moment NFT object
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
 * Kiosk listing information
 */
export interface KioskListing {
  nftId: string;
  kioskId: string;
  price: number; // in MIST
  seller: string;
  nft: FightMomentNFT;
}

/**
 * Pair information for Kiosk and KioskOwnerCap
 */
export interface UserKiosk {
  kioskId: string;
  capId: string;
}

/**
 * Moment Registry metadata
 * Corresponds to MomentMetadata struct in Contract
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
 * Moment Registry object
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
