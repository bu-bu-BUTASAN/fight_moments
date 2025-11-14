/**
 * Marketplace データフェッチ用カスタムフック
 */

import { useQuery } from "@tanstack/react-query";
import { fetchMarketplaceListings } from "@/lib/sui/queries";

/**
 * Marketplace に出品中の NFT を取得
 */
export function useMarketplaceListings() {
  return useQuery({
    queryKey: ["marketplaceListings"],
    queryFn: fetchMarketplaceListings,
    staleTime: 30000, // 30秒間はキャッシュを使用
    refetchInterval: 60000, // 1分ごとに自動更新
  });
}
