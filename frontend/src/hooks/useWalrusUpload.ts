/**
 * Walrus アップロード用カスタムフック
 */

import { useState } from "react";
import {
  validateImageFormat,
  validateVideoDuration,
  validateVideoFormat,
} from "@/lib/validators/video";
import { uploadToWalrus } from "@/lib/walrus/upload";
import type { WalrusUploadResult } from "@/types/walrus";

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  videoResult: WalrusUploadResult | null;
  thumbnailResult: WalrusUploadResult | null;
}

export function useWalrusUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    videoResult: null,
    thumbnailResult: null,
  });

  const upload = async (videoFile: File, thumbnailFile: File) => {
    setState({
      isUploading: true,
      progress: 0,
      error: null,
      videoResult: null,
      thumbnailResult: null,
    });

    try {
      // 動画形式のバリデーション
      if (!validateVideoFormat(videoFile)) {
        throw new Error(
          "動画ファイルは MP4, WebM, または Ogg 形式である必要があります",
        );
      }

      // サムネイル形式のバリデーション
      if (!validateImageFormat(thumbnailFile)) {
        throw new Error(
          "サムネイル画像は JPEG, PNG, または WebP 形式である必要があります",
        );
      }

      // 動画の長さをチェック
      await validateVideoDuration(videoFile);

      setState((prev) => ({ ...prev, progress: 10 }));

      // 動画をアップロード
      const videoResult = await uploadToWalrus(videoFile, (percentage) => {
        setState((prev) => ({ ...prev, progress: 10 + percentage * 0.4 }));
      });

      setState((prev) => ({ ...prev, progress: 50, videoResult }));

      // サムネイルをアップロード
      const thumbnailResult = await uploadToWalrus(
        thumbnailFile,
        (percentage) => {
          setState((prev) => ({ ...prev, progress: 50 + percentage * 0.5 }));
        },
      );

      setState({
        isUploading: false,
        progress: 100,
        error: null,
        videoResult,
        thumbnailResult,
      });

      return { videoResult, thumbnailResult };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "アップロードに失敗しました";

      setState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        videoResult: null,
        thumbnailResult: null,
      });

      throw error;
    }
  };

  const reset = () => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      videoResult: null,
      thumbnailResult: null,
    });
  };

  return {
    ...state,
    upload,
    reset,
  };
}
