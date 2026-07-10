import type { Role } from "./types";

export type NavKey =
  | "dashboard"
  | "chat"
  | "documents"
  | "pid-viewer"
  | "maintenance"
  | "safety"
  | "incidents"
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
 * Each role only sees the domain relevant to their job. The Incidents workflow
 * (src/lib/incidentWorkflow.ts) is a shared pipeline all 5 roles participate in —
 * access to individual actions within it is gated stage-by-stage there, not here.
 *
 * - Technician / Shift Operator: field-level — raises incidents, uploads findings,
 *   escalates. Read-only on Maintenance & Operations, no Safety admin, no approvals.
 * - Maintenance Engineer: full equipment health / troubleshooting / spares. No safety admin.
 * - Plant Engineer: plant-wide operations reference, approves maintenance plans/shutdowns.
 *   Read-only on Maintenance & Operations, no Safety admin.
 * - Safety Officer: full hazard/compliance/PTW authority. No maintenance actions.
 * - Maintenance Manager / Reliability Manager: final approval authority — broadest
 *   access across Maintenance, Safety and plant-wide analytics/KPIs.
 */
export const ROLE_ACCESS: Record<Role, RoleAccess> = {
  "Technician / Shift Operator": {
    nav: ["dashboard", "chat", "documents", "pid-viewer", "maintenance", "incidents", "analytics", "settings"],
    maintenance: "readonly",
    safety: "none",
    dashboardCards: {
      plantHealth: true,
      activeAlerts: true,
      aiQuickChat: true,
      recentDocuments: true,
      maintenanceCalendar: true,
      safetyCompliance: false,
      shiftHandover: true,
    },
  },
  "Maintenance Engineer": {
    nav: ["dashboard", "chat", "documents", "pid-viewer", "maintenance", "incidents", "analytics", "settings"],
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
  "Plant Engineer": {
    nav: ["dashboard", "chat", "documents", "pid-viewer", "maintenance", "incidents", "analytics", "settings"],
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
  "Safety Officer": {
    nav: ["dashboard", "chat", "documents", "pid-viewer", "safety", "incidents", "analytics", "settings"],
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
  "Maintenance Manager / Reliability Manager": {
    nav: ["dashboard", "chat", "documents", "pid-viewer", "maintenance", "safety", "incidents", "analytics", "settings"],
    maintenance: "full",
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
  return ROLE_ACCESS[role ?? "Technician / Shift Operator"];
}

const KNOWN_NAV_KEYS: NavKey[] = [
  "dashboard",
  "chat",
  "documents",
  "pid-viewer",
  "maintenance",
  "safety",
  "incidents",
  "analytics",
  "settings",
];

/** First path segment (e.g. "/maintenance/123" -> "maintenance") mapped to a NavKey, if any. */
export function routeToNavKey(pathname: string): NavKey | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return (KNOWN_NAV_KEYS as string[]).includes(segment) ? (segment as NavKey) : null;
}
