/**
 * Custom hook for fetching user's NFT data
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchUserKioskCaps,
  fetchUserKiosks,
  fetchUserNFTs,
} from "@/lib/sui/queries";

/**
 * Fetch NFTs owned by user
 */
export function useUserNFTs(userAddress: string | null) {
  return useQuery({
    queryKey: ["userNFTs", userAddress],
    queryFn: () => {
      if (!userAddress) {
        throw new Error("User address is required");
      }
      return fetchUserNFTs(userAddress);
    },
    enabled: !!userAddress,
    staleTime: 30000, // Use cache for 30 seconds
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

/**
 * Fetch Kiosks owned by user
 */
export function useUserKiosks(userAddress: string | null) {
  return useQuery({
    queryKey: ["userKiosks", userAddress],
    queryFn: () => {
      if (!userAddress) {
        throw new Error("User address is required");
      }
      return fetchUserKiosks(userAddress);
    },
    enabled: !!userAddress,
    staleTime: 30000,
  });
}

/**
 * Fetch Kiosk and KioskOwnerCap pair information owned by user
 */
export function useUserKioskCaps(userAddress: string | null) {
  return useQuery({
    queryKey: ["userKioskCaps", userAddress],
    queryFn: () => {
      if (!userAddress) {
        throw new Error("User address is required");
      }
      return fetchUserKioskCaps(userAddress);
    },
    enabled: !!userAddress,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
