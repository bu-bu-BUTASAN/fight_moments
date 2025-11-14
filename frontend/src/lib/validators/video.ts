/**
 * 動画ファイルのバリデーション
 */

import { MAX_VIDEO_DURATION_SECONDS } from "../constants";

/**
 * 動画の長さをチェックする
 */
export async function validateVideoDuration(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;

      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        reject(
          new Error(
            `動画の長さは${MAX_VIDEO_DURATION_SECONDS}秒以内である必要があります`,
          ),
        );
      } else {
        resolve(true);
      }
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error("動画ファイルの読み込みに失敗しました"));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * 動画ファイルの形式をチェックする
 */
export function validateVideoFormat(file: File): boolean {
  const validFormats = ["video/mp4", "video/webm", "video/ogg"];
  return validFormats.includes(file.type);
}

/**
 * 画像ファイルの形式をチェックする
 */
export function validateImageFormat(file: File): boolean {
  const validFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  return validFormats.includes(file.type);
}
