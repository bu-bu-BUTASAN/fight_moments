"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime: number; // Unix timestamp in milliseconds
}

export function CountdownTimer({ endTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Color coding based on remaining time
  const getColorClass = (): string => {
    const minutesLeft = Math.floor(timeLeft / 60000);
    if (minutesLeft > 10) return "text-gray-300 bg-gray-700 border-gray-600";
    if (minutesLeft > 5) return "text-red-300 bg-red-950 border-red-800";
    return "text-red-400 bg-red-950 border-red-600 animate-pulse";
  };

  if (timeLeft <= 0) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-gray-500 bg-gray-800 border border-gray-700">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <title>Ended</title>
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <span>終了</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${getColorClass()}`}
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <title>Timer</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
}
