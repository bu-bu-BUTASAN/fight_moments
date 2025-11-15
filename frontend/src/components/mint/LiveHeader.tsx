"use client";

import { useEffect, useState } from "react";

export function LiveHeader() {
  const [viewerCount, setViewerCount] = useState(1234);
  const [elapsedTime, setElapsedTime] = useState(932); // 15:32 in seconds
  const [isLiveDotVisible, setIsLiveDotVisible] = useState(true);

  // LIVE dot blinking animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLiveDotVisible((prev) => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Viewer count increment animation
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* LIVE Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full bg-white transition-opacity duration-300 ${
                isLiveDotVisible ? "opacity-100" : "opacity-30"
              }`}
            />
            <span className="font-bold text-lg">LIVE NOW</span>
          </div>
          <div className="hidden sm:block h-6 w-px bg-white/30" />
          <span className="hidden sm:block text-sm font-medium">
            ONE Championship - Fight Night
          </span>
        </div>

        {/* Viewer Count & Elapsed Time */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <title>Viewers</title>
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">
              {viewerCount.toLocaleString()}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Time</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-mono font-semibold">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
