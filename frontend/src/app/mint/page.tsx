"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState } from "react";
import { LiveHeader } from "@/components/mint/LiveHeader";
import { LiveStats } from "@/components/mint/LiveStats";
import { LiveStreamEmbed } from "@/components/mint/LiveStreamEmbed";
import { MomentsList } from "@/components/mint/MomentsList";
import { getSuiscanUrl } from "@/lib/constants";

export default function MintPage() {
  const currentAccount = useCurrentAccount();
  const [successDigest, setSuccessDigest] = useState<string | null>(null);

  const handleMintSuccess = (digest: string) => {
    setSuccessDigest(digest);
    // 5秒後に成功メッセージを自動で消す
    setTimeout(() => {
      setSuccessDigest(null);
    }, 5000);
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Fight Moments Mint
          </h1>
          <p className="text-gray-600">ウォレットを接続してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-black overflow-hidden">
      {/* Live Header */}
      <LiveHeader />

      {/* Success Toast Notification */}
      {successDigest && (
        <div className="fixed top-20 right-4 z-50 max-w-md animate-slide-in-right">
          <div className="bg-gray-900 border border-red-500 rounded-lg shadow-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <title>Success</title>
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-white">
                  Mint が成功しました！
                </h3>
                <p className="text-xs text-gray-400 mt-1 break-all">
                  Transaction: {successDigest.slice(0, 20)}...
                </p>
                <a
                  href={getSuiscanUrl(successDigest)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-400 hover:text-red-300 underline mt-1 inline-block"
                >
                  Suiscanで確認 →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split Screen Layout: 60% Video + 40% Mint List */}
      <div className="flex-1 grid grid-cols-[3fr_2fr] gap-0 overflow-hidden">
        {/* Left: Live Stream (60%) */}
        <div className="bg-black p-6 flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-5xl">
            <LiveStreamEmbed videoId="1xoyLZ2VgVE" />
          </div>
        </div>

        {/* Right: Mintable Moments Sidebar (40%) */}
        <div className="bg-gray-900 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                🔥 Mint可能なMoments
              </h2>
              <p className="text-sm text-gray-400">
                試合を見ながら今すぐMint！逃すと二度と手に入りません
              </p>
            </div>

            <MomentsList onMintSuccess={handleMintSuccess} />
          </div>
        </div>
      </div>

      {/* Live Stats Footer */}
      <LiveStats />
    </div>
  );
}
