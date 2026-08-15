import type { PaymentMethod } from "@/types/ledger";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "digital_wallet", label: "Digital Wallet / UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label]),
) as Record<PaymentMethod, string>;

// "Unusual spending" deviation vs. the 3-month category average. PRD leaves
// this unspecified (open question in section 6) — 25% is a reasonable
// starting default and lives in one place so it's easy to tune later.
export const CATEGORY_DEVIATION_THRESHOLD = 0.25;
