import Link from "next/link";
import { getCurrentProfile } from "@/lib/ledger/data";
import { signOut } from "@/lib/ledger/actions";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/ledger", label: "Dashboard" },
  { href: "/ledger/add", label: "Add" },
  { href: "/ledger/monthly", label: "Monthly" },
  { href: "/ledger/balances", label: "Balances" },
];

export default async function LedgerAppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <nav className="flex items-center gap-4 text-sm">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {profile ? <span className="text-sm text-muted-foreground">{profile.displayName}</span> : null}
          <form action={signOut}>
            <Button type="submit" size="sm" variant="ghost">
              Sign out
            </Button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
