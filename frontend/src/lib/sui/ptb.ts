/**
 * Programmable Transaction Block (PTB) builder utilities
 */

import { Transaction } from "@mysten/sui/transactions";
import {
  CLOCK_ID,
  MOMENT_REGISTRY_ID,
  PACKAGE_ID,
  TRANSFER_POLICY_ID,
} from "../constants";

/**
 * Build PTB for Moment registration
 */
export function buildRegisterMomentTx(params: {
  adminCapId: string;
  matchId: string;
  fighterA: string;
  fighterB: string;
  momentType: string;
  videoBlobId: string;
  thumbnailBlobId: string;
  contentHash: string;
  maxSupply: number;
}) {
  const tx = new Transaction();

  // Generate Walrus URIs
  const videoUri = `walrus://${params.videoBlobId}`;
  const thumbnailUri = `walrus://${params.thumbnailBlobId}`;
  const blobId = params.videoBlobId; // Use video as main blob ID

  tx.moveCall({
    target: `${PACKAGE_ID}::admin::register_moment`,
    arguments: [
      tx.object(MOMENT_REGISTRY_ID), // moment_registry: &mut MomentRegistry
      tx.object(params.adminCapId), // admin_cap: &AdminCap
      tx.pure.string(params.matchId), // match_id: String
      tx.pure.string(params.fighterA), // fighter_a: String
      tx.pure.string(params.fighterB), // fighter_b: String
      tx.pure.string(params.momentType), // moment_type: String
      tx.pure.string(videoUri), // video_uri: String
      tx.pure.string(thumbnailUri), // thumbnail_uri: String
      tx.pure.string(blobId), // blob_id: String
      tx.pure.string(params.videoBlobId), // video_blob_id: String
      tx.pure.string(params.thumbnailBlobId), // thumbnail_blob_id: String
      tx.pure.string(params.contentHash), // content_hash: String
      tx.pure.u64(params.maxSupply), // max_supply: u64
    ],
  });

  return tx;
}

/**
 * Build PTB for first-time users: Create Kiosk + Mint
 */
export function buildCreateKioskAndMintTx(params: { momentId: string }) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::accessor::create_kiosk_and_mint`,
    arguments: [
      tx.object(MOMENT_REGISTRY_ID), // moment_registry: &mut MomentRegistry
      tx.object(params.momentId), // moment: &mut MintableMoment
      tx.object(TRANSFER_POLICY_ID), // policy: &TransferPolicy<FightMomentNFT>
      tx.object(CLOCK_ID), // clock: &Clock
    ],
  });

  return tx;
}

/**
 * Build PTB for existing Kiosk owners: Mint & Lock
 */
export function buildMintAndLockTx(params: {
  momentId: string;
  kioskId: string;
  kioskCapId: string;
}) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::accessor::mint_and_lock`,
    arguments: [
      tx.object(MOMENT_REGISTRY_ID), // moment_registry: &mut MomentRegistry
      tx.object(params.momentId), // moment: &mut MintableMoment
      tx.object(params.kioskId), // kiosk: &mut Kiosk
      tx.object(params.kioskCapId), // kiosk_cap: &KioskOwnerCap
      tx.object(TRANSFER_POLICY_ID), // policy: &TransferPolicy<FightMomentNFT>
      tx.object(CLOCK_ID), // clock: &Clock
    ],
  });

  return tx;
}

/**
 * Build PTB for listing NFT in Kiosk
 */
export function buildListNFTTx(params: {
  kioskId: string;
  kioskCapId: string;
  nftId: string;
  price: number; // in MIST
}) {
  const tx = new Transaction();

  tx.moveCall({
    target: "0x2::kiosk::list",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      tx.object(params.kioskId), // kiosk: &mut Kiosk
      tx.object(params.kioskCapId), // cap: &KioskOwnerCap
      tx.pure.id(params.nftId), // item_id: ID
      tx.pure.u64(params.price), // price: u64
    ],
  });

  return tx;
}

