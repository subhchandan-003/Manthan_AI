"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Wrench,
  ShieldAlert,
  BarChart3,
  Settings,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { getRoleAccess, type NavKey } from "@/lib/roles";

const NAV_ITEMS: { href: string; key: NavKey; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/dashboard", key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", key: "chat", label: "AI Query Assistant", icon: MessageSquare },
  { href: "/documents", key: "documents", label: "Document Intelligence Hub", icon: FileText },
  { href: "/maintenance", key: "maintenance", label: "Maintenance & Operations", icon: Wrench },
  { href: "/safety", key: "safety", label: "Safety & Compliance", icon: ShieldAlert },
  { href: "/analytics", key: "analytics", label: "Analytics & Insights", icon: BarChart3 },
  { href: "/settings", key: "settings", label: "Settings & Admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const { session } = useSession();
  const access = getRoleAccess(session?.role);
  const visibleItems = NAV_ITEMS.filter((item) => access.nav.includes(item.key));

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={clsx(
        "shrink-0 border-r border-border-subtle bg-bg-secondary transition-[width] duration-150 ease-out overflow-hidden",
        expanded ? "w-60" : "w-[72px]"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border-subtle px-4">
        <Eye className="h-6 w-6 shrink-0 text-accent-cyan" />
        {expanded && (
          <span className="font-display text-sm font-bold tracking-wide whitespace-nowrap">
            MANTHAN
          </span>
        )}
      </div>
      <nav className="flex flex-col gap-1 p-2.5">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-md border-l-2 px-2.5 py-2.5 text-sm transition-colors",
                active
                  ? "border-l-accent-blue bg-bg-tertiary text-text-primary"
                  : "border-l-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
              {expanded && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      {expanded && session?.role && (
        <div className="mt-auto border-t border-border-subtle px-4 py-3 text-[11px] text-text-muted">
          Viewing as {session.role}
        </div>
      )}
    </aside>
  );
}
