import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Expense } from "@/types";

const COLLECTION_NAME = "expenses";

export async function addExpense(
  expense: Omit<Expense, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Date.now();
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...expense,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateExpense(
  id: string,
  expense: Partial<Omit<Expense, "id" | "createdAt">>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...expense,
    updatedAt: Date.now(),
  });
}

export async function deleteExpense(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

export async function getExpenses(): Promise<Expense[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Expense[];
}

export async function getExpensesByMonth(
  year: number,
  month: number
): Promise<Expense[]> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const q = query(
    collection(db, COLLECTION_NAME),
    where("date", ">=", startDate),
    where("date", "<", endDate),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Expense[];
}

export async function searchExpenses(keyword: string): Promise<Expense[]> {
  const allExpenses = await getExpenses();
  const lowerKeyword = keyword.toLowerCase();
  return allExpenses.filter(
    (expense) =>
      expense.store.toLowerCase().includes(lowerKeyword) ||
      expense.note.toLowerCase().includes(lowerKeyword) ||
      expense.category.toLowerCase().includes(lowerKeyword) ||
      expense.items.some((item) =>
        item.name.toLowerCase().includes(lowerKeyword)
      )
  );
}
