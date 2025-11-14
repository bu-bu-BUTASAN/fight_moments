"use client";

import { useState } from "react";
import { useWalrusUpload } from "@/hooks/useWalrusUpload";
import type { WalrusUploadResult } from "@/types/walrus";

interface WalrusUploadFormProps {
  onUploadSuccess: (
    videoResult: WalrusUploadResult,
    thumbnailResult: WalrusUploadResult,
  ) => void;
}

export function WalrusUploadForm({ onUploadSuccess }: WalrusUploadFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const { isUploading, progress, error, upload, reset } = useWalrusUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile || !thumbnailFile) {
      alert("動画ファイルとサムネイル画像の両方を選択してください");
      return;
    }

    try {
      const { videoResult, thumbnailResult } = await upload(
        videoFile,
        thumbnailFile,
      );
      onUploadSuccess(videoResult, thumbnailResult);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleReset = () => {
    setVideoFile(null);
    setThumbnailFile(null);
    reset();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">動画アップロード</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="video"
            className="block text-sm font-medium text-gray-700"
          >
            動画ファイル (MP4, WebM, Ogg - 30秒以内)
          </label>
          <input
            id="video"
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            disabled={isUploading}
            className="mt-1 block w-full text-sm text-gray-500
							file:mr-4 file:py-2 file:px-4
							file:rounded-md file:border-0
							file:text-sm file:font-semibold
							file:bg-blue-50 file:text-blue-700
							hover:file:bg-blue-100
							disabled:opacity-50"
            required
          />
        </div>

        <div>
          <label
            htmlFor="thumbnail"
            className="block text-sm font-medium text-gray-700"
          >
            サムネイル画像 (JPEG, PNG, WebP)
          </label>
          <input
            id="thumbnail"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            disabled={isUploading}
            className="mt-1 block w-full text-sm text-gray-500
							file:mr-4 file:py-2 file:px-4
							file:rounded-md file:border-0
							file:text-sm file:font-semibold
							file:bg-blue-50 file:text-blue-700
							hover:file:bg-blue-100
							disabled:opacity-50"
            required
          />
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {progress < 50
                ? "動画アップロード中..."
                : "サムネイルアップロード中..."}
              ({Math.round(progress)}%)
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Walrus アップロードに失敗しました: {error}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isUploading || !videoFile || !thumbnailFile}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "アップロード中..." : "アップロード"}
          </button>

          {(videoFile || thumbnailFile) && !isUploading && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              リセット
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
