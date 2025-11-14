"use client";

import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import Image from "next/image";
import { useEffect, useState } from "react";
import { suiToMist } from "@/lib/constants";
import { buildDelistNFTTx, buildListNFTTx } from "@/lib/sui/ptb";
import { getWalrusViewUrl } from "@/lib/walrus/upload";
import type { FightMomentNFT } from "@/types/contract";
import { momentTypeToString } from "@/types/contract";

interface NFTCardProps {
  nft: FightMomentNFT;
  kioskId: string | null;
  kioskCapId: string | null;
  onListSuccess?: (digest: string) => void;
}

export function NFTCard({
  nft,
  kioskId,
  kioskCapId,
  onListSuccess,
}: NFTCardProps) {
  const [showListForm, setShowListForm] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [isListing, setIsListing] = useState(false);
  const [isDelisting, setIsDelisting] = useState(false);
  const [isListed, setIsListed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [thumbnailSrc, setThumbnailSrc] = useState(() =>
    getWalrusViewUrl(nft.thumbnailUri),
  );

  useEffect(() => {
    setThumbnailSrc(getWalrusViewUrl(nft.thumbnailUri));
  }, [nft.thumbnailUri]);

  const handleList = () => {
    if (!kioskId || !kioskCapId) {
      setError("Kiosk情報が見つかりません");
      return;
    }

    const priceNum = Number.parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError("有効な価格を入力してください");
      return;
    }

    setIsListing(true);
    setError(null);

    try {
      const priceMist = suiToMist(priceNum);
      const tx = buildListNFTTx({
        kioskId,
        kioskCapId,
        nftId: nft.id,
        price: priceMist,
      });

      signAndExecute(
        {
          transaction: tx as never,
        },
        {
          onSuccess: (result) => {
            console.log("NFT listed:", result.digest);
            setShowListForm(false);
            setPrice("");
            setIsListing(false);
            setIsListed(true);
            onListSuccess?.(result.digest);
          },
          onError: (err) => {
            console.error("List failed:", err);
            setError(err.message);
            setIsListing(false);
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
      setIsListing(false);
    }
  };

  const handleDelist = () => {
    if (!kioskId || !kioskCapId) {
      setError("Kiosk情報が見つかりません");
      return;
    }

    setIsDelisting(true);
    setError(null);

    try {
      const tx = buildDelistNFTTx({
        kioskId,
        kioskCapId,
        nftId: nft.id,
      });

      signAndExecute(
        {
          transaction: tx as never,
        },
        {
          onSuccess: (result) => {
            console.log("NFT delisted:", result.digest);
            setIsDelisting(false);
            setIsListed(false);
            onListSuccess?.(result.digest);
          },
          onError: (err) => {
            console.error("Delist failed:", err);
            setError(err.message);
            setIsDelisting(false);
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
      setIsDelisting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* サムネイル */}
      <div className="relative aspect-video bg-gray-100">
        <Image
          src={thumbnailSrc}
          alt={`${nft.fighterA} vs ${nft.fighterB}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
          unoptimized
          onError={() => setThumbnailSrc("/placeholder-thumbnail.png")}
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded">
          <span className="text-white text-xs font-bold">
            #{nft.serialNumber}
          </span>
        </div>
      </div>

      {/* 詳細 */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900">
            {nft.fighterA} vs {nft.fighterB}
          </h3>
          <p className="text-sm text-gray-600">Match: {nft.matchId}</p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {momentTypeToString(nft.momentType)}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(nft.mintedAt).toLocaleDateString()}
          </span>
        </div>

        {/* 出品フォーム */}
        {isListed ? (
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-2">
              <p className="text-xs text-blue-700 text-center">
                このNFTは出品中です
              </p>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="button"
              onClick={handleDelist}
              disabled={isDelisting || !kioskId || !kioskCapId}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isDelisting ? "取消中..." : "出品を取り消す"}
            </button>
          </div>
        ) : !showListForm ? (
          <button
            type="button"
            onClick={() => setShowListForm(true)}
            disabled={!kioskId || !kioskCapId}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            出品する
          </button>
        ) : (
          <div className="space-y-2">
            <div>
              <label
                htmlFor={`price-${nft.id}`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                価格 (SUI)
              </label>
              <input
                id={`price-${nft.id}`}
                type="number"
                step="0.1"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="例: 10.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isListing}
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleList}
                disabled={isListing || !price}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isListing ? "出品中..." : "確定"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowListForm(false);
                  setPrice("");
                  setError(null);
                }}
                disabled={isListing}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 text-sm font-medium"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
