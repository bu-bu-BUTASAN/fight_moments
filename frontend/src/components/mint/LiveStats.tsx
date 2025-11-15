"use client";

import { useEffect, useState } from "react";

interface LiveStatsProps {
  totalMoments?: number;
}

// ダミーの最新Mint情報
const recentMints = [
  { fighter: "Takeru vs Rodtang", serial: "#3/10", time: "2秒前" },
  { fighter: "Superbon vs Marat", serial: "#7/15", time: "5秒前" },
  { fighter: "Tawanchai vs Davit", serial: "#12/20", time: "8秒前" },
  { fighter: "Jonathan vs Fabricio", serial: "#5/10", time: "11秒前" },
  { fighter: "Stamp vs Phetjeeja", serial: "#9/12", time: "15秒前" },
];

export function LiveStats({ totalMoments = 0 }: LiveStatsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerCount, setViewerCount] = useState(1234);
  const [todayMints, setTodayMints] = useState(47);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ローテーション表示
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % 5);
        setIsTransitioning(false);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 視聴者数とMint数の増加
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => prev + Math.floor(Math.random() * 3));
      if (Math.random() > 0.7) {
        setTodayMints((prev) => prev + 1);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const currentMint = recentMints[currentIndex];

  return (
    <div className="bg-black border-t border-red-900 text-white px-6 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto">
        {/* リアルタイム情報ストリーム */}
        <div className="flex items-center justify-between">
          {/* 左: ローテーション情報 */}
          <div className="flex-1 min-w-0">
            <div
              className={`transition-all duration-300 ${
                isTransitioning
                  ? "opacity-0 translate-x-2"
                  : "opacity-100 translate-x-0"
              }`}
            >
              {currentIndex === 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-400">最新Mint</span>
                  </div>
                  <span className="text-lg font-bold text-red-400">
                    {currentMint.fighter}
                  </span>
                  <span className="text-sm text-gray-400">
                    {currentMint.serial} · {currentMint.time}
                  </span>
                </div>
              )}
              {currentIndex === 1 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <title>Viewers</title>
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-400">現在視聴中</span>
                  </div>
                  <span className="text-lg font-bold text-red-400">
                    {viewerCount.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400">人が視聴中</span>
                </div>
              )}
              {currentIndex === 2 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <title>Fire</title>
                      <path
                        fillRule="evenodd"
                        d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-400">本日のMint</span>
                  </div>
                  <span className="text-lg font-bold text-red-400">
                    {todayMints}
                  </span>
                  <span className="text-sm text-gray-400">
                    件のNFTがMint済み
                  </span>
                </div>
              )}
              {currentIndex === 3 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <title>Supply</title>
                      <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                      <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                      <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                    </svg>
                    <span className="text-sm text-gray-400">残りSupply</span>
                  </div>
                  <span className="text-lg font-bold text-red-400">
                    103/150
                  </span>
                  <span className="text-sm text-gray-400">早い者勝ち！</span>
                </div>
              )}
              {currentIndex === 4 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-red-500 animate-pulse"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <title>Alert</title>
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="text-sm text-gray-400">⚡ 緊急</span>
                  </div>
                  <span className="text-lg font-bold text-red-500">
                    {totalMoments}個のMoment
                  </span>
                  <span className="text-sm text-gray-400">
                    が今すぐMint可能！
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 右: 進捗インジケーター */}
          <div className="flex items-center gap-2 ml-4">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex ? "w-8 bg-red-500" : "w-1 bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