/**
 * Build PTB for delisting NFT from Kiosk
 */
export function buildDelistNFTTx(params: {
  kioskId: string;
  kioskCapId: string;
  nftId: string;
}) {
  const tx = new Transaction();

  tx.moveCall({
    target: "0x2::kiosk::delist",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      tx.object(params.kioskId), // kiosk: &mut Kiosk
      tx.object(params.kioskCapId), // cap: &KioskOwnerCap
      tx.pure.id(params.nftId), // item_id: ID
    ],
  });

  return tx;
}

/**
 * Build PTB for purchasing NFT from Kiosk and locking to own Kiosk
 * (For existing Kiosk owners)
 */
export function buildPurchaseAndLockTx(params: {
  sellerKioskId: string;
  buyerKioskId: string;
  buyerKioskCapId: string;
  nftId: string;
  price: number; // in MIST
}) {
  const tx = new Transaction();

  // Split SUI coin for payment
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(params.price)]);

  // Purchase from seller's Kiosk
  const [nft, transferRequest] = tx.moveCall({
    target: "0x2::kiosk::purchase",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      tx.object(params.sellerKioskId), // seller_kiosk: &mut Kiosk
      tx.pure.id(params.nftId), // item_id: ID
      paymentCoin, // payment: Coin<SUI&gt;
    ],
  });

  // Lock to buyer's Kiosk
  tx.moveCall({
    target: "0x2::kiosk::lock",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      tx.object(params.buyerKioskId), // kiosk: &mut Kiosk
      tx.object(params.buyerKioskCapId), // cap: &KioskOwnerCap
      tx.object(TRANSFER_POLICY_ID), // policy: &TransferPolicy<T&gt;
      nft, // item: T
    ],
  });

  // Confirm TransferRequest
  tx.moveCall({
    target: "0x2::transfer_policy::confirm_request",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      tx.object(TRANSFER_POLICY_ID), // policy: &TransferPolicy<T&gt;
      transferRequest, // request: TransferRequest<T&gt;
    ],
  });

  return tx;
}

/**
 * Build PTB for purchasing NFT from Kiosk and locking to new Kiosk
 * (For first-time users)
 */
export function buildPurchaseAndLockToNewKioskTx(params: {
  sellerKioskId: string;
  nftId: string;
  price: number; // in MIST
  buyerAddress: string;
}) {
  const tx = new Transaction();

  // Split SUI coin for payment
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(params.price)]);

  // Purchase from seller's Kiosk
  const [nft, transferRequest] = tx.moveCall({
    target: "0x2::kiosk::purchase",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      tx.object(params.sellerKioskId), // seller_kiosk: &mut Kiosk
      tx.pure.id(params.nftId), // item_id: ID
      paymentCoin, // payment: Coin<SUI&gt;
    ],
  });

  // Create new Kiosk
  const [kiosk, kioskCap] = tx.moveCall({
    target: "0x2::kiosk::new",
    arguments: [],
  });

  // Lock to new Kiosk
  tx.moveCall({
    target: "0x2::kiosk::lock",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      kiosk, // kiosk: &mut Kiosk
      kioskCap, // cap: &KioskOwnerCap
      tx.object(TRANSFER_POLICY_ID), // policy: &TransferPolicy<T&gt;
      nft, // item: T
    ],
  });

  // Confirm TransferRequest
  tx.moveCall({
    target: "0x2::transfer_policy::confirm_request",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      tx.object(TRANSFER_POLICY_ID), // policy: &TransferPolicy<T&gt;
      transferRequest, // request: TransferRequest<T&gt;
    ],
  });

  // Publish Kiosk as shared object
  tx.moveCall({
    target: "0x2::transfer::public_share_object",
    typeArguments: ["0x2::kiosk::Kiosk"],
    arguments: [kiosk],
  });

  // Transfer KioskOwnerCap to sender
  tx.transferObjects([kioskCap], tx.pure.address(params.buyerAddress));

  return tx;
}
