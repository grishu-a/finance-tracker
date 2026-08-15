"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Nav() {
  const pathname = usePathname();
  const isLedger = pathname?.startsWith("/ledger");

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            Cashboard
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/transactions" className="hover:text-foreground">
              Transactions
            </Link>
            <Link href="/ledger" className="hover:text-foreground">
              Ledger
            </Link>
          </nav>
        </div>
        {!isLedger ? (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:inline-flex">
              Dummy data
            </Badge>
            <Button size="sm" variant="secondary" disabled title="Real bank linking (Open Banking / CDR) comes next">
              Connect bank account
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
