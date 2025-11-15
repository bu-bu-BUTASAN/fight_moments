/**
 * Video file validation
 */

import { MAX_VIDEO_DURATION_SECONDS } from "../constants";

/**
 * Check video duration
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
            `Video duration must be within ${MAX_VIDEO_DURATION_SECONDS} seconds`,
          ),
        );
      } else {
        resolve(true);
      }
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video file"));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Check video file format
 */
export function validateVideoFormat(file: File): boolean {
  const validFormats = ["video/mp4", "video/webm", "video/ogg"];
  return validFormats.includes(file.type);
}

/**
 * Check image file format
 */
export function validateImageFormat(file: File): boolean {
  const validFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  return validFormats.includes(file.type);
}
