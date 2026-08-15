import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettleUpForm } from "@/components/ledger/settle-up-form";
import { getBalances } from "@/lib/ledger/data";
import { formatNpr } from "@/lib/ledger/currency";

export default async function BalancesPage() {
  const balances = await getBalances();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Balances</h1>
        <p className="text-sm text-muted-foreground">Net amount owed between you and each teammate.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Who owes what</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {balances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other teammates yet.</p>
          ) : (
            balances.map((b) => {
              const amount = Math.abs(b.netOwedToMe);
              const settled = amount < 0.01;
              return (
                <div key={b.counterpart.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{b.counterpart.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {settled
                        ? "Settled up"
                        : b.netOwedToMe > 0
                          ? `Owes you ${formatNpr(amount)}`
                          : `You owe ${formatNpr(amount)}`}
                    </p>
                  </div>
                  {!settled ? (
                    <SettleUpForm
                      counterpartId={b.counterpart.id}
                      suggestedAmount={amount}
                      suggestedDirection={b.netOwedToMe > 0 ? "they_paid" : "i_paid"}
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
