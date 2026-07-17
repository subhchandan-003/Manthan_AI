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
  ClipboardList,
  BookOpen,
  ClipboardPlus,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { getRoleAccess, type NavKey } from "@/lib/roles";

const NAV_ITEMS: { href: string; key: NavKey; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/dashboard", key: "dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/chat", key: "chat", label: "Assistant", icon: MessageSquare },
  { href: "/documents", key: "documents", label: "Docs", icon: FileText },
  { href: "/incidents", key: "incidents", label: "Incidents", icon: ClipboardList },
  { href: "/knowledge", key: "knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/maintenance", key: "maintenance", label: "Maint.", icon: Wrench },
  { href: "/work-orders", key: "work-orders", label: "Work Orders", icon: ClipboardPlus },
  { href: "/safety", key: "safety", label: "Safety", icon: ShieldAlert },
  { href: "/analytics", key: "analytics", label: "Insights", icon: BarChart3 },
  { href: "/settings", key: "settings", label: "Settings", icon: Settings },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { session } = useSession();
  const access = getRoleAccess(session?.role);
  const items = NAV_ITEMS.filter((item) => access.nav.includes(item.key));

  return (
    <nav
      className="flex shrink-0 items-stretch overflow-x-auto border-t border-border-subtle bg-bg-secondary pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors",
              active ? "text-accent-blue" : "text-text-secondary"
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.5} />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
