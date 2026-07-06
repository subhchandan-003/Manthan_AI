import type { Role } from "./types";

export type NavKey =
  | "dashboard"
  | "chat"
  | "documents"
  | "pid-viewer"
  | "maintenance"
  | "safety"
  | "analytics"
  | "settings";

export type AccessLevel = "full" | "readonly" | "none";

export interface DashboardCardAccess {
  plantHealth: boolean;
  activeAlerts: boolean;
  aiQuickChat: boolean;
  recentDocuments: boolean;
  maintenanceCalendar: boolean;
  safetyCompliance: boolean;
  shiftHandover: boolean;
}

export interface RoleAccess {
  /** Sidebar nav items + routes this role may open */
  nav: NavKey[];
  /** Maintenance & Operations screen: what this role can see/do there */
  maintenance: AccessLevel;
  /** Safety & Compliance screen: what this role can see/do there */
  safety: AccessLevel;
  dashboardCards: DashboardCardAccess;
}

/**
 * Each role only sees the domain relevant to their job:
 * - Plant Engineer: live operations reference — process, equipment context, docs. Read-only on maintenance actions, no safety admin.
 * - Maintenance Engineer: full equipment health / troubleshooting / spares. No safety admin.
 * - Safety Officer: full hazard/compliance/incident/PTW authority. No maintenance actions.
 * - Shift In-Charge: broadest situational awareness (full dashboard + safety), but maintenance stays read-only — they escalate, not repair.
 */
export const ROLE_ACCESS: Record<Role, RoleAccess> = {
  "Plant Engineer": {
    nav: ["dashboard", "chat", "documents", "pid-viewer", "maintenance", "analytics", "settings"],
    maintenance: "readonly",
    safety: "none",
    dashboardCards: {
      plantHealth: true,
      activeAlerts: true,
      aiQuickChat: true,
      recentDocuments: true,
      maintenanceCalendar: true,
      safetyCompliance: false,
      shiftHandover: false,
    },
  },
  "Maintenance Engineer": {
    nav: ["dashboard", "chat", "documents", "pid-viewer", "maintenance", "analytics", "settings"],
    maintenance: "full",
    safety: "none",
    dashboardCards: {
      plantHealth: true,
      activeAlerts: true,
      aiQuickChat: true,
      recentDocuments: true,
      maintenanceCalendar: true,
      safetyCompliance: false,
      shiftHandover: false,
    },
  },
  "Safety Officer": {
    nav: ["dashboard", "chat", "documents", "pid-viewer", "safety", "analytics", "settings"],
    maintenance: "none",
    safety: "full",
    dashboardCards: {
      plantHealth: false,
      activeAlerts: true,
      aiQuickChat: true,
      recentDocuments: true,
      maintenanceCalendar: false,
      safetyCompliance: true,
      shiftHandover: false,
    },
  },
  "Shift In-Charge": {
    nav: ["dashboard", "chat", "documents", "pid-viewer", "maintenance", "safety", "analytics", "settings"],
    maintenance: "readonly",
    safety: "full",
    dashboardCards: {
      plantHealth: true,
      activeAlerts: true,
      aiQuickChat: true,
      recentDocuments: true,
      maintenanceCalendar: true,
      safetyCompliance: true,
      shiftHandover: true,
    },
  },
};

export function getRoleAccess(role: Role | undefined): RoleAccess {
  return ROLE_ACCESS[role ?? "Plant Engineer"];
}

/** First path segment (e.g. "/maintenance/123" -> "maintenance") mapped to a NavKey, if any. */
export function routeToNavKey(pathname: string): NavKey | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  const known: NavKey[] = ["dashboard", "chat", "documents", "pid-viewer", "maintenance", "safety", "analytics", "settings"];
  return (known as string[]).includes(segment) ? (segment as NavKey) : null;
}
