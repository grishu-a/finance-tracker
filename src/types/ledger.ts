export type TransactionType = "income" | "expense";
export type PaymentMethod = "cash" | "card" | "digital_wallet" | "bank_transfer";

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Profile {
  id: string;
  displayName: string;
}

export interface LedgerTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  categoryName: string;
  paymentMethod: PaymentMethod;
  txnDate: string;
  note: string | null;
  isShared: boolean;
  isOwn: boolean;
  participants: { id: string; displayName: string; shareAmount: number }[];
}

export interface Settlement {
  id: string;
  payerId: string;
  payeeId: string;
  amount: number;
  note: string | null;
  settledAt: string;
}

export interface Nudge {
  id: string;
  message: string;
  severity: "info" | "warning";
}
