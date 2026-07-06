"use client";

import { Search, Bell, User } from "lucide-react";
import { useSession } from "@/lib/session";

export function TopBar() {
  const { session } = useSession();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border-subtle bg-bg-secondary px-4">
      <div className="flex-1 max-w-md">
        <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-3 py-1.5 text-sm text-text-muted focus-within:border-border-active">
          <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <input
            placeholder="Search equipment, documents, tags..."
            className="w-full bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </div>
      <div className="flex-1" />
      <button
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
        aria-label="Alerts"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent-red" />
      </button>
      <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-tertiary text-text-secondary">
          <User className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <div className="hidden text-xs leading-tight sm:block">
          <div className="font-medium text-text-primary">{session?.employeeName ?? "Guest"}</div>
          <div className="text-text-muted">
            {session?.role ?? "—"} · {session?.plantShort ?? "—"}
          </div>
        </div>
      </div>
    </header>
  );
}
