/**
 * Custom hook for fetching Marketplace data
 */

import { useQuery } from "@tanstack/react-query";
import { fetchMarketplaceListings } from "@/lib/sui/queries";

/**
 * Fetch NFTs listed on the Marketplace
 */
export function useMarketplaceListings() {
  return useQuery({
    queryKey: ["marketplaceListings"],
    queryFn: fetchMarketplaceListings,
    staleTime: 30000, // Use cache for 30 seconds
    refetchInterval: 60000, // Auto-refresh every minute
  });
}
