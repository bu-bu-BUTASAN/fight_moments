"use client";

import { useEffect, useRef } from "react";

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

export function VideoPreviewModal({
  isOpen,
  onClose,
  videoUrl,
  title,
}: VideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* 背景クリックで閉じる */}
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* モーダルコンテンツ */}
      <div className="relative z-10 w-full max-w-5xl mx-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
            aria-label="Close"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Close</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ビデオプレイヤー */}
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-red-500">
          <video
            ref={videoRef}
            className="w-full"
            controls
            controlsList="nodownload"
            onEnded={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
              }
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            <track kind="captions" />
            お使いのブラウザはビデオタグをサポートしていません。
          </video>
        </div>

        {/* 操作ヒント */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            ESCキーまたは背景をクリックして閉じる
          </p>
        </div>
      </div>
    </div>
  );
}
