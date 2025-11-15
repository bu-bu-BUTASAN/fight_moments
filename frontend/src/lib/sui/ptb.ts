/**
 * Programmable Transaction Block (PTB) ビルダーユーティリティ
 */

import { Transaction } from "@mysten/sui/transactions";
import { CLOCK_ID, PACKAGE_ID, TRANSFER_POLICY_ID } from "../constants";

/**
 * Moment 登録用の PTB を構築
 */
export function buildRegisterMomentTx(params: {
  adminCapId: string;
  matchId: string;
  fighterA: string;
  fighterB: string;
  momentType: string;
  videoWalrusUri: string;
  thumbnailWalrusUri: string;
  blobId: string;
  videoBlobId: string;
  thumbnailBlobId: string;
  contentHash: string;
  maxSupply: number;
}) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::admin::register_moment`,
    arguments: [
      tx.object(params.adminCapId),
      tx.pure.string(params.matchId),
      tx.pure.string(params.fighterA),
      tx.pure.string(params.fighterB),
      tx.pure.string(params.momentType),
      tx.pure.string(params.videoWalrusUri),
      tx.pure.string(params.thumbnailWalrusUri),
      tx.pure.string(params.blobId),
      tx.pure.string(params.videoBlobId),
      tx.pure.string(params.thumbnailBlobId),
      tx.pure.string(params.contentHash),
      tx.pure.u64(params.maxSupply),
    ],
  });

  return tx;
}

/**
 * 初めてのユーザー向け: Kiosk作成 + Mint の PTB を構築
 */
export function buildCreateKioskAndMintTx(params: { momentId: string }) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::accessor::create_kiosk_and_mint`,
    arguments: [
      tx.object(params.momentId), // moment: &mut MintableMoment
      tx.object(TRANSFER_POLICY_ID), // policy: &TransferPolicy<FightMomentNFT>
      tx.object(CLOCK_ID), // clock: &Clock
    ],
  });

  return tx;
}

/**
 * 既存Kiosk所有者向け: Mint & Lock の PTB を構築
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
 * Kiosk 内の NFT を出品する PTB を構築
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
 * Kiosk から NFT の出品を取り消す PTB を構築
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
 * Kiosk から NFT を購入して自分の Kiosk にロックする PTB を構築
 * (既存 Kiosk 所有者向け)
 */
export function buildPurchaseAndLockTx(params: {
  sellerKioskId: string;
  buyerKioskId: string;
  buyerKioskCapId: string;
  nftId: string;
  price: number; // in MIST
}) {
  const tx = new Transaction();

  // 支払い用の SUI コインを分割
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(params.price)]);

  // 販売者の Kiosk から購入
  const [nft, transferRequest] = tx.moveCall({
    target: "0x2::kiosk::purchase",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      tx.object(params.sellerKioskId), // seller_kiosk: &mut Kiosk
      tx.pure.id(params.nftId), // item_id: ID
      paymentCoin, // payment: Coin<SUI&gt;
    ],
  });

  // 購入者の Kiosk にロック
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

  // TransferRequest を確認
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
 * Kiosk から NFT を購入して新規 Kiosk を作成してロックする PTB を構築
 * (初めてのユーザー向け)
 */
export function buildPurchaseAndLockToNewKioskTx(params: {
  sellerKioskId: string;
  nftId: string;
  price: number; // in MIST
  buyerAddress: string;
}) {
  const tx = new Transaction();

  // 支払い用の SUI コインを分割
  const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(params.price)]);

  // 販売者の Kiosk から購入
  const [nft, transferRequest] = tx.moveCall({
    target: "0x2::kiosk::purchase",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      tx.object(params.sellerKioskId), // seller_kiosk: &mut Kiosk
      tx.pure.id(params.nftId), // item_id: ID
      paymentCoin, // payment: Coin<SUI&gt;
    ],
  });

  // 新規 Kiosk を作成
  const [kiosk, kioskCap] = tx.moveCall({
    target: "0x2::kiosk::new",
    arguments: [],
  });

  // 新規 Kiosk にロック
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

  // TransferRequest を確認
  tx.moveCall({
    target: "0x2::transfer_policy::confirm_request",
    typeArguments: [`${PACKAGE_ID}::types::FightMomentNFT`],
    arguments: [
      tx.object(TRANSFER_POLICY_ID), // policy: &TransferPolicy<T&gt;
      transferRequest, // request: TransferRequest<T&gt;
    ],
  });

  // Kiosk を共有オブジェクトとして公開
  tx.moveCall({
    target: "0x2::transfer::public_share_object",
    typeArguments: ["0x2::kiosk::Kiosk"],
    arguments: [kiosk],
  });

  // KioskOwnerCap を送信者に転送
  tx.transferObjects([kioskCap], tx.pure.address(params.buyerAddress));

  return tx;
}
