/**
 * Sui RPC クエリ関数
 */

import { Transaction } from "@mysten/sui/transactions";
import type {
  FightMomentNFT,
  KioskListing,
  MintableMoment,
  MomentMetadata,
  UserKiosk,
} from "@/types/contract";
import { MOMENT_REGISTRY_ID, PACKAGE_ID } from "../constants";
import { suiClient } from "./client";

/**
 * すべての MintableMoment オブジェクトを取得
 * MintableMoment は共有オブジェクトなので、イベントから取得する
 */
export async function fetchMintableMoments(): Promise<MintableMoment[]> {
  try {
    // MomentRegistered イベントを取得して、Moment ID を収集
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::types::MomentRegistered`,
      },
      limit: 50, // 最新50件
    });

    const momentIds = events.data.map((event) => {
      const parsedJson = event.parsedJson as Record<string, unknown>;
      return parsedJson.moment_id as string;
    });

    if (momentIds.length === 0) {
      return [];
    }

    // 各 Moment オブジェクトを取得
    const objects = await suiClient.multiGetObjects({
      ids: momentIds,
      options: {
        showContent: true,
        showType: true,
      },
    });

    const moments: MintableMoment[] = [];

    for (const obj of objects) {
      if (obj.data?.content?.dataType === "moveObject") {
        const fields = obj.data.content.fields as Record<string, unknown>;
        const media = fields.media as Record<string, unknown>;

        moments.push({
          id: obj.data.objectId,
          matchId: fields.match_id as string,
          fighterA: fields.fighter_a as string,
          fighterB: fields.fighter_b as string,
          momentType: fields.moment_type as string,
          videoWalrusUri: (media.video_uri as string) || "",
          thumbnailWalrusUri: (media.thumbnail_uri as string) || "",
          thumbnailBlobId: (media.thumbnail_blob_id as string) || "",
          videoBlobId: (media.video_blob_id as string) || "",
          walrusHash: (media.content_hash as string) || "",
          maxSupply: Number(fields.max_supply),
          mintedCount: Number(fields.current_supply || 0),
          isActive: fields.is_active as boolean,
        });
      }
    }

    return moments;
  } catch (error) {
    console.error("Failed to fetch mintable moments:", error);
    throw error;
  }
}

/**
 * 特定の MintableMoment を ID で取得
 */
export async function fetchMintableMoment(
  momentId: string,
): Promise<MintableMoment | null> {
  try {
    const response = await suiClient.getObject({
      id: momentId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    if (
      !response.data ||
      !response.data.content ||
      response.data.content.dataType !== "moveObject"
    ) {
      return null;
    }

    const fields = response.data.content.fields as Record<string, unknown>;

    const media = fields.media as Record<string, unknown>;

    return {
      id: response.data.objectId,
      matchId: fields.match_id as string,
      fighterA: fields.fighter_a as string,
      fighterB: fields.fighter_b as string,
      momentType: fields.moment_type as string,
      videoWalrusUri: (media.video_uri as string) || "",
      thumbnailWalrusUri: (media.thumbnail_uri as string) || "",
      thumbnailBlobId: (media.thumbnail_blob_id as string) || "",
      videoBlobId: (media.video_blob_id as string) || "",
      walrusHash: (media.content_hash as string) || "",
      maxSupply: Number(fields.max_supply),
      mintedCount: Number(fields.current_supply || 0),
      isActive: fields.is_active as boolean,
    };
  } catch (error) {
    console.error("Failed to fetch mintable moment:", error);
    throw error;
  }
}

/**
 * ユーザーが所有する Kiosk を取得
 */
export async function fetchUserKiosks(userAddress: string): Promise<string[]> {
  try {
    // KioskOwnerCap を検索
    const response = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: "0x2::kiosk::KioskOwnerCap",
      },
      options: {
        showContent: true,
      },
    });

    const kioskIds: string[] = [];

    for (const obj of response.data) {
      if (obj.data?.content?.dataType === "moveObject") {
        const fields = obj.data.content.fields as Record<string, unknown>;
        const kioskId = fields.for as string;
        if (kioskId) {
          kioskIds.push(kioskId);
        }
      }
    }

    return kioskIds;
  } catch (error) {
    console.error("Failed to fetch user kiosks:", error);
    throw error;
  }
}

/**
 * ユーザーが所有する Kiosk と KioskOwnerCap のペア情報を取得
 */
export async function fetchUserKioskCaps(
  userAddress: string,
): Promise<UserKiosk[]> {
  try {
    // KioskOwnerCap を検索
    const response = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: "0x2::kiosk::KioskOwnerCap",
      },
      options: {
        showContent: true,
      },
    });

    const kiosks: UserKiosk[] = [];

    for (const obj of response.data) {
      if (obj.data?.content?.dataType === "moveObject") {
        const fields = obj.data.content.fields as Record<string, unknown>;
        const kioskId = fields.for as string;
        if (kioskId) {
          kiosks.push({
            kioskId,
            capId: obj.data.objectId,
          });
        }
      }
    }

    return kiosks;
  } catch (error) {
    console.error("Failed to fetch user kiosk caps:", error);
    throw error;
  }
}

/**
 * ユーザーが所有する Fight Moment NFT を取得
 */
export async function fetchUserNFTs(
  userAddress: string,
): Promise<FightMomentNFT[]> {
  try {
    // NFTMinted イベントを取得してユーザーのNFTを特定
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::types::NFTMinted`,
      },
      limit: 100,
    });

    // ユーザーがミントしたNFT IDを収集
    const userNftIds: string[] = [];
    for (const event of events.data) {
      const parsedJson = event.parsedJson as Record<string, unknown>;
      if (parsedJson.minter === userAddress) {
        userNftIds.push(parsedJson.nft_id as string);
      }
    }

    if (userNftIds.length === 0) {
      return [];
    }

    // 各NFTオブジェクトを取得
    const objects = await suiClient.multiGetObjects({
      ids: userNftIds,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      },
    });

    const nfts: FightMomentNFT[] = [];

    for (const obj of objects) {
      if (obj.data?.content?.dataType === "moveObject") {
        const fields = obj.data.content.fields as Record<string, unknown>;
        const media = fields.media as Record<string, unknown>;

        nfts.push({
          id: obj.data.objectId,
          momentId: fields.moment_id as string,
          matchId: fields.match_id as string,
          fighterA: fields.fighter_a as string,
          fighterB: fields.fighter_b as string,
          momentType: fields.moment_type as string,
          videoUri: (media.video_uri as string) || "",
          thumbnailUri: (media.thumbnail_uri as string) || "",
          serialNumber: Number(fields.serial_number),
          mintedAt: Number(fields.minted_at),
          collectionId: fields.collection_id as string,
          creator: fields.creator as string,
        });
      }
    }

    return nfts;
  } catch (error) {
    console.error("Failed to fetch user NFTs:", error);
    throw error;
  }
}

