"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionsTable } from "@/components/finance/transactions-table";
import type { BankAccount, Transaction, TransactionCategory } from "@/types/finance";

const ALL = "all";

export function TransactionsExplorer({
  transactions,
  accounts,
}: {
  transactions: Transaction[];
  accounts: BankAccount[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [accountId, setAccountId] = useState<string>(ALL);

  const categories = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.category))).sort() as TransactionCategory[],
    [transactions],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (category !== ALL && t.category !== category) return false;
      if (accountId !== ALL && t.accountId !== accountId) return false;
      if (q && !t.merchant.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [transactions, search, category, accountId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search merchant or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={category} onValueChange={(v) => setCategory(v ?? ALL)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={accountId} onValueChange={(v) => setAccountId(v ?? ALL)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Account">
              {(value: string | null) =>
                value === ALL || value === null ? "All accounts" : accounts.find((a) => a.id === value)?.name
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground">
        {filtered.length} transaction{filtered.length === 1 ? "" : "s"}
      </p>
      <TransactionsTable transactions={filtered} accounts={accounts} />
    </div>
  );
}
