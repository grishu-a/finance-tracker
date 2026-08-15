import type { Transaction, TransactionCategory } from "@/types/finance";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function monthKey(date: string) {
  return date.slice(0, 7); // YYYY-MM
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-AU", {
    month: "short",
  });
}

export interface MonthlyTotal {
  key: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

/** Income vs expenses per calendar month, oldest first. Transfers are excluded
 * so moving money between your own accounts never shows up as income/spend. */
export function getMonthlyTotals(transactions: Transaction[], months = 6): MonthlyTotal[] {
  const byMonth = new Map<string, { income: number; expenses: number }>();

  for (const t of transactions) {
    if (t.category === "Transfers") continue;
    const key = monthKey(t.date);
    const entry = byMonth.get(key) ?? { income: 0, expenses: 0 };
    if (t.direction === "credit") entry.income += t.amount;
    else entry.expenses += t.amount;
    byMonth.set(key, entry);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-months)
    .map(([key, { income, expenses }]) => ({
      key,
      label: monthLabel(key),
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      net: Math.round((income - expenses) * 100) / 100,
    }));
}

export interface CategoryTotal {
  category: TransactionCategory;
  amount: number;
}

/** Spend by category within the given month key ("YYYY-MM"), excluding
 * Income and Transfers, sorted highest spend first. */
export function getCategoryBreakdown(transactions: Transaction[], monthKeyFilter?: string): CategoryTotal[] {
  const totals = new Map<TransactionCategory, number>();

  for (const t of transactions) {
    if (t.direction !== "debit") continue;
    if (t.category === "Transfers") continue;
    if (monthKeyFilter && monthKey(t.date) !== monthKeyFilter) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => b.amount - a.amount);
}

export function currentMonthKey() {
  return monthKey(new Date().toISOString().slice(0, 10));
}
