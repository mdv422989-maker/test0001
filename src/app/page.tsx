"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Expense } from "@/types";
import { getExpensesByMonth } from "@/lib/firestore";
import { USERS } from "@/lib/users";
import ExpenseCard from "@/components/ExpenseCard";
import {
  IoCameraOutline,
  IoAddOutline,
  IoDownloadOutline,
} from "react-icons/io5";

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const loadExpenses = useCallback(async () => {
    try {
      const data = await getExpensesByMonth(currentYear, currentMonth);
      setExpenses(data);
    } catch {
      console.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const totalThisMonth = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const byPayer = USERS.reduce(
    (acc, user) => ({
      ...acc,
      [user]: expenses
        .filter((e) => e.paidBy === user)
        .reduce((sum, e) => sum + e.totalAmount, 0),
    }),
    {} as Record<string, number>
  );

  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">家計簿</h1>
        <p className="text-sm text-gray-500">
          {currentYear}年{currentMonth}月
        </p>
      </div>

      {/* Monthly Summary Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-sm opacity-80">今月の支出</p>
        <p className="text-3xl font-bold mt-1">
          ¥{totalThisMonth.toLocaleString()}
        </p>
        <div className="flex gap-4 mt-4">
          {USERS.map((user) => (
            <div key={user} className="flex-1">
              <p className="text-xs opacity-70">{user}</p>
              <p className="text-lg font-semibold">
                ¥{(byPayer[user] || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/expenses/new"
          className="card flex flex-col items-center gap-2 py-4 hover:shadow-md transition-shadow"
        >
          <IoAddOutline className="text-2xl text-primary-600" />
          <span className="text-xs font-medium text-gray-600">手動入力</span>
        </Link>
        <Link
          href="/receipt"
          className="card flex flex-col items-center gap-2 py-4 hover:shadow-md transition-shadow"
        >
          <IoCameraOutline className="text-2xl text-primary-600" />
          <span className="text-xs font-medium text-gray-600">レシート</span>
        </Link>
        <Link
          href="/analytics"
          className="card flex flex-col items-center gap-2 py-4 hover:shadow-md transition-shadow"
        >
          <IoDownloadOutline className="text-2xl text-primary-600" />
          <span className="text-xs font-medium text-gray-600">分析</span>
        </Link>
      </div>

      {/* Recent Expenses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">最近の支出</h2>
          <Link
            href="/expenses"
            className="text-sm text-primary-600 font-medium"
          >
            すべて見る
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>まだ支出がありません</p>
            <Link
              href="/expenses/new"
              className="text-primary-600 font-medium mt-2 inline-block"
            >
              最初の支出を登録する
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentExpenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
