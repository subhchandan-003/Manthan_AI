import type { IncidentStage, Role, WorkflowIncident } from "./types";

export const STAGE_ORDER: IncidentStage[] = [
  "created",
  "ai-investigation",
  "maintenance-review",
  "safety-clearance",
  "plant-engineer-approval",
  "manager-approval",
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

export function nextStageAfterReview(incident: WorkflowIncident): IncidentStage {
  return incident.requiresSafetyClearance ? "safety-clearance" : "plant-engineer-approval";
}

export function nextStageAfterApproval(incident: WorkflowIncident): IncidentStage {
  return incident.isCritical ? "manager-approval" : "maintenance-completed";
}

export function draftRca(incident: WorkflowIncident): string {
  const cause = incident.aiRecommendation ?? "Root cause under investigation.";
  const corrective = incident.maintenanceReview?.correctiveAction ?? "Corrective action pending documentation.";
  return `Root Cause Analysis — ${incident.title}\n\nEquipment: ${incident.equipmentTag ?? "N/A"}\nSeverity: ${incident.severity}\n\nFindings: ${cause}\n\nCorrective action taken: ${corrective}\n\nPrepared from AI investigation + Maintenance Engineer review notes.`;
}

export const ROLE_SHORT: Record<Role, string> = {
  "Technician / Shift Operator": "Technician",
  "Maintenance Engineer": "Maint. Engineer",
  "Plant Engineer": "Plant Engineer",
  "Safety Officer": "Safety Officer",
  "Maintenance Manager / Reliability Manager": "Manager",
};
