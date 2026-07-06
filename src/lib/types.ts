export type HealthStatus = "healthy" | "warning" | "critical";

export type Role =
  | "Plant Engineer"
  | "Maintenance Engineer"
  | "Safety Officer"
  | "Shift In-Charge";

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
