import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

interface ExportRequestItem {
  name: string;
  price: number;
  quantity: number;
}

interface ExportRequestExpense {
  date: string;
  store: string;
  category: string;
  items: ExportRequestItem[];
  totalAmount: number;
  paidBy: string;
  note: string;
}

export async function POST(request: NextRequest) {
  try {
    const { expenses }: { expenses: ExportRequestExpense[] } = await request.json();

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

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "支出一覧");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="kakeibo_${
          new Date().toISOString().split("T")[0]
        }.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "エクスポートに失敗しました" },
      { status: 500 }
    );
  }
}
