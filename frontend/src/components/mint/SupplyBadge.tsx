"use client";

interface SupplyBadgeProps {
  remaining: number;
  total: number;
}

export function SupplyBadge({ remaining, total }: SupplyBadgeProps) {
  const percentage = (remaining / total) * 100;

  // Color coding based on remaining supply
  const getColorClass = (): string => {
    if (percentage > 50) return "text-gray-300 bg-gray-700 border-gray-600";
    if (percentage > 20) return "text-red-300 bg-red-950 border-red-800";
    return "text-red-400 bg-red-950 border-red-600 ring-2 ring-red-600 ring-opacity-50";
  };

  const getIcon = () => {
    if (percentage <= 20) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <title>Alert</title>
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <title>Supply</title>
        <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
        <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
        <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
      </svg>
    );
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold border ${getColorClass()}`}
    >
      {getIcon()}
      <span>
        残り {remaining}/{total}
      </span>
      {percentage <= 20 && <span className="ml-1 animate-pulse">🔥</span>}
    </div>
  );
}
