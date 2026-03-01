"use client";

import { useState, useEffect, useCallback } from "react";
import { Expense } from "@/types";
import { getExpenses, searchExpenses, deleteExpense } from "@/lib/firestore";
import { exportToExcel } from "@/lib/export";
import ExpenseCard from "@/components/ExpenseCard";
import { IoSearchOutline, IoDownloadOutline, IoFunnelOutline } from "react-icons/io5";
import { CATEGORIES } from "@/types";
import { USERS } from "@/lib/users";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPayer, setFilterPayer] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  useEffect(() => {
    loadExpenses();
  }, []);

  const applyFilters = useCallback(
    (data: Expense[]) => {
      let result = data;

      if (filterCategory) {
        result = result.filter((e) => e.category === filterCategory);
      }
      if (filterPayer) {
        result = result.filter((e) => e.paidBy === filterPayer);
      }
      if (filterMonth) {
        result = result.filter((e) => e.date.startsWith(filterMonth));
      }

      setFilteredExpenses(result);
    },
    [filterCategory, filterPayer, filterMonth]
  );

  useEffect(() => {
    applyFilters(expenses);
  }, [expenses, applyFilters]);

  const loadExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch {
      console.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      applyFilters(expenses);
      return;
    }
    setLoading(true);
    try {
      const results = await searchExpenses(searchQuery);
      applyFilters(results);
    } catch {
      console.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この支出を削除しますか？")) return;
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert("削除に失敗しました");
    }
  };

  const handleExport = () => {
    const dateStr = new Date().toISOString().split("T")[0];
    exportToExcel(filteredExpenses, `家計簿_${dateStr}`);
  };

  const totalFiltered = filteredExpenses.reduce(
    (sum, e) => sum + e.totalAmount,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">支出一覧</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-1 text-sm text-primary-600 font-medium"
        >
          <IoDownloadOutline />
          Excel出力
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value.trim()) {
                applyFilters(expenses);
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="商品名・店舗名で検索..."
            className="input-field pl-9"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary px-3 ${
            showFilters ? "bg-primary-50 border-primary-300" : ""
          }`}
        >
          <IoFunnelOutline />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                カテゴリ
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">すべて</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                支払者
              </label>
              <select
                value={filterPayer}
                onChange={(e) => setFilterPayer(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">すべて</option>
                {USERS.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">月</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <button
            onClick={() => {
              setFilterCategory("");
              setFilterPayer("");
              setFilterMonth("");
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            フィルターをリセット
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{filteredExpenses.length}件</span>
        <span className="font-medium text-gray-900">
          合計: ¥{totalFiltered.toLocaleString()}
        </span>
      </div>

      {/* Expense List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>該当する支出がありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
