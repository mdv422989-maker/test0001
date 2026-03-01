"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense, CATEGORIES, CATEGORY_COLORS, ExpenseCategory } from "@/types";
import { getExpensesByMonth } from "@/lib/firestore";
import { USERS } from "@/lib/users";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
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
      console.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalAmount = expenses.reduce((sum, e) => sum + e.totalAmount, 0);

  // Category breakdown
  const categoryData = CATEGORIES.map((cat) => ({
    name: cat,
    value: expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.totalAmount, 0),
    color: CATEGORY_COLORS[cat],
  })).filter((d) => d.value > 0);

  // Payer breakdown
  const payerData = USERS.map((user) => ({
    name: user,
    value: expenses
      .filter((e) => e.paidBy === user)
      .reduce((sum, e) => sum + e.totalAmount, 0),
  }));

  // Daily totals for bar chart
  const dailyData: Record<string, number> = {};
  expenses.forEach((e) => {
    const day = parseInt(e.date.split("-")[2]);
    dailyData[day] = (dailyData[day] || 0) + e.totalAmount;
  });
  const dailyChartData = Object.entries(dailyData)
    .map(([day, amount]) => ({ day: `${day}日`, amount }))
    .sort((a, b) => parseInt(a.day) - parseInt(b.day));

  // Top spending items
  const itemTotals: Record<string, number> = {};
  expenses.forEach((e) =>
    e.items.forEach((item) => {
      const key = item.name || "不明";
      itemTotals[key] = (itemTotals[key] || 0) + item.price * item.quantity;
    })
  );
  const topItems = Object.entries(itemTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

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
      <h1 className="text-2xl font-bold text-gray-900">分析</h1>

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
          {/* Total */}
          <div className="card text-center">
            <p className="text-sm text-gray-500">月間合計</p>
            <p className="text-3xl font-bold text-gray-900">
              ¥{totalAmount.toLocaleString()}
            </p>
          </div>

          {/* Category Pie Chart */}
          <div className="card">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              カテゴリ別支出
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `¥${value.toLocaleString()}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-auto font-medium">
                    ¥{cat.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payer Breakdown */}
          <div className="card">
            <h2 className="text-base font-bold text-gray-900 mb-3">
              支払者別
            </h2>
            <div className="space-y-3">
              {payerData.map((payer) => (
                <div key={payer.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{payer.name}</span>
                    <span className="font-medium">
                      ¥{payer.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${
                          totalAmount > 0
                            ? (payer.value / totalAmount) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Bar Chart */}
          {dailyChartData.length > 0 && (
            <div className="card">
              <h2 className="text-base font-bold text-gray-900 mb-3">
                日別支出
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: number) =>
                      `¥${value.toLocaleString()}`
                    }
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Items */}
          {topItems.length > 0 && (
            <div className="card">
              <h2 className="text-base font-bold text-gray-900 mb-3">
                支出額トップ10
              </h2>
              <div className="space-y-2">
                {topItems.map(([name, amount], index) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-5 text-gray-400 font-medium">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate">{name}</span>
                    <span className="font-medium">
                      ¥{amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
