"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { recordSettlement, type FormState } from "@/lib/ledger/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettleUpForm({
  counterpartId,
  suggestedAmount,
  suggestedDirection,
}: {
  counterpartId: string;
  suggestedAmount: number;
  suggestedDirection: "i_paid" | "they_paid";
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordSettlement, undefined);
  const [open, setOpen] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) setOpen(false);
    wasPending.current = pending;
  }, [pending, state]);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Settle up
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="counterpartId" value={counterpartId} />
      <select
        name="direction"
        defaultValue={suggestedDirection}
        className="h-8 rounded-lg border border-border bg-background px-2 text-sm"
      >
        <option value="i_paid">I paid them</option>
        <option value="they_paid">They paid me</option>
      </select>
      <Input
        name="amount"
        type="number"
        min="0"
        step="0.01"
        defaultValue={suggestedAmount || undefined}
        className="h-8 w-28"
        required
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Record"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {state?.error ? <p className="w-full text-sm text-[#d03b3b]">{state.error}</p> : null}
    </form>
  );
}
