"use client";

import { useUserKioskCaps, useUserNFTs } from "@/hooks/useUserNFTs";
import { NFTCard } from "./NFTCard";

interface NFTsListProps {
  userAddress: string;
  onListSuccess?: (digest: string) => void;
}

export function NFTsList({ userAddress, onListSuccess }: NFTsListProps) {
  const {
    data: nfts,
    isLoading: nftsLoading,
    error: nftsError,
    refetch: refetchNFTs,
  } = useUserNFTs(userAddress);
  const { data: kioskCaps, isLoading: kiosksLoading } =
    useUserKioskCaps(userAddress);

  const isLoading = nftsLoading || kiosksLoading;
  const error = nftsError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading NFTs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-400 mb-4">
          Failed to load NFTs: {error.message}
        </p>
        <button
          type="button"
          onClick={() => refetchNFTs()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!nfts || nfts.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-300 text-lg mb-4">You don't own any NFTs yet</p>
        <p className="text-gray-500 text-sm">
          Try minting your favorite Moments from the Mint page!
        </p>
      </div>
    );
  }

  const kioskId =
    kioskCaps && kioskCaps.length > 0 ? kioskCaps[0].kioskId : null;
  const kioskCapId =
    kioskCaps && kioskCaps.length > 0 ? kioskCaps[0].capId : null;

  const handleListSuccess = (digest: string) => {
    refetchNFTs();
    onListSuccess?.(digest);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Your NFTs</h2>
        <button
          type="button"
          onClick={() => refetchNFTs()}
          className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 border border-gray-700 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Refresh</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <NFTCard
            key={nft.id}
            nft={nft}
            kioskId={kioskId}
            kioskCapId={kioskCapId}
            onListSuccess={handleListSuccess}
          />
        ))}
      </div>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Total: {nfts.length} NFTs
      </p>
    </div>
  );
}
