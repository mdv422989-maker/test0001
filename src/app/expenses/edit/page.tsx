"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getExpenseById, updateExpense } from "@/lib/firestore";
import { Expense, EditHistoryEntry } from "@/types";
import ExpenseForm from "@/components/ExpenseForm";

function EditExpenseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!id) {
      router.push("/expenses");
      return;
    }
    loadExpense(id);
  }, [id, router]);

  const loadExpense = async (expenseId: string) => {
    try {
      const data = await getExpenseById(expenseId);
      if (!data) {
        alert("支出データが見つかりませんでした");
        router.push("/expenses");
        return;
      }
      setExpense(data);
    } catch {
      alert("データの読み込みに失敗しました");
      router.push("/expenses");
    } finally {
      setLoading(false);
    }
  };

  const buildChangeSummary = (
    original: Expense,
    updated: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ): string => {
    const changes: string[] = [];
    if (original.date !== updated.date) changes.push("日付");
    if (original.store !== updated.store) changes.push("店舗名");
    if (original.category !== updated.category) changes.push("カテゴリ");
    if (original.paidBy !== updated.paidBy) changes.push("支払者");
    if (original.totalAmount !== updated.totalAmount) changes.push("金額");
    if (original.note !== updated.note) changes.push("メモ");
    if (JSON.stringify(original.items) !== JSON.stringify(updated.items))
      changes.push("商品明細");
    return changes.length > 0 ? changes.join("、") + "を変更" : "変更";
  };

  const handleSubmit = async (
    data: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!expense || !id) return;

    const historyEntry: EditHistoryEntry = {
      editedAt: Date.now(),
      changes: buildChangeSummary(expense, data),
      previousData: {
        date: expense.date,
        store: expense.store,
        category: expense.category,
        paidBy: expense.paidBy,
        items: expense.items,
        totalAmount: expense.totalAmount,
        note: expense.note,
      },
    };

    await updateExpense(id, data, historyEntry);
    router.push("/expenses");
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!expense) return null;

  const history = expense.editHistory || [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">支出を編集</h1>

      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            修正履歴を{showHistory ? "閉じる" : "表示"}（{history.length}件）
          </button>
          {showHistory && (
            <div className="mt-2 space-y-2">
              {[...history].reverse().map((entry, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-lg p-3 text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700">
                      {entry.changes}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(entry.editedAt).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    変更前: {entry.previousData.store && `${entry.previousData.store} / `}
                    {entry.previousData.category && `${entry.previousData.category} / `}
                    {entry.previousData.totalAmount !== undefined &&
                      `¥${entry.previousData.totalAmount.toLocaleString()}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ExpenseForm
        initialData={expense}
        onSubmit={handleSubmit}
        submitLabel="更新する"
      />
    </div>
  );
}

export default function EditExpensePage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      }
    >
      <EditExpenseContent />
    </Suspense>
  );
}
