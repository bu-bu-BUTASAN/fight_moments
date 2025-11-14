"use client";

import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import Image from "next/image";
import { useEffect, useState } from "react";
import { buildCreateKioskAndMintTx } from "@/lib/sui/ptb";
import { getWalrusViewUrl } from "@/lib/walrus/upload";
import type { MintableMoment } from "@/types/contract";
import { momentTypeToString } from "@/types/contract";

interface MomentCardProps {
  moment: MintableMoment;
  onMintSuccess?: (digest: string) => void;
}

export function MomentCard({ moment, onMintSuccess }: MomentCardProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const remainingSupply = moment.maxSupply - moment.mintedCount;
  const isSoldOut = remainingSupply === 0;
  const [thumbnailSrc, setThumbnailSrc] = useState(() =>
    getWalrusViewUrl(moment.thumbnailWalrusUri),
  );

  useEffect(() => {
    setThumbnailSrc(getWalrusViewUrl(moment.thumbnailWalrusUri));
  }, [moment.thumbnailWalrusUri]);

  const handleMint = () => {
    setIsMinting(true);
    setError(null);

    try {
      const tx = buildCreateKioskAndMintTx({ momentId: moment.id });

      signAndExecute(
        {
          transaction: tx as never,
        },
        {
          onSuccess: (result) => {
            console.log("Mint successful:", result.digest);
            setIsMinting(false);
            onMintSuccess?.(result.digest);
          },
          onError: (err) => {
            console.error("Mint failed:", err);
            setError(err.message);
            setIsMinting(false);
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
      setIsMinting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* サムネイル */}
      <div className="relative aspect-video bg-gray-100">
        <Image
          src={thumbnailSrc}
          alt={`${moment.fighterA} vs ${moment.fighterB}`}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
          unoptimized
          onError={() => setThumbnailSrc("/placeholder-thumbnail.png")}
        />
        {isSoldOut && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">SOLD OUT</span>
          </div>
        )}
      </div>

      {/* 詳細 */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900">
            {moment.fighterA} vs {moment.fighterB}
          </h3>
          <p className="text-sm text-gray-600">Match ID: {moment.matchId}</p>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {momentTypeToString(moment.momentType)}
          </span>
          <span className="text-sm text-gray-600">
            {moment.mintedCount} / {moment.maxSupply} minted
          </span>
        </div>

        {/* プログレスバー */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(moment.mintedCount / moment.maxSupply) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            残り {remainingSupply} 枚
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Mintボタン */}
        <button
          type="button"
          onClick={handleMint}
          disabled={isMinting || isSoldOut}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isMinting ? "Minting..." : isSoldOut ? "Sold Out" : "Mint NFT"}
        </button>
      </div>
    </div>
  );
}
