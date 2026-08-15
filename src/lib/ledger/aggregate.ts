import type { LedgerTransaction, PaymentMethod } from "@/types/ledger";
import { PAYMENT_METHOD_LABEL } from "@/lib/ledger/constants";

export interface MonthSnapshot {
  income: number;
  expenses: number;
  categoryTotals: Record<string, number>;
}

/** Only a user's own logged transactions count toward their personal
 * income/expense totals — participating in someone else's shared expense
 * affects Balances, not this month's spend (see PRD 4.1 vs 4.8). */
export function ownTransactionsOnly(transactions: LedgerTransaction[]) {
  return transactions.filter((t) => t.isOwn);
}

export function getMonthSnapshot(ownTransactions: LedgerTransaction[]): MonthSnapshot {
  const snapshot: MonthSnapshot = { income: 0, expenses: 0, categoryTotals: {} };

  for (const t of ownTransactions) {
    if (t.type === "income") {
      snapshot.income += t.amount;
    } else {
      snapshot.expenses += t.amount;
      snapshot.categoryTotals[t.categoryName] = (snapshot.categoryTotals[t.categoryName] ?? 0) + t.amount;
    }
  }

  snapshot.income = round2(snapshot.income);
  snapshot.expenses = round2(snapshot.expenses);
  for (const k of Object.keys(snapshot.categoryTotals)) {
    snapshot.categoryTotals[k] = round2(snapshot.categoryTotals[k]);
  }

  return snapshot;
}

export function getCategoryBreakdown(ownTransactions: LedgerTransaction[]) {
  const totals = new Map<string, number>();
  for (const t of ownTransactions) {
    if (t.type !== "expense") continue;
    totals.set(t.categoryName, (totals.get(t.categoryName) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

export function getPaymentMethodBreakdown(ownTransactions: LedgerTransaction[]) {
  const totals = new Map<PaymentMethod, number>();
  for (const t of ownTransactions) {
    if (t.type !== "expense") continue;
    totals.set(t.paymentMethod, (totals.get(t.paymentMethod) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .map(([method, amount]) => ({ method, label: PAYMENT_METHOD_LABEL[method], amount: round2(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
