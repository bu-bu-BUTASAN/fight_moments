"use client";

import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import Image from "next/image";
import { useEffect, useState } from "react";
import { mistToSui } from "@/lib/constants";
import {
  buildPurchaseAndLockToNewKioskTx,
  buildPurchaseAndLockTx,
} from "@/lib/sui/ptb";
import { getWalrusViewUrl } from "@/lib/walrus/upload";
import type { KioskListing } from "@/types/contract";
import { momentTypeToString } from "@/types/contract";

interface MarketplaceNFTCardProps {
  listing: KioskListing;
  userKioskId: string | null;
  userKioskCapId: string | null;
  onPurchaseSuccess?: (digest: string) => void;
}

export function MarketplaceNFTCard({
  listing,
  userKioskId,
  userKioskCapId,
  onPurchaseSuccess,
}: MarketplaceNFTCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [thumbnailSrc, setThumbnailSrc] = useState(() =>
    getWalrusViewUrl(listing.nft.thumbnailUri),
  );

  useEffect(() => {
    setThumbnailSrc(getWalrusViewUrl(listing.nft.thumbnailUri));
  }, [listing.nft.thumbnailUri]);

  const handlePurchase = () => {
    if (!currentAccount) {
      setError("ウォレットが接続されていません");
      return;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      // ユーザーが既存の Kiosk を持っているかチェック
      const tx =
        userKioskId && userKioskCapId
          ? buildPurchaseAndLockTx({
              sellerKioskId: listing.kioskId,
              buyerKioskId: userKioskId,
              buyerKioskCapId: userKioskCapId,
              nftId: listing.nft.id,
              price: listing.price,
            })
          : buildPurchaseAndLockToNewKioskTx({
              sellerKioskId: listing.kioskId,
              nftId: listing.nft.id,
              price: listing.price,
              buyerAddress: currentAccount.address,
            });

      signAndExecute(
        {
          transaction: tx as never,
        },
        {
          onSuccess: (result) => {
            console.log("NFT purchased:", result.digest);
            setIsPurchasing(false);
            onPurchaseSuccess?.(result.digest);
          },
          onError: (err) => {
            console.error("Purchase failed:", err);
            setError(err.message);
            setIsPurchasing(false);
          },
        },
      );
    } catch (err) {
      console.error("Failed to build transaction:", err);
      setError(
        err instanceof Error
          ? err.message
          : "トランザクションの構築に失敗しました",
      );
      setIsPurchasing(false);
    }
  };

  const priceInSui = mistToSui(listing.price);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* サムネイル */}
      <div className="relative aspect-video bg-gray-100">
        <Image
          src={thumbnailSrc}
          alt={`${listing.nft.fighterA} vs ${listing.nft.fighterB}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
          unoptimized
          onError={() => setThumbnailSrc("/placeholder-thumbnail.png")}
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded">
          <span className="text-white text-xs font-bold">
            #{listing.nft.serialNumber}
          </span>
        </div>
      </div>

      {/* 詳細 */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900">
            {listing.nft.fighterA} vs {listing.nft.fighterB}
          </h3>
          <p className="text-sm text-gray-600">Match: {listing.nft.matchId}</p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {momentTypeToString(listing.nft.momentType)}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(listing.nft.mintedAt).toLocaleDateString()}
          </span>
        </div>

        {/* 価格 */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">価格</span>
            <span className="text-xl font-bold text-gray-900">
              {priceInSui.toFixed(2)} SUI
            </span>
          </div>
        </div>

        {/* エラー表示 */}
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

        {/* 購入ボタン */}
        <button
          type="button"
          onClick={handlePurchase}
          disabled={isPurchasing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isPurchasing ? "購入中..." : "購入する"}
        </button>
      </div>
    </div>
  );
}
