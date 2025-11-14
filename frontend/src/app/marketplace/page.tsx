"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import Link from "next/link";
import { useState } from "react";
import { MarketplaceNFTsList } from "@/components/marketplace/MarketplaceNFTsList";
import { useMarketplaceListings } from "@/hooks/useMarketplace";
import { useUserKioskCaps } from "@/hooks/useUserNFTs";

export default function MarketplacePage() {
  const currentAccount = useCurrentAccount();
  const {
    data: listings,
    isLoading,
    error,
    refetch,
  } = useMarketplaceListings();

  const { data: userKioskCaps } = useUserKioskCaps(
    currentAccount?.address ?? null,
  );

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePurchaseSuccess = (digest: string) => {
    setSuccessMessage(
      `NFTを購入しました! トランザクション: ${digest.slice(0, 8)}...`,
    );
    // 5秒後にメッセージを消す
    setTimeout(() => setSuccessMessage(null), 5000);
    // リストを再取得
    refetch();
  };

  if (!currentAccount) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-2">
            ウォレット接続が必要です
          </h2>
          <p className="text-yellow-700">
            Marketplaceを利用するには、ウォレットを接続してください。
          </p>
        </div>
      </div>
    );
  }

  // userKioskCaps の最初の要素を使用（簡易実装）
  const userKioskId =
    userKioskCaps && userKioskCaps.length > 0 ? userKioskCaps[0].kioskId : null;
  const userKioskCapId =
    userKioskCaps && userKioskCaps.length > 0 ? userKioskCaps[0].capId : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace</h1>
        <p className="text-gray-600">出品中のFight Moments NFTを購入できます</p>
      </div>

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
          <Link
            href={`https://suiscan.xyz/testnet/tx/${successMessage.match(/[0-9A-Fa-f]+/)?.[0]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700 text-sm underline"
          >
            Suiscan で確認
          </Link>
        </div>
      )}

      {/* ローディング */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">読み込み中...</p>
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">エラーが発生しました: {error.message}</p>
        </div>
      )}

      {/* NFT リスト */}
      {listings && (
        <MarketplaceNFTsList
          listings={listings}
          userKioskId={userKioskId}
          userKioskCapId={userKioskCapId}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}
