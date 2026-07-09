"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Bell, User, Sun, Moon } from "lucide-react";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { alerts } from "@/lib/mock-data";
import { HealthDot } from "@/components/ui/HealthDot";

const severityToHealth = { critical: "critical", warning: "warning", info: "healthy" } as const;

export function TopBar() {
  const { session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(query)}`);
    setQuery("");
  }

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-2 border-b border-border-subtle bg-bg-secondary px-3 sm:h-16 sm:gap-4 sm:px-5">
      <form onSubmit={runSearch} className="max-w-md flex-1">
        <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-2.5 py-2 text-sm text-text-muted transition-colors focus-within:border-border-active sm:px-3">
          <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search... (Enter asks AI)"
            className="w-full min-w-0 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
      </form>
      <div className="hidden flex-1 sm:block" />

      <button
        onClick={toggleTheme}
        className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        aria-label="Toggle theme"
      >
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />}
        </motion.span>
      </button>

      <div className="relative">
        <button
          onClick={() => setAlertsOpen((v) => !v)}
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Alerts"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
          {criticalCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-accent-red animate-pulse-glow" />
          )}
        </button>
        <AnimatePresence>
          {alertsOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAlertsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 z-40 w-80 rounded-lg border border-border-subtle bg-bg-elevated p-2 shadow-xl"
              >
                <p className="px-2 py-1.5 text-xs font-semibold text-text-primary">Active Alerts</p>
                <div className="flex flex-col divide-y divide-border-subtle">
                  {alerts.slice(0, 5).map((a) => (
                    <Link
                      key={a.id}
                      href="/dashboard"
                      onClick={() => setAlertsOpen(false)}
                      className="flex items-start gap-2 rounded-md px-2 py-2 text-xs hover:bg-bg-tertiary"
                    >
                      <HealthDot status={severityToHealth[a.severity]} pulse={a.severity === "critical"} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-text-primary">{a.text}</p>
                        <p className="text-[11px] text-text-muted">{a.timestamp}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2.5 border-l border-border-subtle pl-2 sm:pl-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-text-secondary">
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
