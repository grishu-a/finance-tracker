import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/finance/stat-card";
import { BreakdownChart } from "@/components/ledger/breakdown-chart";
import { NudgeList } from "@/components/ledger/nudge-list";
import { buttonVariants } from "@/components/ui/button";
import { getTransactionsForMonth, getTransactionsForMonths } from "@/lib/ledger/data";
import { getCategoryBreakdown, getMonthSnapshot, ownTransactionsOnly } from "@/lib/ledger/aggregate";
import { fullMonthLabel, lastNMonthKeys, shiftMonthKey } from "@/lib/ledger/months";
import { currentMonthKey } from "@/lib/finance-utils";
import { formatNpr } from "@/lib/ledger/currency";
import { recommendationEngine } from "@/lib/ledger/recommendations";

export default async function LedgerDashboardPage() {
  const thisMonthKey = currentMonthKey();
  const priorKeys = lastNMonthKeys(shiftMonthKey(thisMonthKey, -1), 3);

  const [thisMonthTxns, priorMonthsTxns] = await Promise.all([
    getTransactionsForMonth(thisMonthKey),
    getTransactionsForMonths(priorKeys),
  ]);

  const ownThisMonth = ownTransactionsOnly(thisMonthTxns);
  const snapshot = getMonthSnapshot(ownThisMonth);
  const categoryBreakdown = getCategoryBreakdown(ownThisMonth).slice(0, 5).map((c) => ({
    label: c.category,
    amount: c.amount,
  }));

  const priorSnapshots = priorKeys.map((key) => getMonthSnapshot(ownTransactionsOnly(priorMonthsTxns[key] ?? [])));
  const nudges = recommendationEngine.generate({
    currentMonth: snapshot,
    priorMonths: priorSnapshots.map((s) => ({ categoryTotals: s.categoryTotals })),
  });

  const balance = snapshot.income - snapshot.expenses;
  const ratio = snapshot.income > 0 ? Math.round((snapshot.expenses / snapshot.income) * 100) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Ledger</h1>
        <p className="text-sm text-muted-foreground">{fullMonthLabel(thisMonthKey)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Balance this month" value={formatNpr(balance)} tone={balance >= 0 ? "positive" : "negative"} />
        <StatCard label="Income" value={formatNpr(snapshot.income)} tone="positive" />
        <StatCard label="Expenses" value={formatNpr(snapshot.expenses)} />
        <StatCard label="Spend vs income" value={ratio === null ? "—" : `${ratio}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Nudges</CardTitle>
          </CardHeader>
          <CardContent>
            <NudgeList nudges={nudges} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top categories</CardTitle>
            <Link href="/ledger/monthly" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Monthly trend
            </Link>
          </CardHeader>
          <CardContent>
            <BreakdownChart data={categoryBreakdown} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
