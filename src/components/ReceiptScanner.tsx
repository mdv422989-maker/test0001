"use client";

import { useState, useRef } from "react";
import { ExpenseItem } from "@/types";
import { IoCameraOutline, IoCloudUploadOutline } from "react-icons/io5";

interface ReceiptScannerProps {
  onScanComplete: (data: {
    store: string;
    items: ExpenseItem[];
    date: string;
  }) => void;
}

export default function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsScanning(true);
    setError(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        throw new Error("OCR処理に失敗しました");
      }

      const data = await response.json();
      onScanComplete(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "レシートの読み取りに失敗しました"
      );
    } finally {
      setIsScanning(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="btn-secondary flex flex-col items-center gap-2 py-6"
          disabled={isScanning}
        >
          <IoCameraOutline className="text-3xl" />
          <span className="text-sm">カメラで撮影</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary flex flex-col items-center gap-2 py-6"
          disabled={isScanning}
        >
          <IoCloudUploadOutline className="text-3xl" />
          <span className="text-sm">画像を選択</span>
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {isScanning && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-500">
            レシートを読み取り中...
          </p>
        </div>
      )}

      {preview && !isScanning && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="レシートプレビュー"
            className="w-full rounded-lg border border-gray-200"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );
}
