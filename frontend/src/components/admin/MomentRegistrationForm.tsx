"use client";

import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useState } from "react";
import { buildRegisterMomentTx } from "@/lib/sui/ptb";
import { MOMENT_TYPES } from "@/types/contract";
import type { WalrusUploadResult } from "@/types/walrus";

interface MomentRegistrationFormProps {
  videoResult: WalrusUploadResult;
  thumbnailResult: WalrusUploadResult;
  onSuccess: (digest: string) => void;
}

export function MomentRegistrationForm({
  videoResult,
  thumbnailResult,
  onSuccess,
}: MomentRegistrationFormProps) {
  const [formData, setFormData] = useState<{
    adminCapId: string;
    matchId: string;
    fighterA: string;
    fighterB: string;
    momentType: string;
    maxSupply: number;
  }>({
    adminCapId: "",
    matchId: "",
    fighterA: "",
    fighterB: "",
    momentType: MOMENT_TYPES.KO,
    maxSupply: 1000,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const tx = buildRegisterMomentTx({
        adminCapId: formData.adminCapId,
        matchId: formData.matchId,
        fighterA: formData.fighterA,
        fighterB: formData.fighterB,
        momentType: formData.momentType,
        videoWalrusUri: videoResult.uri,
        thumbnailWalrusUri: thumbnailResult.uri,
        blobId: videoResult.blobId,
        contentHash: videoResult.hash,
        maxSupply: formData.maxSupply,
      });

      signAndExecute(
        {
          transaction: tx as never,
        },
        {
          onSuccess: (result) => {
            console.log("Moment registered:", result.digest);
            onSuccess(result.digest);
            // フォームをリセット
            setFormData({
              adminCapId: "",
              matchId: "",
              fighterA: "",
              fighterB: "",
              momentType: MOMENT_TYPES.KO,
              maxSupply: 1000,
            });
            setIsSubmitting(false);
          },
          onError: (err) => {
            console.error("Transaction failed:", err);
            setError(err.message);
            setIsSubmitting(false);
          },
        },
      );
    } catch (err) {
      console.error("Failed to build transaction:", err);
      setError(
        err instanceof Error
          ? err.message
          : "トランザクションの構築に失敗しました",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Moment 登録</h2>

      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-sm text-green-700">
          ✓ 動画アップロード完了: {videoResult.blobId.substring(0, 16)}...
        </p>
        <p className="text-sm text-green-700">
          ✓ サムネイルアップロード完了:{" "}
          {thumbnailResult.blobId.substring(0, 16)}...
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="adminCapId"
            className="block text-sm font-medium text-gray-700"
          >
            Admin Cap ID
          </label>
          <input
            id="adminCapId"
            type="text"
            value={formData.adminCapId}
            onChange={(e) =>
              setFormData({ ...formData, adminCapId: e.target.value })
            }
            placeholder="0x..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="matchId"
            className="block text-sm font-medium text-gray-700"
          >
            Match ID
          </label>
          <input
            id="matchId"
            type="text"
            value={formData.matchId}
            onChange={(e) =>
              setFormData({ ...formData, matchId: e.target.value })
            }
            placeholder="UFC300-001"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="fighterA"
              className="block text-sm font-medium text-gray-700"
            >
              Fighter A
            </label>
            <input
              id="fighterA"
              type="text"
              value={formData.fighterA}
              onChange={(e) =>
                setFormData({ ...formData, fighterA: e.target.value })
              }
              placeholder="Fighter Name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="fighterB"
              className="block text-sm font-medium text-gray-700"
            >
              Fighter B
            </label>
            <input
              id="fighterB"
              type="text"
              value={formData.fighterB}
              onChange={(e) =>
                setFormData({ ...formData, fighterB: e.target.value })
              }
              placeholder="Fighter Name"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="momentType"
              className="block text-sm font-medium text-gray-700"
            >
              Moment Type
            </label>
            <select
              id="momentType"
              value={formData.momentType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  momentType: e.target.value,
                })
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={MOMENT_TYPES.KO}>KO</option>
              <option value={MOMENT_TYPES.SUBMISSION}>Submission</option>
              <option value={MOMENT_TYPES.DECISION}>Decision</option>
              <option value={MOMENT_TYPES.TKO}>TKO</option>
              <option value={MOMENT_TYPES.DRAW}>Draw</option>
              <option value={MOMENT_TYPES.HIGHLIGHT}>Highlight</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="maxSupply"
              className="block text-sm font-medium text-gray-700"
            >
              Max Supply
            </label>
            <input
              id="maxSupply"
              type="number"
              value={formData.maxSupply}
              onChange={(e) =>
                setFormData({ ...formData, maxSupply: Number(e.target.value) })
              }
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Sui トランザクションに失敗しました: {error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "登録中..." : "Moment を登録"}
        </button>
      </form>
    </div>
  );
}
