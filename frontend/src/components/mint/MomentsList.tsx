"use client";

import { useMintableMoments } from "@/hooks/useMintableMoments";
// TODO: BCSデシリアライゼーション実装後、useMomentRegistryに切り替え
// import { useMomentRegistry } from "@/hooks/useMomentRegistry";
import { MomentCard } from "./MomentCard";

interface MomentsListProps {
  onMintSuccess?: (digest: string) => void;
}

export function MomentsList({ onMintSuccess }: MomentsListProps) {
  // TODO: BCSデシリアライゼーション実装後、以下に切り替え
  // const { data: moments, isLoading, error, refetch } = useMomentRegistry();
  const { data: moments, isLoading, error, refetch } = useMintableMoments();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Moments を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 border border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-400 mb-4">
          Moments の読み込みに失敗しました: {error.message}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!moments || moments.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-400 text-lg">
          現在ミント可能な Moment はありません
        </p>
      </div>
    );
  }

  const handleMintSuccess = (digest: string) => {
    // データを再取得して最新状態に更新
    refetch();
    onMintSuccess?.(digest);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => refetch()}
          className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 border border-gray-700 flex items-center gap-1.5"
        >
          <svg
            className="w-3.5 h-3.5"
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
          更新
        </button>
        <p className="text-xs text-gray-400">全 {moments.length} 件</p>
      </div>

      <div className="flex flex-col gap-4">
        {moments.map((moment) => (
          <MomentCard
            key={moment.id}
            moment={moment}
            onMintSuccess={handleMintSuccess}
          />
        ))}
      </div>
    </div>
  );
}
