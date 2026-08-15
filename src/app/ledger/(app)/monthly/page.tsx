import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BreakdownChart } from "@/components/ledger/breakdown-chart";
import { LedgerTrendChart } from "@/components/ledger/trend-chart";
import { getTransactionsForMonths } from "@/lib/ledger/data";
import { getCategoryBreakdown, getMonthSnapshot, getPaymentMethodBreakdown, ownTransactionsOnly } from "@/lib/ledger/aggregate";
import { fullMonthLabel, lastNMonthKeys, monthLabel, shiftMonthKey } from "@/lib/ledger/months";
import { currentMonthKey } from "@/lib/finance-utils";
import { formatNpr } from "@/lib/ledger/currency";
import { cn } from "@/lib/utils";

export default async function MonthlyPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const selectedKey = month ?? currentMonthKey();

  const trendKeys = lastNMonthKeys(selectedKey, 6);
  const txnsByMonth = await getTransactionsForMonths(trendKeys);

  const selectedOwn = ownTransactionsOnly(txnsByMonth[selectedKey] ?? []);
  const snapshot = getMonthSnapshot(selectedOwn);
  const categoryBreakdown = getCategoryBreakdown(selectedOwn).map((c) => ({ label: c.category, amount: c.amount }));
  const paymentBreakdown = getPaymentMethodBreakdown(selectedOwn).map((p) => ({ label: p.label, amount: p.amount }));

  const trendData = trendKeys.map((key) => {
    const s = getMonthSnapshot(ownTransactionsOnly(txnsByMonth[key] ?? []));
    return { key, label: monthLabel(key), income: s.income, expenses: s.expenses };
  });

  const prevKey = shiftMonthKey(selectedKey, -1);
  const nextKey = shiftMonthKey(selectedKey, 1);
  const isCurrentMonth = selectedKey === currentMonthKey();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Monthly</h1>
          <p className="text-sm text-muted-foreground">{fullMonthLabel(selectedKey)}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/ledger/monthly?month=${prevKey}`} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}>
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/ledger/monthly?month=${nextKey}`}
            aria-disabled={isCurrentMonth}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              isCurrentMonth && "pointer-events-none opacity-50",
            )}
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-2">
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="mt-1 text-xl font-semibold">{formatNpr(snapshot.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="mt-1 text-xl font-semibold">{formatNpr(snapshot.expenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2">
            <p className="text-sm text-muted-foreground">Net</p>
            <p className="mt-1 text-xl font-semibold">{formatNpr(snapshot.income - snapshot.expenses)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs expenses — last 6 months</CardTitle>
        </CardHeader>
        <CardContent>
          <LedgerTrendChart data={trendData} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownChart data={categoryBreakdown} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By payment method</CardTitle>
          </CardHeader>
          <CardContent>
            <BreakdownChart data={paymentBreakdown} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
