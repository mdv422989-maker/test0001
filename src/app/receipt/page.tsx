"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addExpense } from "@/lib/firestore";
import { Expense, ExpenseItem } from "@/types";
import ReceiptScanner from "@/components/ReceiptScanner";
import ExpenseForm from "@/components/ExpenseForm";

export default function ReceiptPage() {
  const router = useRouter();
  const [scannedData, setScannedData] = useState<{
    store: string;
    items: ExpenseItem[];
    date: string;
  } | null>(null);

  const handleScanComplete = (data: {
    store: string;
    items: ExpenseItem[];
    date: string;
  }) => {
    setScannedData(data);
  };

  const handleSubmit = async (
    data: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ) => {
    await addExpense(data);
    router.push("/expenses");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">レシート読み取り</h1>

      {!scannedData ? (
        <>
          <p className="text-sm text-gray-500">
            レシートを撮影または画像を選択して、自動で支出データを読み取ります。
          </p>
          <ReceiptScanner onScanComplete={handleScanComplete} />
        </>
      ) : (
        <>
          <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3">
            レシートの読み取りが完了しました。内容を確認・修正して登録してください。
          </div>
          <ExpenseForm
            initialData={{
              store: scannedData.store,
              items: scannedData.items,
              date: scannedData.date,
            }}
            onSubmit={handleSubmit}
            submitLabel="レシートから登録"
          />
          <button
            onClick={() => setScannedData(null)}
            className="btn-secondary w-full"
          >
            別のレシートを読み取る
          </button>
        </>
      )}
    </div>
  );
}
