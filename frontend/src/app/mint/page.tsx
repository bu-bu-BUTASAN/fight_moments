"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState } from "react";
import { MomentsList } from "@/components/mint/MomentsList";

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fight Moments Mint
          </h1>
          <p className="text-gray-600">
            お気に入りの格闘技シーンをNFTとしてミントしよう
          </p>
        </div>

        {/* 成功メッセージ */}
        {successDigest && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
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
                <h3 className="text-sm font-medium text-green-800">
                  Mint が成功しました！
                </h3>
                <p className="text-sm text-green-700 mt-1 break-all">
                  Transaction: {successDigest}
                </p>
                <a
                  href={`https://testnet.suivision.xyz/txblock/${successDigest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 hover:text-green-900 underline mt-1 inline-block"
                >
                  Explorerで確認 →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Moments リスト */}
        <MomentsList onMintSuccess={handleMintSuccess} />

        {/* ウォレット情報 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              接続中のウォレット
            </h3>
            <p className="text-sm text-gray-600 font-mono break-all">
              {currentAccount.address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
