"use client";

import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getWalrusHttpsUrl } from "@/lib/constants";
import { buildCreateKioskAndMintTx } from "@/lib/sui/ptb";
import type { MintableMoment } from "@/types/contract";
import { momentTypeToString } from "@/types/contract";
import { CountdownTimer } from "./CountdownTimer";
import { SupplyBadge } from "./SupplyBadge";

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
    getWalrusHttpsUrl(moment.thumbnailBlobId),
  );

  useEffect(() => {
    const url = getWalrusHttpsUrl(moment.thumbnailBlobId);
    console.log("[MomentCard] Thumbnail Blob ID:", moment.thumbnailBlobId);
    console.log("[MomentCard] Generated URL:", url);
    setThumbnailSrc(url);
  }, [moment.thumbnailBlobId]);

  const handleImageError = () => {
    console.log("[MomentCard] Image load failed, using fallback");
    setThumbnailSrc("/sample_contents/image.png");
  };

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

  // ダミーのMint終了時刻(現在時刻から10分後)
  const mintEndTime = Date.now() + 10 * 60 * 1000;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-blue-300">
      <div className="flex gap-3 p-3">
        {/* サムネイル - コンパクト */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
          <Image
            src={thumbnailSrc}
            alt={`${moment.fighterA} vs ${moment.fighterB}`}
            fill
            className="object-cover"
            sizes="96px"
            unoptimized
            onError={handleImageError}
          />
          {isSoldOut && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SOLD OUT</span>
            </div>
          )}
        </div>

        {/* 詳細 */}
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {moment.fighterA} vs {moment.fighterB}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              Match: {moment.matchId}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {momentTypeToString(moment.momentType)}
            </span>
            <SupplyBadge remaining={remainingSupply} total={moment.maxSupply} />
          </div>

          <div className="mb-2">
            <CountdownTimer endTime={mintEndTime} />
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-2 p-1.5 bg-red-50 border border-red-200 rounded">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Mintボタン */}
          <button
            type="button"
            onClick={handleMint}
            disabled={isMinting || isSoldOut}
            className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors"
          >
            {isMinting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <title>Loading</title>
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Minting...
              </span>
            ) : isSoldOut ? (
              "Sold Out"
            ) : (
              "⚡ Mint NFT"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
