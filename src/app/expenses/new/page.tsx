"use client";

import { useRouter } from "next/navigation";
import { addExpense } from "@/lib/firestore";
import { Expense } from "@/types";
import ExpenseForm from "@/components/ExpenseForm";

export default function NewExpensePage() {
  const router = useRouter();

  const handleSubmit = async (
    data: Omit<Expense, "id" | "createdAt" | "updatedAt">
  ) => {
    await addExpense(data);
    router.push("/expenses");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">支出を登録</h1>
      <ExpenseForm onSubmit={handleSubmit} />
    </div>
  );
}
