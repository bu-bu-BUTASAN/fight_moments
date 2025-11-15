"use client";

import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import type { FormEvent } from "react";
import { useState } from "react";
import { useWalrusUpload } from "@/hooks/useWalrusUpload";
import { buildRegisterMomentTx } from "@/lib/sui/ptb";
import { MOMENT_TYPES } from "@/types/contract";
import type { WalrusUploadResult } from "@/types/walrus";

interface RegistrationFormData {
  adminCapId: string;
  matchId: string;
  fighterA: string;
  fighterB: string;
  momentType: string;
  maxSupply: number;
}

const ENV_ADMIN_CAP_ID = process.env.NEXT_PUBLIC_ADMIN_CAP_ID?.trim() ?? "";

const DEFAULT_FORM_DATA: RegistrationFormData = {
  adminCapId: ENV_ADMIN_CAP_ID,
  matchId: "",
  fighterA: "",
  fighterB: "",
  momentType: MOMENT_TYPES.KO,
  maxSupply: 1000,
};

interface MomentRegistrationFormProps {
  onSuccess: (digest: string) => void;
}

export function MomentRegistrationForm({
  onSuccess,
}: MomentRegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationFormData>(() => ({
    ...DEFAULT_FORM_DATA,
  }));
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const {
    isUploading,
    progress,
    upload,
    error: uploadError,
    reset: resetWalrusUpload,
  } = useWalrusUpload();

  const resetForm = () => {
    setFormData({
      ...DEFAULT_FORM_DATA,
    });
    setVideoFile(null);
    setThumbnailFile(null);
    resetWalrusUpload();
  };

  const handleMetadataChange = <K extends keyof RegistrationFormData>(
    field: K,
    value: RegistrationFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const buildTx = (
    metadata: RegistrationFormData,
    videoResult: WalrusUploadResult,
    thumbnailResult: WalrusUploadResult,
  ) =>
    buildRegisterMomentTx({
      adminCapId: metadata.adminCapId,
      matchId: metadata.matchId,
      fighterA: metadata.fighterA,
      fighterB: metadata.fighterB,
      momentType: metadata.momentType,
      maxSupply: metadata.maxSupply,
      videoBlobId: videoResult.blobId,
      thumbnailBlobId: thumbnailResult.blobId,
      contentHash: videoResult.hash, // Walrusから返されたhashを使用
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUploading || isRegistering) {
      return;
    }

    if (!videoFile || !thumbnailFile) {
      setFormError("動画とサムネイル画像の両方を選択してください");
      return;
    }

    setFormError(null);

    try {
      const { videoResult, thumbnailResult } = await upload(
        videoFile,
        thumbnailFile,
      );

      setIsRegistering(true);

      const tx = buildTx(formData, videoResult, thumbnailResult);

      signAndExecute(
        {
          transaction: tx as never,
        },
        {
          onSuccess: (result) => {
            onSuccess(result.digest);
            setIsRegistering(false);
            resetForm();
          },
          onError: (err) => {
            console.error("Transaction failed:", err);
            setFormError(
              err instanceof Error
                ? err.message
                : "トランザクション送信に失敗しました",
            );
            setIsRegistering(false);
          },
        },
      );
    } catch (uploadErr) {
      setFormError(
        uploadErr instanceof Error
          ? uploadErr.message
          : "Walrus アップロードに失敗しました",
      );
    }
  };

  const errorMessage = formError ?? uploadError;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Moment メタデータ</h2>
        <p className="text-sm text-gray-500">
          実行ボタンで Walrus への動画/サムネイルアップロードが走り、取得した
          blob ID を使って NFT 登録が行われます。
        </p>
        {!ENV_ADMIN_CAP_ID && (
          <div className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900">
            NEXT_PUBLIC_ADMIN_CAP_ID を設定してください（環境変数から Admin Cap
            ID を参照します）。
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            onChange={(event) =>
              handleMetadataChange("matchId", event.target.value)
            }
            placeholder="UFC300-001"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
              onChange={(event) =>
                handleMetadataChange("fighterA", event.target.value)
              }
              placeholder="Fighter Name"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
              onChange={(event) =>
                handleMetadataChange("fighterB", event.target.value)
              }
              placeholder="Fighter Name"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
              onChange={(event) =>
                handleMetadataChange("momentType", event.target.value)
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
              onChange={(event) => {
                const parsed = Number(event.target.value);
                handleMetadataChange(
                  "maxSupply",
                  Number.isNaN(parsed) ? 0 : parsed,
                );
              }}
              min={1}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="videoFile"
            className="block text-sm font-medium text-gray-700"
          >
            動画ファイル (MP4, WebM, Ogg - 30秒以内)
          </label>
          <input
            id="videoFile"
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
            disabled={isUploading || isRegistering}
            required
          />
          {videoFile && (
            <p className="mt-1 text-xs text-gray-600">
              選択中: {videoFile.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="thumbnailFile"
            className="block text-sm font-medium text-gray-700"
          >
            サムネイル画像 (JPEG, PNG, WebP)
          </label>
          <input
            id="thumbnailFile"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            onChange={(event) =>
              setThumbnailFile(event.target.files?.[0] ?? null)
            }
            disabled={isUploading || isRegistering}
            required
          />
          {thumbnailFile && (
            <p className="mt-1 text-xs text-gray-600">
              選択中: {thumbnailFile.name}
            </p>
          )}
        </div>

        {(isUploading || isRegistering) && (
          <div className="space-y-2">
            {isUploading && (
              <div>
                <div className="w-full rounded-full bg-gray-200 h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">
                  {Math.round(progress)}% (Walrus アップロード中)
                </p>
              </div>
            )}
            {isRegistering && (
              <p className="text-xs text-blue-700">
                トランザクション送信中です。ウォレットで承認を完了してください。
              </p>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || isRegistering}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRegistering ? "実行中..." : "実行"}
        </button>
      </form>
    </div>
  );
}
