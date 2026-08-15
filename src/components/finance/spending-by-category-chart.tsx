"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategoryTotal } from "@/lib/finance-utils";
import { formatCurrency } from "@/lib/finance-utils";

const SEQUENTIAL = "#2a78d6";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: CategoryTotal }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-popover-foreground">{point.category}</p>
      <p className="text-muted-foreground">{formatCurrency(point.amount)}</p>
    </div>
  );
}

export function SpendingByCategoryChart({ data }: { data: CategoryTotal[] }) {
  const top = data.slice(0, 7);
  const rest = data.slice(7);
  const chartData =
    rest.length > 0
      ? [...top, { category: "Other" as const, amount: rest.reduce((s, c) => s + c.amount, 0) }]
      : top;

  if (chartData.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No spending yet this month.</p>;
  }

  const height = Math.max(180, chartData.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 48, bottom: 4, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="category"
          width={100}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="amount" fill={SEQUENTIAL} radius={4} maxBarSize={22}>
          <LabelList
            dataKey="amount"
            position="right"
            formatter={(v: unknown) => formatCurrency(Number(v) || 0)}
            style={{ fill: "var(--secondary-foreground)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
