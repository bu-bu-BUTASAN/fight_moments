/**
 * Custom hook for fetching MomentRegistry data
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchMomentFromRegistry,
  fetchMomentsFromRegistry,
} from "@/lib/sui/queries";

/**
 * Fetch all active Moments from MomentRegistry
 * Uses devInspect to fetch without consuming gas
 */
export function useMomentRegistry() {
  return useQuery({
    queryKey: ["momentRegistry"],
    queryFn: fetchMomentsFromRegistry,
    staleTime: 30000, // Use cache for 30 seconds
    refetchInterval: 60000, // Auto-refresh every minute
  });
}

/**
 * Fetch a specific Moment from MomentRegistry
 */
export function useMomentFromRegistry(momentId: string | null) {
  return useQuery({
    queryKey: ["momentFromRegistry", momentId],
    queryFn: () => {
      if (!momentId) {
        throw new Error("Moment ID is required");
      }
      return fetchMomentFromRegistry(momentId);
    },
    enabled: !!momentId, // Execute query only when momentId exists
    staleTime: 30000,
  });
}
