"use client";

import { useState } from "react";
import { Expense, ExpenseItem, CATEGORIES } from "@/types";
import { USERS } from "@/lib/users";

interface ExpenseFormProps {
  initialData?: Partial<Expense>;
  onSubmit: (data: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  submitLabel?: string;
}

export default function ExpenseForm({
  initialData,
  onSubmit,
  submitLabel = "登録する",
}: ExpenseFormProps) {
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [store, setStore] = useState(initialData?.store || "");
  const [category, setCategory] = useState(initialData?.category || "食費");
  const [paidBy, setPaidBy] = useState(initialData?.paidBy || USERS[0]);
  const [note, setNote] = useState(initialData?.note || "");
  const [items, setItems] = useState<ExpenseItem[]>(
    initialData?.items || [{ name: "", price: 0, quantity: 1 }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const addItem = () => {
    setItems([...items, { name: "", price: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (
    index: number,
    field: keyof ExpenseItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validItems = items.filter((item) => item.name && item.price > 0);
    if (validItems.length === 0) {
      alert("少なくとも1つの商品を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        date,
        store,
        category,
        paidBy,
        note,
        items: validItems,
        totalAmount: validItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        receiptImageUrl: initialData?.receiptImageUrl || "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          日付
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          店舗名
        </label>
        <input
          type="text"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="input-field"
          placeholder="例: スーパー山田"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            カテゴリ
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            支払者
          </label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="input-field"
          >
            {USERS.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            商品明細
          </label>
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            + 追加
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(index, "name", e.target.value)}
                className="input-field flex-1"
                placeholder="商品名"
              />
              <input
                type="number"
                value={item.price || ""}
                onChange={(e) =>
                  updateItem(index, "price", parseInt(e.target.value) || 0)
                }
                className="input-field w-24"
                placeholder="金額"
                min="0"
              />
              <input
                type="number"
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", parseInt(e.target.value) || 1)
                }
                className="input-field w-16"
                placeholder="数量"
                min="1"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-gray-400 hover:text-red-500 mt-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 text-right">
        <span className="text-sm text-gray-500">合計: </span>
        <span className="text-xl font-bold text-gray-900">
          ¥{totalAmount.toLocaleString()}
        </span>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メモ
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input-field"
          rows={2}
          placeholder="メモ（任意）"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full py-3 text-lg"
      >
        {isSubmitting ? "送信中..." : submitLabel}
      </button>
    </form>
  );
}
