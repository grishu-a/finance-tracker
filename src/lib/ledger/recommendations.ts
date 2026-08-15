import type { Nudge } from "@/types/ledger";
import { formatNpr } from "@/lib/ledger/currency";
import { CATEGORY_DEVIATION_THRESHOLD } from "@/lib/ledger/constants";

export interface MonthSnapshot {
  income: number;
  expenses: number;
  categoryTotals: Record<string, number>;
}

export interface RecommendationInput {
  currentMonth: MonthSnapshot;
  /** Prior months' category totals, most recent first, up to 3. */
  priorMonths: Pick<MonthSnapshot, "categoryTotals">[];
}

/**
 * v1 is deterministic, rule-based (PRD 4.4 — explicitly no ML/AI model).
 * Kept behind this interface so a smarter model can replace
 * RuleBasedRecommendationEngine later without touching call sites.
 */
export interface RecommendationEngine {
  generate(input: RecommendationInput): Nudge[];
}

class RuleBasedRecommendationEngine implements RecommendationEngine {
  generate({ currentMonth, priorMonths }: RecommendationInput): Nudge[] {
    const nudges: Nudge[] = [];

    if (priorMonths.length > 0) {
      for (const [category, amount] of Object.entries(currentMonth.categoryTotals)) {
        const priorAmounts = priorMonths.map((m) => m.categoryTotals[category] ?? 0);
        const average = priorAmounts.reduce((a, b) => a + b, 0) / priorAmounts.length;
        if (average <= 0) continue;

        const deviation = (amount - average) / average;
        if (deviation >= CATEGORY_DEVIATION_THRESHOLD) {
          nudges.push({
            id: `category-${category}`,
            message: `You spent ${Math.round(deviation * 100)}% more on ${category} this month vs. your 3-month average.`,
            severity: "warning",
          });
        }
      }
    }

    if (currentMonth.expenses > currentMonth.income) {
      const over = currentMonth.expenses - currentMonth.income;
      nudges.push({
        id: "overspend",
        message: `Your spending this month exceeds your income by ${formatNpr(over)}.`,
        severity: "warning",
      });
    }

    return nudges;
  }
}

export const recommendationEngine: RecommendationEngine = new RuleBasedRecommendationEngine();