/**
 * Marketplace に出品中の Fight Moment NFT を取得
 */
export async function fetchMarketplaceListings(): Promise<KioskListing[]> {
  try {
    // ItemListed イベントを取得
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: "0x2::kiosk::ItemListed",
      },
      limit: 100,
    });

    // Fight Moments NFT の出品のみフィルタリング
    const listings: Array<{
      nftId: string;
      kioskId: string;
      price: number;
    }> = [];

    for (const event of events.data) {
      const parsedJson = event.parsedJson as Record<string, unknown>;
      const itemType = parsedJson.type as string | undefined;

      // Fight Moments NFT の型チェック
      if (itemType?.includes("FightMomentNFT")) {
        listings.push({
          nftId: parsedJson.id as string,
          kioskId: parsedJson.kiosk as string,
          price: Number(parsedJson.price),
        });
      }
    }

    if (listings.length === 0) {
      return [];
    }

    // 各NFTオブジェクトを取得
    const nftIds = listings.map((l) => l.nftId);
    const objects = await suiClient.multiGetObjects({
      ids: nftIds,
      options: {
        showContent: true,
        showType: true,
      },
    });

    const result: KioskListing[] = [];

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (obj.data?.content?.dataType === "moveObject") {
        const fields = obj.data.content.fields as Record<string, unknown>;
        const media = fields.media as Record<string, unknown>;

        const nft: FightMomentNFT = {
          id: obj.data.objectId,
          momentId: fields.moment_id as string,
          matchId: fields.match_id as string,
          fighterA: fields.fighter_a as string,
          fighterB: fields.fighter_b as string,
          momentType: fields.moment_type as string,
          videoUri: (media.video_uri as string) || "",
          thumbnailUri: (media.thumbnail_uri as string) || "",
          serialNumber: Number(fields.serial_number),
          mintedAt: Number(fields.minted_at),
          collectionId: fields.collection_id as string,
          creator: fields.creator as string,
        };

        result.push({
          nftId: listings[i].nftId,
          nft,
          price: listings[i].price,
          seller: "", // Kiosk システムでは販売者情報は直接取得できない
          kioskId: listings[i].kioskId,
        });
      }
    }

    return result;
  } catch (error) {
    console.error("Failed to fetch marketplace listings:", error);
    throw error;
  }
}

/**
 * MomentRegistry から全ての Moment メタデータを取得 (devInspect 使用)
 * ガスを消費せずにデータを取得できます
 */
export async function fetchMomentsFromRegistry(): Promise<MomentMetadata[]> {
  try {
    if (!MOMENT_REGISTRY_ID) {
      console.warn("MOMENT_REGISTRY_ID is not set");
      return [];
    }

    // Transaction を構築
    const tx = new Transaction();

    // registry::get_active_moments() を呼び出し
    tx.moveCall({
      target: `${PACKAGE_ID}::registry::get_active_moments`,
      arguments: [tx.object(MOMENT_REGISTRY_ID)],
    });

    // devInspect で実行（トランザクションは送信されない）
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: "0x0", // ダミーアドレス
    });

    // 結果をパース
    if (result.results && result.results[0]) {
      const returnValues = result.results[0].returnValues;
      if (returnValues && returnValues[0]) {
        const [bytes] = returnValues[0];

        // BCS deserialize
        // Note: 実際のデシリアライズは BCS ライブラリを使用する必要があります
        // 現時点では、結果を直接パースする方法を使用します

        // returnValuesから直接取得できる場合の処理
        // TODO: BCS deserializationの実装が必要な場合はここを修正

        // 暫定的に空の配列を返す（デプロイ後に実装を完成させる）
        console.log("devInspect result:", result);
        return [];
      }
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch moments from registry:", error);
    // フォールバック: 既存のイベントベース取得を使用
    return [];
  }
}

/**
 * MomentRegistry から単一の Moment メタデータを取得
 */
export async function fetchMomentFromRegistry(
  momentId: string,
): Promise<MomentMetadata | null> {
  try {
    if (!MOMENT_REGISTRY_ID) {
      console.warn("MOMENT_REGISTRY_ID is not set");
      return null;
    }

    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::registry::get_moment`,
      arguments: [tx.object(MOMENT_REGISTRY_ID), tx.pure.id(momentId)],
    });

    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: "0x0",
    });

    if (result.results && result.results[0]) {
      const returnValues = result.results[0].returnValues;
      if (returnValues && returnValues[0]) {
        // TODO: BCS deserializationの実装
        console.log("devInspect result for single moment:", result);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch moment from registry:", error);
    return null;
  }
}
