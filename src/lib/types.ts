export type HealthStatus = "healthy" | "warning" | "critical";

export type Role =
  | "Technician / Shift Operator"
  | "Maintenance Engineer"
  | "Plant Engineer"
  | "Safety Officer"
  | "Maintenance Manager / Reliability Manager";

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  text: string;
  tag?: string;
  timestamp: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: "P&ID" | "PFD" | "SOP" | "Maintenance Log" | "Safety Manual" | "OEM Manual" | "Inspection Report" | "Reference Report";
  status: "indexed" | "processing" | "needs-review";
  uploadDate: string;
  tagsIdentified?: number;
  loopsMapped?: number;
  /** Real source document number / tender ref / spec no., where applicable */
  docNo?: string;
}

export interface EquipmentItem {
  id: string;
  tag: string;
  name: string;
  system: string;
  health: HealthStatus;
  nextPM: string;
  type: string;
  oem: string;
  location: string;
  commissionDate: string;
  runningHours: number;
  bearingTemp?: number;
  vibration?: number;
  lastTrip?: string;
}

export interface MaintenanceEvent {
  id: string;
  equipmentId: string;
  date: string;
  type: "PM" | "CM" | "Overhaul" | "Emergency";
  description: string;
  performedBy: string;
  durationHrs: number;
}

export interface SourceCitation {
  title: string;
  type: DocumentItem["type"];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  followUps?: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  status: "overdue" | "scheduled" | "completed";
}

export interface Incident {
  id: string;
  title: string;
  date: string;
  severity: "high" | "medium" | "low";
  rootCause: string;
  status: "open" | "closed";
  contributingFactors: string[];
  correctiveActions: string[];
}

export interface ComplianceRow {
  regulation: string;
  requirement: string;
  status: "pass" | "warning" | "fail";
  lastAudit: string;
  nextDue: string;
}

export interface PermitToWork {
  id: string;
  type: "Hot Work" | "Cold Work" | "Confined Space" | "Electrical" | "Height";
  location: string;
  issuedTo: string;
  validTill: string;
  status: "active" | "closed" | "expired";
}

/**
 * The live incident-response pipeline (distinct from the historical `Incident`
 * RCA case-study records shown in Safety > Incident Analysis).
 *
 * Created -> AI Investigation -> Maintenance Engineer Review
 *   -> Safety Officer Clearance (if required) -> Plant Engineer Approval
 *   -> Maintenance Manager Approval (critical only) -> Assigned for Repair
 *   (Technician executes the physical work) -> Maintenance Completed
 *   (Maintenance Engineer verifies + drafts RCA) -> RCA Generated
 *   -> Knowledge Saved -> Closed
 */
export type IncidentStage =
  | "created"
  | "ai-investigation"
  | "maintenance-review"
  | "safety-clearance"
  | "plant-engineer-approval"
  | "manager-approval"
  | "assigned-for-repair"
  | "maintenance-completed"
  | "rca-generated"
  | "knowledge-saved"
  | "closed";

export interface IncidentActivity {
  time: string;
  actor: string;
  role: Role | "System";
  action: string;
}

export interface IncidentAttachment {
  name: string;
  kind: "photo" | "sensor-reading" | "finding";
  /** Populated for real image uploads — a data URL so it can be rendered in-app */
  dataUrl?: string;
  /** Populated for real text/CSV uploads — raw text content for in-app preview */
  textContent?: string;
  size?: number;
  mimeType?: string;
}

export interface WorkflowIncident {
  id: string;
  title: string;
  description: string;
  equipmentTag?: string;
  severity: "critical" | "high" | "medium" | "low";
  /** Critical incidents require Maintenance Manager approval before completion */
  isCritical: boolean;
  /** Whether this incident must pass through Safety Officer clearance */
  requiresSafetyClearance: boolean;
  /** A Technician flagged this as urgent / needing priority attention */
  escalated: boolean;
  /** Plant Engineer / Manager flagged that a shutdown is being requested & approved */
  shutdownRequested: boolean;
  stage: IncidentStage;
  raisedBy: string;
  raisedByRole: Role;
  createdAt: string;
  assignedTechnician?: string;
  aiRecommendation?: string;
  maintenanceReview?: { by: string; notes: string; correctiveAction: string };
  safetyClearance?: { by: string; approved: boolean; ppeVerified: boolean; loto: boolean; notes: string };
  plantEngineerApproval?: { by: string; approved: boolean; workOrderNo?: string; notes: string };
  managerApproval?: { by: string; approved: boolean; capaApproved: boolean; notes: string };
  /** Filled in by the Technician when they mark the physical repair complete */
  repairCompletion?: { by: string; notes: string };
  rca?: string;
  capa?: string;
  attachments: IncidentAttachment[];
  activityLog: IncidentActivity[];
}
