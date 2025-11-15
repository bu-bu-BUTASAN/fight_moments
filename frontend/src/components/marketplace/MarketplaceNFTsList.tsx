"use client";

import type { KioskListing } from "@/types/contract";
import { MarketplaceNFTCard } from "./MarketplaceNFTCard";

interface MarketplaceNFTsListProps {
  listings: KioskListing[];
  userKioskId: string | null;
  userKioskCapId: string | null;
  onPurchaseSuccess?: (digest: string) => void;
}

export function MarketplaceNFTsList({
  listings,
  userKioskId,
  userKioskCapId,
  onPurchaseSuccess,
}: MarketplaceNFTsListProps) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No NFTs currently listed for sale
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <MarketplaceNFTCard
          key={listing.nft.id}
          listing={listing}
          userKioskId={userKioskId}
          userKioskCapId={userKioskCapId}
          onPurchaseSuccess={onPurchaseSuccess}
        />
      ))}
    </div>
  );
}
