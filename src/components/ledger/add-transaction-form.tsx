"use client";

import { useActionState, useState } from "react";
import { addTransaction, type FormState } from "@/lib/ledger/actions";
import { PAYMENT_METHODS } from "@/lib/ledger/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category, Profile } from "@/types/ledger";

export function AddTransactionForm({ categories, teammates }: { categories: Category[]; teammates: Profile[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addTransaction, undefined);
  const [type, setType] = useState<"expense" | "income">("expense");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Type</Label>
        <RadioGroup name="type" value={type} onValueChange={(v) => setType(v as "expense" | "income")} className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="expense" /> Expense
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="income" /> Income
          </label>
        </RadioGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (Rs)</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="txnDate">Date</Label>
          <Input id="txnDate" name="txnDate" type="date" defaultValue={today} required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <Select name="categoryId" required>
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="Choose a category">
                {(value: string | null) => categories.find((c) => c.id === value)?.name ?? "Choose a category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="paymentMethod">Payment method</Label>
          <Select name="paymentMethod" required>
            <SelectTrigger id="paymentMethod" className="w-full">
              <SelectValue placeholder="How did you pay?">
                {(value: string | null) => PAYMENT_METHODS.find((m) => m.value === value)?.label ?? "How did you pay?"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" name="note" rows={2} />
      </div>

      {type === "expense" && teammates.length > 0 ? (
        <div className="space-y-1.5">
          <Label>Split with (optional)</Label>
          <div className="flex flex-wrap gap-4">
            {teammates.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <Checkbox name="participantIds" value={t.id} />
                {t.displayName}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Splits the full amount equally between you and whoever you tag. Leave everyone unchecked to log it as
            just yours.
          </p>
        </div>
      ) : null}

      {state?.error ? <p className="text-sm text-[#d03b3b]">{state.error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save transaction"}
      </Button>
    </form>
  );
}
