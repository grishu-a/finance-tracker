import type { BankAccount, Transaction, TransactionCategory } from "@/types/finance";

// Deterministic PRNG (mulberry32) so mock data is stable across server/client
// renders instead of drifting on every reload like Math.random() would.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260815);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rng() * arr.length)];
const between = (min: number, max: number) => min + rng() * (max - min);

export const EVERYDAY_ACCOUNT_ID = "acc_everyday";
export const SAVINGS_ACCOUNT_ID = "acc_savings";

export const mockAccounts: BankAccount[] = [
  {
    id: EVERYDAY_ACCOUNT_ID,
    institution: "Commonwealth Bank",
    name: "Everyday Account",
    type: "transaction",
    accountNumberMask: "**** 4471",
    balance: 0, // computed below from transactions
    currency: "AUD",
  },
  {
    id: SAVINGS_ACCOUNT_ID,
    institution: "Commonwealth Bank",
    name: "NetSaver",
    type: "savings",
    accountNumberMask: "**** 8823",
    balance: 0,
    currency: "AUD",
  },
];

const MERCHANTS: Record<Exclude<TransactionCategory, "Income" | "Transfers">, string[]> = {
  Groceries: ["Woolworths", "Coles", "Aldi", "IGA"],
  Dining: ["Guzman y Gomez", "UberEats", "Menulog", "The Coffee Club", "Grill'd"],
  Transport: ["Opal Auto Top-up", "Uber", "BP Fuel", "Shell Coles Express"],
  Housing: ["Weekly Rent - RealEstate PM", "Body Corporate Fees"],
  Utilities: ["AGL Energy", "Origin Energy", "Telstra", "Optus", "Sydney Water"],
  Subscriptions: ["Netflix", "Spotify", "Amazon Prime", "Disney+", "iCloud Storage"],
  Shopping: ["Kmart", "JB Hi-Fi", "Bunnings Warehouse", "Amazon AU", "Chemist Warehouse"],
  Health: ["Chemist Warehouse", "Fitness First", "Medicare Rebate", "Dental Care Clinic"],
  Entertainment: ["Event Cinemas", "Ticketek", "Steam", "PlayStation Store"],
  Other: ["ATM Withdrawal", "Bank Fee", "eBay"],
};

const CATEGORY_WEIGHTS: Record<keyof typeof MERCHANTS, [number, number]> = {
  Groceries: [40, 160],
  Dining: [12, 65],
  Transport: [10, 90],
  Housing: [450, 480],
  Utilities: [40, 180],
  Subscriptions: [4, 25],
  Shopping: [15, 220],
  Health: [10, 120],
  Entertainment: [15, 90],
  Other: [5, 100],
};

// Roughly how many debit transactions to generate per category, per month.
const MONTHLY_FREQUENCY: Record<keyof typeof MERCHANTS, number> = {
  Groceries: 8,
  Dining: 7,
  Transport: 6,
  Housing: 1,
  Utilities: 3,
  Subscriptions: 4,
  Shopping: 4,
  Health: 2,
  Entertainment: 2,
  Other: 1,
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function generateTransactions(): Transaction[] {
  const txns: Transaction[] = [];
  let idCounter = 1;
  const nextId = () => `txn_${String(idCounter++).padStart(4, "0")}`;

  const today = new Date();
  const monthsBack = 6;
  const start = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);

  // Fortnightly salary into the everyday account.
  const salaryDate = new Date(start);
  salaryDate.setDate(1);
  while (salaryDate <= today) {
    txns.push({
      id: nextId(),
      accountId: EVERYDAY_ACCOUNT_ID,
      date: isoDate(salaryDate),
      description: "SALARY ACME CORP PTY LTD",
      merchant: "Acme Corp Pty Ltd",
      amount: Math.round(between(3050, 3350) * 100) / 100,
      direction: "credit",
      category: "Income",
    });
    salaryDate.setDate(salaryDate.getDate() + 14);
  }

  // Category spending, walked month by month so amounts stay seasonally flat.
  for (let m = 0; m <= monthsBack; m++) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - monthsBack + m, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - monthsBack + m + 1, 0);
    const lastDay = monthEnd > today ? today.getDate() : monthEnd.getDate();
    if (lastDay < 1) continue;

    (Object.keys(MERCHANTS) as (keyof typeof MERCHANTS)[]).forEach((category) => {
      const count = MONTHLY_FREQUENCY[category];
      const [min, max] = CATEGORY_WEIGHTS[category];
      for (let i = 0; i < count; i++) {
        const day = Math.max(1, Math.floor(between(1, lastDay + 1)));
        const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
        if (date > today) continue;
        const merchant = pick(MERCHANTS[category]);
        txns.push({
          id: nextId(),
          accountId: EVERYDAY_ACCOUNT_ID,
          date: isoDate(date),
          description: merchant.toUpperCase(),
          merchant,
          amount: Math.round(between(min, max) * 100) / 100,
          direction: "debit",
          category,
        });
      }
    });

    // Monthly transfer into savings.
    const transferDay = Math.min(28, lastDay);
    const transferDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), transferDay);
    if (transferDate <= today) {
      const transferAmount = Math.round(between(300, 600) * 100) / 100;
      txns.push({
        id: nextId(),
        accountId: EVERYDAY_ACCOUNT_ID,
        date: isoDate(transferDate),
        description: "TRANSFER TO NETSAVER",
        merchant: "Transfer to Savings",
        amount: transferAmount,
        direction: "debit",
        category: "Transfers",
      });
      txns.push({
        id: nextId(),
        accountId: SAVINGS_ACCOUNT_ID,
        date: isoDate(transferDate),
        description: "TRANSFER FROM EVERYDAY",
        merchant: "Transfer from Everyday",
        amount: transferAmount,
        direction: "credit",
        category: "Transfers",
      });
    }
  }

  return txns.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const mockTransactions: Transaction[] = generateTransactions();

// Seed opening balances, then let generated transactions carry accounts forward.
const OPENING_BALANCE: Record<string, number> = {
  [EVERYDAY_ACCOUNT_ID]: 1800,
  [SAVINGS_ACCOUNT_ID]: 6200,
};

for (const account of mockAccounts) {
  const net = mockTransactions
    .filter((t) => t.accountId === account.id)
    .reduce((sum, t) => sum + (t.direction === "credit" ? t.amount : -t.amount), 0);
  account.balance = Math.round((OPENING_BALANCE[account.id] + net) * 100) / 100;
}
