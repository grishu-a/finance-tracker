import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionsExplorer } from "@/components/finance/transactions-explorer";
import { bankConnector } from "@/lib/bank-connector";

export default async function TransactionsPage() {
  const [accounts, transactions] = await Promise.all([
    bankConnector.getAccounts(),
    bankConnector.getTransactions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted-foreground">All accounts, last 6 months of dummy data.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionsExplorer transactions={transactions} accounts={accounts} />
        </CardContent>
      </Card>
    </div>
  );
}
