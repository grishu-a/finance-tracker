"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNpr } from "@/lib/ledger/currency";

const SEQUENTIAL = "#2a78d6";

interface BreakdownItem {
  label: string;
  amount: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: BreakdownItem }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-popover-foreground">{point.label}</p>
      <p className="text-muted-foreground">{formatNpr(point.amount)}</p>
    </div>
  );
}

export function BreakdownChart({ data }: { data: BreakdownItem[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nothing logged yet.</p>;
  }

  const height = Math.max(160, data.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={110}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="amount" fill={SEQUENTIAL} radius={4} maxBarSize={22}>
          <LabelList
            dataKey="amount"
            position="right"
            formatter={(v: unknown) => formatNpr(Number(v) || 0)}
            style={{ fill: "var(--secondary-foreground)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
