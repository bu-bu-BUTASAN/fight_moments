/**
 * Custom hook for Walrus upload
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
      // Validate video format
      if (!validateVideoFormat(videoFile)) {
        throw new Error(
          "Video file must be in MP4, WebM, or Ogg format",
        );
      }

      // Validate thumbnail format
      if (!validateImageFormat(thumbnailFile)) {
        throw new Error(
          "Thumbnail image must be in JPEG, PNG, or WebP format",
        );
      }

      // Check video duration
      await validateVideoDuration(videoFile);

      setState((prev) => ({ ...prev, progress: 10 }));

      // Upload video
      const videoResult = await uploadToWalrus(videoFile, (percentage) => {
        setState((prev) => ({ ...prev, progress: 10 + percentage * 0.4 }));
      });

      setState((prev) => ({ ...prev, progress: 50, videoResult }));

      // Upload thumbnail
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
        error instanceof Error ? error.message : "Upload failed";

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
