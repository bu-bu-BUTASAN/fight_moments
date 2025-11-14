/**
 * ユーザーのNFTデータフェッチ用カスタムフック
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchUserKioskCaps,
  fetchUserKiosks,
  fetchUserNFTs,
} from "@/lib/sui/queries";

/**
 * ユーザーが所有する NFT を取得
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
    staleTime: 30000, // 30秒間はキャッシュを使用
    refetchInterval: 60000, // 1分ごとに自動更新
  });
}

/**
 * ユーザーが所有する Kiosk を取得
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
 * ユーザーが所有する Kiosk と KioskOwnerCap のペア情報を取得
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
