"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState } from "react";
import { MomentRegistrationForm } from "@/components/admin/MomentRegistrationForm";
import { getSuiscanUrl } from "@/lib/constants";

export default function AdminPage() {
  const currentAccount = useCurrentAccount();
  const [successDigest, setSuccessDigest] = useState<string | null>(null);

  const handleReset = () => {
    setSuccessDigest(null);
  };

  if (!currentAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h1>
          <p className="text-gray-600">ウォレットを接続してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Fight Moments Admin Panel
          </h1>

          {successDigest ? (
            <div className="space-y-4">
              <div className="p-6 bg-green-50 border border-green-200 rounded-md">
                <h2 className="text-xl font-bold text-green-800 mb-2">
                  ✓ Moment が正常に登録されました！
                </h2>
                <p className="text-sm text-green-700 break-all">
                  Transaction Digest: {successDigest}
                </p>
                <a
                  href={getSuiscanUrl(successDigest)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                >
                  Suiscanで確認 →
                </a>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                新しい Moment を登録
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <MomentRegistrationForm onSuccess={setSuccessDigest} />
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              接続中のウォレット
            </h3>
            <p className="text-sm text-gray-600 font-mono">
              {currentAccount.address}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
