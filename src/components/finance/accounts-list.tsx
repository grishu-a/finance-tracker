import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance-utils";
import type { BankAccount } from "@/types/finance";

export function AccountsList({ accounts }: { accounts: BankAccount[] }) {
  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <Card key={account.id}>
          <CardContent className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{account.name}</p>
              <p className="text-xs text-muted-foreground">
                {account.institution} · {account.accountNumberMask}
              </p>
            </div>
            <p className="font-semibold">{formatCurrency(account.balance)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
