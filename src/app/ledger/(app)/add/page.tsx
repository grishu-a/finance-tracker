import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTransactionForm } from "@/components/ledger/add-transaction-form";
import { getAllProfiles, getCategories, getCurrentUser } from "@/lib/ledger/data";

export default async function AddTransactionPage() {
  const [categories, profiles, user] = await Promise.all([getCategories(), getAllProfiles(), getCurrentUser()]);
  const teammates = profiles.filter((p) => p.id !== user?.id);

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Log a transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <AddTransactionForm categories={categories} teammates={teammates} />
        </CardContent>
      </Card>
    </div>
  );
}
