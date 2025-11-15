/**
 * Sui RPC query functions
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
 * Fetch all MintableMoment objects
 * Since MintableMoment is a shared object, fetch from events
 */
export async function fetchMintableMoments(): Promise<MintableMoment[]> {
  try {
    // Fetch MomentRegistered events to collect Moment IDs
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::types::MomentRegistered`,
      },
      limit: 50, // Latest 50 items
    });

    const momentIds = events.data.map((event) => {
      const parsedJson = event.parsedJson as Record<string, unknown>;
      return parsedJson.moment_id as string;
    });

    if (momentIds.length === 0) {
      return [];
    }

    // Fetch each Moment object
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
 * Fetch a specific MintableMoment by ID
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
 * Fetch Kiosks owned by user
 */
export async function fetchUserKiosks(userAddress: string): Promise<string[]> {
  try {
    // Search for KioskOwnerCap
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
 * Fetch Kiosk and KioskOwnerCap pair information owned by user
 */
export async function fetchUserKioskCaps(
  userAddress: string,
): Promise<UserKiosk[]> {
  try {
    // Search for KioskOwnerCap
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
 * Fetch Fight Moment NFTs owned by user
 */
export async function fetchUserNFTs(
  userAddress: string,
): Promise<FightMomentNFT[]> {
  try {
    // Fetch NFTMinted events to identify user's NFTs
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::types::NFTMinted`,
      },
      limit: 100,
    });

    // Collect NFT IDs minted by user
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

    // Fetch each NFT object
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
 * Fetch Fight Moment NFTs listed on Marketplace
 */
export async function fetchMarketplaceListings(): Promise<KioskListing[]> {
  try {
    // Fetch ItemListed events
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: "0x2::kiosk::ItemListed",
      },
      limit: 100,
    });

    // Filter only Fight Moments NFT listings
    const listings: Array<{
      nftId: string;
      kioskId: string;
      price: number;
    }> = [];

    for (const event of events.data) {
      const parsedJson = event.parsedJson as Record<string, unknown>;
      const itemType = parsedJson.type as string | undefined;

      // Check for Fight Moments NFT type
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

    // Fetch each NFT object
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
          seller: "", // Seller information cannot be directly obtained in Kiosk system
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
 * Fetch all Moment metadata from MomentRegistry (using devInspect)
 * Can retrieve data without consuming gas
 */
export async function fetchMomentsFromRegistry(): Promise<MomentMetadata[]> {
  try {
    if (!MOMENT_REGISTRY_ID) {
      console.warn("MOMENT_REGISTRY_ID is not set");
      return [];
    }

    // Build Transaction
    const tx = new Transaction();

    // Call registry::get_active_moments()
    tx.moveCall({
      target: `${PACKAGE_ID}::registry::get_active_moments`,
      arguments: [tx.object(MOMENT_REGISTRY_ID)],
    });

    // Execute with devInspect (transaction is not submitted)
    const result = await suiClient.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: "0x0", // Dummy address
    });

    // Parse result
    if (result.results && result.results[0]) {
      const returnValues = result.results[0].returnValues;
      if (returnValues && returnValues[0]) {
        const [bytes] = returnValues[0];

        // BCS deserialize
        // Note: Actual deserialization requires using BCS library
        // Currently using direct parse method

        // Processing when available directly from returnValues
        // TODO: Modify here if BCS deserialization implementation is needed

        // Temporarily return empty array (complete implementation after deployment)
        console.log("devInspect result:", result);
        return [];
      }
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch moments from registry:", error);
    // Fallback: Use existing event-based fetch
    return [];
  }
}

/**
 * Fetch single Moment metadata from MomentRegistry
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
        // TODO: Implement BCS deserialization
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
