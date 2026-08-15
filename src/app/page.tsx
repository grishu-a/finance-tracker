import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/finance/stat-card";
import { SpendingByCategoryChart } from "@/components/finance/spending-by-category-chart";
import { IncomeExpenseChart } from "@/components/finance/income-expense-chart";
import { AccountsList } from "@/components/finance/accounts-list";
import { TransactionsTable } from "@/components/finance/transactions-table";
import { bankConnector } from "@/lib/bank-connector";
import {
  currentMonthKey,
  formatCurrency,
  getCategoryBreakdown,
  getMonthlyTotals,
} from "@/lib/finance-utils";

export default async function DashboardPage() {
  const [accounts, transactions] = await Promise.all([
    bankConnector.getAccounts(),
    bankConnector.getTransactions(),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const monthlyTotals = getMonthlyTotals(transactions, 6);
  const thisMonth = monthlyTotals.at(-1);
  const categoryBreakdown = getCategoryBreakdown(transactions, currentMonthKey());
  const recentTransactions = transactions.slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Showing dummy data while your bank connection isn&apos;t linked yet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total balance" value={formatCurrency(totalBalance)} />
        <StatCard
          label="Income this month"
          value={formatCurrency(thisMonth?.income ?? 0)}
          tone="positive"
        />
        <StatCard
          label="Expenses this month"
          value={formatCurrency(thisMonth?.expenses ?? 0)}
        />
        <StatCard
          label="Net this month"
          value={formatCurrency(thisMonth?.net ?? 0)}
          tone={(thisMonth?.net ?? 0) >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Income vs expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={monthlyTotals} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Spending by category — this month</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingByCategoryChart data={categoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountsList accounts={accounts} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent transactions</CardTitle>
            <Link href="/transactions" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <TransactionsTable transactions={recentTransactions} accounts={accounts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
