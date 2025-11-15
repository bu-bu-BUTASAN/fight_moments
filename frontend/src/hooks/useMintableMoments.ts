/**
 * Custom hook for fetching MintableMoment data
 */

import { useQuery } from "@tanstack/react-query";
import { fetchMintableMoment, fetchMintableMoments } from "@/lib/sui/queries";

/**
 * Fetch all MintableMoments
 */
export function useMintableMoments() {
  return useQuery({
    queryKey: ["mintableMoments"],
    queryFn: fetchMintableMoments,
    staleTime: 30000, // Use cache for 30 seconds
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

/**
 * Fetch a specific MintableMoment
 */
export function useMintableMoment(momentId: string | null) {
  return useQuery({
    queryKey: ["mintableMoment", momentId],
    queryFn: () => {
      if (!momentId) {
        throw new Error("Moment ID is required");
      }
      return fetchMintableMoment(momentId);
    },
    enabled: !!momentId, // Execute query only when momentId exists
    staleTime: 30000,
  });
}
