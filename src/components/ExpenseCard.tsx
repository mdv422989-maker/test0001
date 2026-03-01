"use client";

import { Expense, CATEGORY_COLORS, ExpenseCategory } from "@/types";

interface ExpenseCardProps {
  expense: Expense;
  onDelete?: (id: string) => void;
}

export default function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  const categoryColor =
    CATEGORY_COLORS[expense.category as ExpenseCategory] || "#6b7280";

  return (
    <div className="card flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ backgroundColor: categoryColor }}
      >
        {expense.category.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm truncate">
            {expense.store || expense.items[0]?.name || "不明"}
          </p>
          <p className="font-bold text-base shrink-0 ml-2">
            ¥{expense.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{expense.date}</span>
            <span
              className="px-1.5 py-0.5 rounded-full text-white text-[10px]"
              style={{ backgroundColor: categoryColor }}
            >
              {expense.category}
            </span>
          </div>
          <span className="text-xs text-gray-500">{expense.paidBy}</span>
        </div>
        {expense.items.length > 0 && (
          <p className="text-xs text-gray-400 mt-1 truncate">
            {expense.items.map((item) => item.name).join(", ")}
          </p>
        )}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(expense.id)}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0 ml-1"
          title="削除"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
