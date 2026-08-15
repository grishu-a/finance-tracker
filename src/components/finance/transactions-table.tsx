import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/finance-utils";
import type { BankAccount, Transaction } from "@/types/finance";

const CATEGORY_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  Income: "secondary",
  Transfers: "outline",
};

export function TransactionsTable({
  transactions,
  accounts,
}: {
  transactions: Transaction[];
  accounts: BankAccount[];
}) {
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {new Date(t.date).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })}
            </TableCell>
            <TableCell className="font-medium">{t.merchant}</TableCell>
            <TableCell className="text-muted-foreground">{accountName(t.accountId)}</TableCell>
            <TableCell>
              <Badge variant={CATEGORY_VARIANT[t.category] ?? "outline"}>{t.category}</Badge>
            </TableCell>
            <TableCell
              className={
                "text-right tabular-nums " +
                (t.direction === "credit" ? "text-[#006300] dark:text-[#0ca30c]" : "text-foreground")
              }
            >
              {t.direction === "credit" ? "+" : "−"}
              {formatCurrency(t.amount)}
            </TableCell>
          </TableRow>
        ))}
        {transactions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
              No transactions found.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
