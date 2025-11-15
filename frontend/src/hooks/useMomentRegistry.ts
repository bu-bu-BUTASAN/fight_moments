/**
 * MomentRegistry データフェッチ用カスタムフック
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchMomentFromRegistry,
  fetchMomentsFromRegistry,
} from "@/lib/sui/queries";

/**
 * MomentRegistry からすべてのアクティブな Moment を取得
 * devInspect を使用してガス消費なしで取得
 */
export function useMomentRegistry() {
  return useQuery({
    queryKey: ["momentRegistry"],
    queryFn: fetchMomentsFromRegistry,
    staleTime: 30000, // 30秒間はキャッシュを使用
    refetchInterval: 60000, // 1分ごとに自動更新
  });
}

/**
 * MomentRegistry から特定の Moment を取得
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
    enabled: !!momentId, // momentId がある場合のみクエリを実行
    staleTime: 30000,
  });
}
