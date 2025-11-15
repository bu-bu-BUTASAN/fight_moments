"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState } from "react";
import { NFTsList } from "@/components/mynfts/NFTsList";
import { getSuiscanUrl } from "@/lib/constants";

export default function MyNFTsPage() {
  const currentAccount = useCurrentAccount();
  const [successDigest, setSuccessDigest] = useState<string | null>(null);

  const handleListSuccess = (digest: string) => {
    setSuccessDigest(digest);
    // Auto-dismiss success message after 5 seconds
    setTimeout(() => {
      setSuccessDigest(null);
    }, 5000);
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">My NFTs</h1>
          <p className="text-gray-400">Please connect your wallet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🏆 My NFTs</h1>
          <p className="text-gray-400">Your Fight Moments NFT collection</p>
        </div>

        {/* Success Message */}
        {successDigest && (
          <div className="mb-6 p-4 bg-gray-900 border border-red-500 rounded-lg shadow-lg">
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
                  NFT listed successfully!
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
                  View on Suiscan →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* NFTs List */}
        <NFTsList
          userAddress={currentAccount.address}
          onListSuccess={handleListSuccess}
        />

        {/* Wallet Info */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Connected Wallet
            </h3>
            <p className="text-xs text-gray-500 font-mono break-all">
              {currentAccount.address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
