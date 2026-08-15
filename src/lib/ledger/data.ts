import { createClient } from "@/lib/supabase/server";
import type { Category, LedgerTransaction, Profile, Settlement } from "@/types/ledger";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("id, display_name").eq("id", user.id).single();
  return data ? { id: data.id, displayName: data.display_name } : null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, display_name").order("display_name");
  return (data ?? []).map((p) => ({ id: p.id, displayName: p.display_name }));
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, sort_order").order("sort_order");
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, sortOrder: c.sort_order }));
}

function monthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const from = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
  const to = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { from, to };
}

/** All transactions the current user owns or participates in, for one month. */
export async function getTransactionsForMonth(monthKey: string): Promise<LedgerTransaction[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { from, to } = monthRange(monthKey);

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, user_id, type, amount, category_id, payment_method, txn_date, note, is_shared, categories(name), transaction_participants(participant_id, share_amount, profiles(display_name))",
    )
    .gte("txn_date", from)
    .lte("txn_date", to)
    .order("txn_date", { ascending: false });

  if (error || !data) return [];

  type Row = {
    id: string;
    user_id: string;
    type: "income" | "expense";
    amount: number;
    category_id: string;
    payment_method: "cash" | "card" | "digital_wallet" | "bank_transfer";
    txn_date: string;
    note: string | null;
    is_shared: boolean;
    categories: { name: string } | null;
    transaction_participants:
      | { participant_id: string; share_amount: number; profiles: { display_name: string } | null }[]
      | null;
  };

  return (data as unknown as Row[]).map((t) => ({
    id: t.id,
    userId: t.user_id,
    type: t.type,
    amount: Number(t.amount),
    categoryId: t.category_id,
    categoryName: t.categories?.name ?? "Other",
    paymentMethod: t.payment_method,
    txnDate: t.txn_date,
    note: t.note,
    isShared: t.is_shared,
    isOwn: t.user_id === user.id,
    participants: (t.transaction_participants ?? []).map((p) => ({
      id: p.participant_id,
      displayName: p.profiles?.display_name ?? "Unknown",
      shareAmount: Number(p.share_amount),
    })),
  }));
}

/** Convenience for trend charts / recommendation lookback windows. */
export async function getTransactionsForMonths(monthKeys: string[]): Promise<Record<string, LedgerTransaction[]>> {
  const results = await Promise.all(monthKeys.map((key) => getTransactionsForMonth(key)));
  return Object.fromEntries(monthKeys.map((key, i) => [key, results[i]]));
}

export interface BalanceRow {
  counterpart: Profile;
  /** Positive: counterpart owes the current user. Negative: current user owes counterpart. */
  netOwedToMe: number;
}

export async function getBalances(): Promise<BalanceRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [profiles, iPaidRes, iOweRes, settlementsRes] = await Promise.all([
    getAllProfiles(),
    supabase
      .from("transactions")
      .select("id, transaction_participants(participant_id, share_amount)")
      .eq("user_id", user.id)
      .eq("is_shared", true),
    supabase
      .from("transaction_participants")
      .select("share_amount, transactions!inner(user_id)")
      .eq("participant_id", user.id)
      .neq("transactions.user_id", user.id),
    supabase.from("settlements").select("payer_id, payee_id, amount").or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`),
  ]);

  const net = new Map<string, number>();
  const add = (counterpartId: string, amount: number) => {
    if (counterpartId === user.id) return;
    net.set(counterpartId, (net.get(counterpartId) ?? 0) + amount);
  };

  for (const t of iPaidRes.data ?? []) {
    for (const p of t.transaction_participants ?? []) {
      add(p.participant_id, Number(p.share_amount));
    }
  }

  for (const row of (iOweRes.data ?? []) as unknown as { share_amount: number; transactions: { user_id: string } }[]) {
    add(row.transactions.user_id, -Number(row.share_amount));
  }

  for (const s of settlementsRes.data ?? []) {
    if (s.payer_id === user.id) add(s.payee_id, Number(s.amount));
    else if (s.payee_id === user.id) add(s.payer_id, -Number(s.amount));
  }

  return profiles
    .filter((p) => p.id !== user.id)
    .map((p) => ({ counterpart: p, netOwedToMe: Math.round((net.get(p.id) ?? 0) * 100) / 100 }));
}

export async function getSettlementsWith(counterpartId: string): Promise<Settlement[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("settlements")
    .select("id, payer_id, payee_id, amount, note, settled_at")
    .or(
      `and(payer_id.eq.${user.id},payee_id.eq.${counterpartId}),and(payer_id.eq.${counterpartId},payee_id.eq.${user.id})`,
    )
    .order("settled_at", { ascending: false });

  return (data ?? []).map((s) => ({
    id: s.id,
    payerId: s.payer_id,
    payeeId: s.payee_id,
    amount: Number(s.amount),
    note: s.note,
    settledAt: s.settled_at,
  }));
}
