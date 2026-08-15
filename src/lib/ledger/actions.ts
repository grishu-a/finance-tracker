"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string } | undefined;

const AuthSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
});

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = AuthSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const displayName = String(formData.get("displayName") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: displayName ? { display_name: displayName } : undefined },
  });
  if (error) return { error: error.message };

  redirect("/ledger");
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = AuthSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Incorrect email or password." };

  redirect("/ledger");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/ledger/login");
}

const TransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive({ error: "Amount must be greater than zero." }),
  categoryId: z.uuid({ error: "Choose a category." }),
  paymentMethod: z.enum(["cash", "card", "digital_wallet", "bank_transfer"]),
  txnDate: z.string().min(1, { error: "Pick a date." }),
  note: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
});

export async function addTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const participantIds = formData.getAll("participantIds").map(String).filter(Boolean);

  const parsed = TransactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    categoryId: formData.get("categoryId"),
    paymentMethod: formData.get("paymentMethod"),
    txnDate: formData.get("txnDate"),
    note: formData.get("note") || undefined,
    participantIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const isShared = parsed.data.participantIds ? parsed.data.participantIds.length > 0 : false;

  const { data: txn, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: parsed.data.type,
      amount: parsed.data.amount,
      category_id: parsed.data.categoryId,
      payment_method: parsed.data.paymentMethod,
      txn_date: parsed.data.txnDate,
      note: parsed.data.note ?? null,
      is_shared: isShared,
    })
    .select("id")
    .single();

  if (error || !txn) return { error: error?.message ?? "Could not save transaction." };

  if (isShared && parsed.data.participantIds) {
    // Equal split among the payer + tagged participants (PRD 4.8 — equal
    // split is the v1 default; custom per-person amounts are a stretch goal).
    const allParticipants = [user.id, ...parsed.data.participantIds];
    const share = Math.round((parsed.data.amount / allParticipants.length) * 100) / 100;

    const { error: participantsError } = await supabase.from("transaction_participants").insert(
      allParticipants.map((participantId) => ({
        transaction_id: txn.id,
        participant_id: participantId,
        share_amount: share,
      })),
    );
    if (participantsError) return { error: participantsError.message };
  }

  revalidatePath("/ledger");
  revalidatePath("/ledger/monthly");
  revalidatePath("/ledger/balances");
  redirect("/ledger");
}

const SettlementSchema = z.object({
  counterpartId: z.string().min(1),
  amount: z.coerce.number().positive({ error: "Amount must be greater than zero." }),
  direction: z.enum(["i_paid", "they_paid"]),
});

export async function recordSettlement(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = SettlementSchema.safeParse({
    counterpartId: formData.get("counterpartId"),
    amount: formData.get("amount"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const payerId = parsed.data.direction === "i_paid" ? user.id : parsed.data.counterpartId;
  const payeeId = parsed.data.direction === "i_paid" ? parsed.data.counterpartId : user.id;

  const { error } = await supabase.from("settlements").insert({
    payer_id: payerId,
    payee_id: payeeId,
    amount: parsed.data.amount,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/ledger/balances");
  return undefined;
}
