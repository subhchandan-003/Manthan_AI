import type { IncidentStage, Role, WorkflowIncident } from "./types";

export const STAGE_ORDER: IncidentStage[] = [
  "created",
  "ai-investigation",
  "maintenance-review",
  "safety-clearance",
  "plant-engineer-approval",
  "manager-approval",
  "assigned-for-repair",
  "maintenance-completed",
  "rca-generated",
  "knowledge-saved",
  "closed",
];

export const STAGE_LABEL: Record<IncidentStage, string> = {
  created: "Created",
  "ai-investigation": "AI Investigation",
  "maintenance-review": "Maintenance Engineer Review",
  "safety-clearance": "Safety Officer Clearance",
  "plant-engineer-approval": "Plant Engineer Approval",
  "manager-approval": "Maintenance Manager Approval",
  "assigned-for-repair": "Assigned for Repair",
  "maintenance-completed": "Maintenance Completed",
  "rca-generated": "RCA Generated",
  "knowledge-saved": "Knowledge Saved",
  closed: "Closed",
};

/** The stages actually relevant to this incident (skips safety-clearance / manager-approval when not required). */
export function visibleStages(incident: Pick<WorkflowIncident, "requiresSafetyClearance" | "isCritical">): IncidentStage[] {
  return STAGE_ORDER.filter((s) => {
    if (s === "safety-clearance") return incident.requiresSafetyClearance;
    if (s === "manager-approval") return incident.isCritical;
    return true;
  });
}

/** Which role's queue this incident currently sits in — null once closed or mid-automatic-step. */
export function actionableRole(incident: WorkflowIncident): Role | null {
  switch (incident.stage) {
    case "created":
    case "ai-investigation":
      return null; // automatic pipeline step
    case "maintenance-review":
      return "Maintenance Engineer";
    case "safety-clearance":
      return "Safety Officer";
    case "plant-engineer-approval":
      return "Plant Engineer";
    case "manager-approval":
      return "Maintenance Manager / Reliability Manager";
    case "assigned-for-repair":
      return "Technician / Shift Operator";
    case "maintenance-completed":
      return "Maintenance Engineer";
    case "rca-generated":
    case "knowledge-saved":
      return "Maintenance Manager / Reliability Manager";
    case "closed":
      return null;
  }
}

/** Incidents where it's currently this role's turn to act (used for dashboard queues + Incidents page default filter). */
export function incidentsForRole(incidents: WorkflowIncident[], role: Role): WorkflowIncident[] {
  return incidents.filter((i) => actionableRole(i) === role);
}

/**
 * Technicians raise and escalate incidents but never sit in an approval queue
 * (actionableRole() never resolves to them), so "Incidents Awaiting My Action"
 * would always read empty for that role. Give them situational awareness instead:
 * every incident still open anywhere in the pipeline.
 */
export function openIncidents(incidents: WorkflowIncident[]): WorkflowIncident[] {
  return incidents.filter((i) => i.stage !== "closed");
}

export function nextStageAfterReview(incident: WorkflowIncident): IncidentStage {
  return incident.requiresSafetyClearance ? "safety-clearance" : "plant-engineer-approval";
}

export function nextStageAfterApproval(incident: WorkflowIncident): IncidentStage {
  return incident.isCritical ? "manager-approval" : "assigned-for-repair";
}

export function draftRca(incident: WorkflowIncident): string {
  const cause = incident.aiRecommendation ?? "Root cause under investigation.";
  const corrective = incident.maintenanceReview?.correctiveAction ?? "Corrective action pending documentation.";
  return `Root Cause Analysis — ${incident.title}\n\nEquipment: ${incident.equipmentTag ?? "N/A"}\nSeverity: ${incident.severity}\n\nFindings: ${cause}\n\nCorrective action taken: ${corrective}\n\nPrepared from AI investigation + Maintenance Engineer review notes.`;
}

/**
 * Self-heals stale duplicate incidents left over from before duplicate-RCA prevention
 * existed (or any other accidental double-raise): when multiple non-closed incidents
 * share the same equipment tag + title, keep the oldest and mark the rest as
 * auto-closed duplicates. Safe to run on every load — a no-op once data is clean.
 */
export function deduplicateIncidents(incidents: WorkflowIncident[]): WorkflowIncident[] {
  // New incidents are prepended (newest-first), so scan back-to-front to find the
  // oldest non-closed incident per (tag, title) group — that's the one we keep active.
  const keeperIdByKey = new Map<string, string>();
  for (let i = incidents.length - 1; i >= 0; i--) {
    const incident = incidents[i];
    if (incident.stage === "closed") continue;
    const key = `${incident.equipmentTag ?? ""}|${incident.title}`;
    if (!keeperIdByKey.has(key)) keeperIdByKey.set(key, incident.id);
  }

  return incidents.map((incident) => {
    if (incident.stage === "closed") return incident;
    const key = `${incident.equipmentTag ?? ""}|${incident.title}`;
    if (keeperIdByKey.get(key) === incident.id) return incident;
    // A non-closed duplicate of the one we're keeping — auto-close it.
    return {
      ...incident,
      stage: "closed" as const,
      activityLog: [
        ...incident.activityLog,
        { time: incident.createdAt, actor: "MANTHAN", role: "System" as const, action: "Auto-closed as a duplicate request for the same equipment" },
      ],
    };
  });
}

export const ROLE_SHORT: Record<Role, string> = {
  "Technician / Shift Operator": "Technician",
  "Maintenance Engineer": "Maint. Engineer",
  "Plant Engineer": "Plant Engineer",
  "Safety Officer": "Safety Officer",
  "Maintenance Manager / Reliability Manager": "Manager",
};
