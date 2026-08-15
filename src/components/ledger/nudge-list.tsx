import type { Nudge } from "@/types/ledger";

export function NudgeList({ nudges }: { nudges: Nudge[] }) {
  if (nudges.length === 0) {
    return <p className="text-sm text-muted-foreground">No unusual patterns this month.</p>;
  }

  return (
    <ul className="space-y-2">
      {nudges.map((nudge) => (
        <li
          key={nudge.id}
          className="rounded-md border border-[#fab219]/40 bg-[#fab219]/10 px-3 py-2 text-sm text-foreground"
        >
          {nudge.message}
        </li>
      ))}
    </ul>
  );
}
