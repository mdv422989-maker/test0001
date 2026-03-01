"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense } from "@/types";
import { getExpensesByMonth } from "@/lib/firestore";
import { USERS } from "@/lib/users";

export default function SettlementPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpensesByMonth(year, month);
      setExpenses(data);
    } catch {
      console.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalAmount = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const fairShare = totalAmount / 2;

  const paidByUser: Record<string, number> = {};
  USERS.forEach((user) => {
    paidByUser[user] = expenses
      .filter((e) => e.paidBy === user)
      .reduce((sum, e) => sum + e.totalAmount, 0);
  });

  const user1Paid = paidByUser[USERS[0]] || 0;
  const user2Paid = paidByUser[USERS[1]] || 0;

  const difference = user1Paid - user2Paid;
  const settlementFrom = difference > 0 ? USERS[1] : USERS[0];
  const settlementTo = difference > 0 ? USERS[0] : USERS[1];
  const settlementAmount = Math.abs(difference) / 2;

  // Category breakdown per person
  const categoryBreakdown: Record<string, Record<string, number>> = {};
  expenses.forEach((e) => {
    if (!categoryBreakdown[e.category]) {
      categoryBreakdown[e.category] = {};
    }
    categoryBreakdown[e.category][e.paidBy] =
      (categoryBreakdown[e.category][e.paidBy] || 0) + e.totalAmount;
  });

  const prevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">精算</h1>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevMonth} className="btn-secondary px-3 py-1">
          &lt;
        </button>
        <span className="text-lg font-bold">
          {year}年{month}月
        </span>
        <button onClick={nextMonth} className="btn-secondary px-3 py-1">
          &gt;
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>この月のデータがありません</p>
        </div>
      ) : (
        <>
          {/* Settlement Result */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white shadow-lg">
            <p className="text-sm opacity-80 text-center">精算結果</p>
            {settlementAmount > 0 ? (
              <div className="text-center mt-3">
                <p className="text-sm opacity-90">
                  <span className="font-bold">{settlementFrom}</span> →{" "}
                  <span className="font-bold">{settlementTo}</span>
                </p>
                <p className="text-3xl font-bold mt-2">
                  ¥{Math.round(settlementAmount).toLocaleString()}
                </p>
                <p className="text-xs opacity-70 mt-2">
                  {settlementFrom}が{settlementTo}に支払う金額
                </p>
              </div>
            ) : (
              <p className="text-center text-lg font-bold mt-3">
                精算不要（支払い額が同じ）
              </p>
            )}
          </div>

          {/* Payment Summary */}
          <div className="card">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              支払い内訳
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-500">月間合計</span>
                <span className="font-bold text-lg">
                  ¥{totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-500">1人あたりの負担額</span>
                <span className="font-bold">
                  ¥{Math.round(fairShare).toLocaleString()}
                </span>
              </div>
              {USERS.map((user) => (
                <div key={user} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{user}の支払い額</span>
                    <span className="font-bold">
                      ¥{(paidByUser[user] || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>差額（負担額との差）</span>
                    <span
                      className={
                        (paidByUser[user] || 0) - fairShare >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {(paidByUser[user] || 0) - fairShare >= 0 ? "+" : ""}
                      ¥{Math.round(
                        (paidByUser[user] || 0) - fairShare
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              カテゴリ別支払い
            </h2>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr,auto,auto] gap-2 text-xs text-gray-500 border-b pb-2">
                <span>カテゴリ</span>
                {USERS.map((user) => (
                  <span key={user} className="text-right w-20">
                    {user}
                  </span>
                ))}
              </div>
              {Object.entries(categoryBreakdown)
                .sort(
                  ([, a], [, b]) =>
                    Object.values(b).reduce((s, v) => s + v, 0) -
                    Object.values(a).reduce((s, v) => s + v, 0)
                )
                .map(([category, data]) => (
                  <div
                    key={category}
                    className="grid grid-cols-[1fr,auto,auto] gap-2 text-sm"
                  >
                    <span>{category}</span>
                    {USERS.map((user) => (
                      <span
                        key={user}
                        className="text-right font-medium w-20"
                      >
                        ¥{(data[user] || 0).toLocaleString()}
                      </span>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
