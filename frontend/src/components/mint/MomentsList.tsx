"use client";

import { useMintableMoments } from "@/hooks/useMintableMoments";
import { MomentCard } from "./MomentCard";

interface MomentsListProps {
  onMintSuccess?: (digest: string) => void;
}

export function MomentsList({ onMintSuccess }: MomentsListProps) {
  const { data: moments, isLoading, error, refetch } = useMintableMoments();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Moments を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">
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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-gray-600 text-lg">
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          ミント可能な Moments
        </h2>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          更新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moments.map((moment) => (
          <MomentCard
            key={moment.id}
            moment={moment}
            onMintSuccess={handleMintSuccess}
          />
        ))}
      </div>

      <p className="text-sm text-gray-500 mt-6 text-center">
        全 {moments.length} 件の Moment
      </p>
    </div>
  );
}
