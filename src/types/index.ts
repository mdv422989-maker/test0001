export interface ExpenseItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Expense {
  id: string;
  date: string;
  items: ExpenseItem[];
  totalAmount: number;
  paidBy: string;
  category: string;
  store: string;
  note: string;
  receiptImageUrl: string;
  createdAt: number;
  updatedAt: number;
}

export type ExpenseCategory =
  | "食費"
  | "日用品"
  | "交通費"
  | "光熱費"
  | "通信費"
  | "医療費"
  | "娯楽"
  | "衣服"
  | "教育"
  | "住居"
  | "保険"
  | "その他";

export const CATEGORIES: ExpenseCategory[] = [
  "食費",
  "日用品",
  "交通費",
  "光熱費",
  "通信費",
  "医療費",
  "娯楽",
  "衣服",
  "教育",
  "住居",
  "保険",
  "その他",
];

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  食費: "#ef4444",
  日用品: "#f97316",
  交通費: "#eab308",
  光熱費: "#22c55e",
  通信費: "#06b6d4",
  医療費: "#3b82f6",
  娯楽: "#8b5cf6",
  衣服: "#ec4899",
  教育: "#14b8a6",
  住居: "#6366f1",
  保険: "#a855f7",
  その他: "#6b7280",
};

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface MonthlyStats {
  month: string;
  total: number;
  byCategory: Record<string, number>;
  byPayer: Record<string, number>;
}
