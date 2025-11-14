/**
 * MintableMoment データフェッチ用カスタムフック
 */

import { useQuery } from "@tanstack/react-query";
import { fetchMintableMoment, fetchMintableMoments } from "@/lib/sui/queries";

/**
 * すべての MintableMoment を取得
 */
export function useMintableMoments() {
  return useQuery({
    queryKey: ["mintableMoments"],
    queryFn: fetchMintableMoments,
    staleTime: 30000, // 30秒間はキャッシュを使用
    refetchInterval: 60000, // 1分ごとに自動更新
  });
}

/**
 * 特定の MintableMoment を取得
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
    enabled: !!momentId, // momentId がある場合のみクエリを実行
    staleTime: 30000,
  });
}
