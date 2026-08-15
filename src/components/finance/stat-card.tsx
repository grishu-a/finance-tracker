import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
}

const toneClass: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "text-foreground",
  positive: "text-[#006300] dark:text-[#0ca30c]",
  negative: "text-[#d03b3b]",
};

export function StatCard({ label, value, hint, tone = "neutral" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="py-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-semibold", toneClass[tone])}>
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
