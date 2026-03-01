import * as XLSX from "xlsx";
import { Expense } from "@/types";

export function exportToExcel(expenses: Expense[], filename: string): void {
  const rows = expenses.flatMap((expense) =>
    expense.items.map((item) => ({
      日付: expense.date,
      店舗: expense.store,
      カテゴリ: expense.category,
      商品名: item.name,
      単価: item.price,
      数量: item.quantity,
      小計: item.price * item.quantity,
      合計金額: expense.totalAmount,
      支払者: expense.paidBy,
      メモ: expense.note,
    }))
  );

  if (rows.length === 0) {
    const emptyRow = {
      日付: "",
      店舗: "",
      カテゴリ: "",
      商品名: "",
      単価: 0,
      数量: 0,
      小計: 0,
      合計金額: 0,
      支払者: "",
      メモ: "",
    };
    rows.push(emptyRow);
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const colWidths = [
    { wch: 12 }, // 日付
    { wch: 20 }, // 店舗
    { wch: 10 }, // カテゴリ
    { wch: 25 }, // 商品名
    { wch: 10 }, // 単価
    { wch: 8 },  // 数量
    { wch: 10 }, // 小計
    { wch: 12 }, // 合計金額
    { wch: 12 }, // 支払者
    { wch: 20 }, // メモ
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "支出一覧");

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
