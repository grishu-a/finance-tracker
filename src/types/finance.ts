export type AccountType = "transaction" | "savings" | "credit";

export interface BankAccount {
  id: string;
  institution: string;
  name: string;
  type: AccountType;
  accountNumberMask: string;
  balance: number;
  currency: "AUD";
}

export type TransactionCategory =
  | "Income"
  | "Groceries"
  | "Dining"
  | "Transport"
  | "Housing"
  | "Utilities"
  | "Subscriptions"
  | "Shopping"
  | "Health"
  | "Entertainment"
  | "Transfers"
  | "Other";

export type TransactionDirection = "credit" | "debit";

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  merchant: string;
  amount: number;
  direction: TransactionDirection;
  category: TransactionCategory;
  pending?: boolean;
}
