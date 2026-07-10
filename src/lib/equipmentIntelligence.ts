/**
 * Data layer for the Equipment Intelligence Workspace (Chat page).
 *
 * Every export here is a plain function returning shaped data derived from the
 * existing mock dataset. They are intentionally written as functions — not
 * inline literals in components — so each one is a drop-in placeholder for a
 * real API call later (e.g. `getMaintenanceHistory(tag)` → `GET /api/equipment/:tag/maintenance-history`).
 * Swap the body, keep the signature and every screen that calls it keeps working.
 */
import {
  equipment,
  maintenanceEvents,
  incidents as rcaCaseStudies,
  documents,
  spareParts,
} from "./mock-data";
import type { EquipmentItem, WorkflowIncident } from "./types";

// ---------------------------------------------------------------------------
// Equipment lookup / detection
// ---------------------------------------------------------------------------

export function getEquipmentByTag(tag: string): EquipmentItem | undefined {
  return equipment.find((e) => e.tag === tag);
}

/** Fuzzy-matches an equipment tag or name inside free text (chat query, search bar). */
export function findEquipmentInText(text: string): EquipmentItem | undefined {
  const q = text.toLowerCase();
  // longest match first so "Boiler Feed Pump-A" beats a shorter partial hit
  const candidates = [...equipment].sort((a, b) => b.tag.length - a.tag.length);
  return (
    candidates.find((e) => q.includes(e.tag.toLowerCase())) ??
    candidates.find((e) => q.includes(e.name.toLowerCase()))
  );
}

const DEPARTMENT_BY_SYSTEM: Record<string, string> = {
  "Air & Flue Gas Path": "Boiler Maintenance",
  "Feed Water System": "Turbine & BOP Maintenance",
  "Main Steam System": "Boiler Maintenance",
  Boiler: "Boiler Maintenance",
  "Flue Gas Desulphurisation": "Environment & FGD",
  "Balance of Plant — Auxiliary Cooling": "BOP Maintenance",
  "Boiler Purge Air System": "Boiler Maintenance",
};

const CRITICALITY_BY_HEALTH: Record<EquipmentItem["health"], "Critical" | "High" | "Medium"> = {
  critical: "Critical",
  warning: "High",
  healthy: "Medium",
};

export function getDepartment(e: EquipmentItem): string {
  return DEPARTMENT_BY_SYSTEM[e.system] ?? "Plant Maintenance";
}

export function getCriticality(e: EquipmentItem): "Critical" | "High" | "Medium" {
  return CRITICALITY_BY_HEALTH[e.health];
}

export function getHealthScore(e: EquipmentItem): number {
  if (e.health === "critical") return 42;
  if (e.health === "warning") return 71;
  return 94;
}

export function getLastInspectionDate(e: EquipmentItem): string {
  return getInspectionReports(e.tag)[0]?.date ?? e.commissionDate;
}

// ---------------------------------------------------------------------------
// Section 3 — Current Equipment Condition
// ---------------------------------------------------------------------------

export interface ConditionMetric {
  label: string;
  value: string;
  status: "healthy" | "warning" | "critical";
}

export function getCurrentCondition(tag: string): ConditionMetric[] {
  const e = getEquipmentByTag(tag);
  if (!e) return [];
  const tempStatus = e.bearingTemp ? (e.bearingTemp > 80 ? "critical" : e.bearingTemp > 72 ? "warning" : "healthy") : "healthy";
  const vibStatus = e.vibration ? (e.vibration > 4 ? "critical" : e.vibration > 3 ? "warning" : "healthy") : "healthy";
  return [
    { label: "Temperature", value: e.bearingTemp ? `${e.bearingTemp}°C` : "N/A", status: tempStatus },
    { label: "Vibration", value: e.vibration ? `${e.vibration} mm/s` : "N/A", status: vibStatus },
    { label: "Pressure", value: "Normal range", status: "healthy" },
    { label: "Flow", value: "Within design flow", status: "healthy" },
    { label: "Health Score", value: `${getHealthScore(e)}%`, status: e.health },
    { label: "Last Alarm", value: e.lastTrip ?? "None recorded", status: e.lastTrip ? "warning" : "healthy" },
    { label: "Operational Status", value: e.health === "critical" ? "Isolated" : "Running", status: e.health },
  ];
}

// ---------------------------------------------------------------------------
// Section 4 — Maintenance History (reuses maintenanceEvents)
// ---------------------------------------------------------------------------

export function getMaintenanceHistory(tag: string) {
  const e = getEquipmentByTag(tag);
  if (!e) return [];
  return maintenanceEvents
    .filter((m) => m.equipmentId === e.id)
    .map((m) => ({ ...m, workOrderNo: `WO-${m.id.replace(/\D/g, "").padStart(5, "0")}` }));
}

// ---------------------------------------------------------------------------
// Section 5 — Previous RCA Reports (historical case-study library + closed workflow incidents)
// ---------------------------------------------------------------------------

export interface RcaRecord {
  id: string;
  title: string;
  date: string;
  rootCause: string;
  status: "open" | "closed";
  similarity: number;
}

export function getPreviousRcas(tag: string, workflowIncidents: WorkflowIncident[] = []): RcaRecord[] {
  const e = getEquipmentByTag(tag);
  if (!e) return [];
  const fromCaseStudies: RcaRecord[] = rcaCaseStudies
    .filter((i) => i.title.includes(e.tag) || i.title.includes(e.name))
    .map((i) => ({ id: i.id.toUpperCase(), title: i.title, date: i.date, rootCause: i.rootCause, status: i.status, similarity: 92 }));
  const fromWorkflow: RcaRecord[] = workflowIncidents
    .filter((i) => i.equipmentTag === tag && i.rca)
    .map((i) => ({
      id: i.id.toUpperCase(),
      title: i.title,
      date: i.createdAt,
      rootCause: i.aiRecommendation ?? "See full RCA",
      status: i.stage === "closed" ? "closed" : "open",
      similarity: 88,
    }));
  return [...fromWorkflow, ...fromCaseStudies];
}

// ---------------------------------------------------------------------------
// Section 6 — Linked SOPs
// ---------------------------------------------------------------------------

export interface SopRecord {
  title: string;
  category: string;
  docRef: string;
}

const SOP_CATEGORIES = ["Inspection", "Lubrication", "Bearing Replacement", "Alignment", "Emergency Shutdown"];

export function getLinkedSops(tag: string): SopRecord[] {
  const e = getEquipmentByTag(tag);
  if (!e) return [];
  return SOP_CATEGORIES.map((category) => ({
    title: `${category} — ${e.tag}`,
    category,
    docRef: "NTPC O&M Best Practices manual",
  }));
}

// ---------------------------------------------------------------------------
// Section 7 — Inspection Reports (generated deterministically per equipment)
// ---------------------------------------------------------------------------

export interface InspectionReport {
  date: string;
  inspector: string;
  observations: string;
  status: "pass" | "flagged" | "action-required";
}

const INSPECTORS = ["M. Reddy", "S. Iyer", "A. Sharma"];

export function getInspectionReports(tag: string): InspectionReport[] {
  const e = getEquipmentByTag(tag);
  if (!e) return [];
  const base: InspectionReport[] = [
    {
      date: e.nextPM,
      inspector: INSPECTORS[0],
      observations:
        e.health === "critical"
          ? `Confirmed damage consistent with last trip event: ${e.lastTrip ?? "see maintenance log"}.`
          : e.bearingTemp && e.bearingTemp > 75
          ? `Bearing temperature elevated at ${e.bearingTemp}°C — within acceptable limits but trending up.`
          : "No abnormalities observed during routine walkdown.",
      status: e.health === "critical" ? "action-required" : e.health === "warning" ? "flagged" : "pass",
    },
    {
      date: e.commissionDate,
      inspector: INSPECTORS[1],
      observations: `Commissioning inspection per ${e.oem} scope — all acceptance criteria met.`,
      status: "pass",
    },
  ];
  return base;
}

// ---------------------------------------------------------------------------
// Section 8 — Related Work Orders (derived from maintenance history)
// ---------------------------------------------------------------------------

export function getRelatedWorkOrders(tag: string) {
  return getMaintenanceHistory(tag).map((m) => ({
    id: m.workOrderNo,
    date: m.date,
    description: m.description,
    completedBy: m.performedBy,
    status: "Completed" as const,
  }));
}

// ---------------------------------------------------------------------------
// Section 9 — Connected Equipment (P&ID relationships, hand-mapped to the real Sipat P&ID topology)
// ---------------------------------------------------------------------------

const CONNECTIONS: Record<string, { upstream: string[]; downstream: string[] }> = {
  "ID Fan-A": { upstream: ["Platen Superheater", "ESP"], downstream: ["FGD Absorber"] },
  "ID Fan-B": { upstream: ["Platen Superheater", "ESP"], downstream: ["FGD Absorber"] },
  "Boiler Feed Pump-A": { upstream: [], downstream: ["Attemperator", "Platen Superheater"] },
  Attemperator: { upstream: ["Boiler Feed Pump-A"], downstream: ["Platen Superheater"] },
  "Platen Superheater": { upstream: ["Attemperator"], downstream: ["ID Fan-A", "ID Fan-B"] },
  "FGD Absorber": { upstream: ["ID Fan-A", "ID Fan-B"], downstream: [] },
  ESP: { upstream: ["Platen Superheater"], downstream: ["ID Fan-A", "ID Fan-B"] },
  "Cooling System Fan": { upstream: [], downstream: [] },
  "Purge Fan No. 12 (East)": { upstream: [], downstream: ["Platen Superheater"] },
};

export function getConnectedEquipment(tag: string) {
  const rel = CONNECTIONS[tag] ?? { upstream: [], downstream: [] };
  return {
    upstream: rel.upstream.map((t) => getEquipmentByTag(t)).filter(Boolean) as EquipmentItem[],
    downstream: rel.downstream.map((t) => getEquipmentByTag(t)).filter(Boolean) as EquipmentItem[],
  };
}

// ---------------------------------------------------------------------------
// Section 10 — AI Recommendations
// ---------------------------------------------------------------------------

export interface Recommendation {
  action: string;
  priority: "Critical" | "High" | "Medium";
  reason: string;
  expectedImpact: string;
}

export function getRecommendations(tag: string): Recommendation[] {
  const e = getEquipmentByTag(tag);
  if (!e) return [];
  const recs: Recommendation[] = [];
  if (e.bearingTemp && e.bearingTemp > 75) {
    recs.push({
      action: "Inspect Bearing",
      priority: e.bearingTemp > 80 ? "Critical" : "High",
      reason: `Bearing temperature at ${e.bearingTemp}°C exceeds the 72°C normal band.`,
      expectedImpact: "Prevents unplanned trip; extends bearing life.",
    });
  }
  if (e.vibration && e.vibration > 3) {
    recs.push({
      action: "Lubricate Shaft",
      priority: e.vibration > 4 ? "High" : "Medium",
      reason: `Vibration at ${e.vibration} mm/s is trending toward the alarm threshold.`,
      expectedImpact: "Reduces vibration signature, avoids secondary bearing damage.",
    });
  }
  if (e.health === "critical") {
    recs.push({
      action: "Escalate",
      priority: "Critical",
      reason: `${e.tag} is in critical health with an active trip/isolation event.`,
      expectedImpact: "Ensures Plant Engineer / Manager visibility for shutdown approval.",
    });
    recs.push({
      action: "Raise Work Order",
      priority: "Critical",
      reason: "Corrective repair required before equipment can be returned to service.",
      expectedImpact: "Formal tracking of repair scope, parts and labor.",
    });
  }
  recs.push({
    action: "Generate RCA",
    priority: e.health === "healthy" ? "Medium" : "High",
    reason: "Consolidates AI investigation + review notes into a formal root-cause record.",
    expectedImpact: "Feeds the Knowledge Base for faster diagnosis of future similar failures.",
  });
  return recs;
}

// ---------------------------------------------------------------------------
// Section 11 — Evidence & Verification
// ---------------------------------------------------------------------------

export interface EvidenceItem {
  name: string;
  type: string;
  date: string;
  relevance: number;
  content: string;
  viewerKind: "text" | "pid" | "table" | "image";
}

export function getEvidence(tag: string, workflowIncidents: WorkflowIncident[] = []): EvidenceItem[] {
  const e = getEquipmentByTag(tag);
  if (!e) return [];
  const items: EvidenceItem[] = [];

  const oemDoc = documents.find((d) => d.type === "OEM Manual");
  if (oemDoc) {
    items.push({
      name: oemDoc.title,
      type: "OEM Manual",
      date: oemDoc.uploadDate,
      relevance: 96,
      content: `OEM: ${e.oem}. Commissioned ${e.commissionDate}. Nameplate type: ${e.type}. Refer to ${oemDoc.docNo ?? "OEM documentation"} for bearing tolerance and lubrication interval specifications.`,
      viewerKind: "text",
    });
  }

  const history = getMaintenanceHistory(tag);
  if (history.length) {
    items.push({
      name: `Maintenance Log — ${e.tag}`,
      type: "Maintenance Log",
      date: history[0].date,
      relevance: 93,
      content: history.map((h) => `${h.date} — [${h.type}] ${h.description} (${h.performedBy}, ${h.durationHrs}h)`).join("\n"),
      viewerKind: "table",
    });
  }

  const inspections = getInspectionReports(tag);
  items.push({
    name: `Inspection Report — ${e.tag}`,
    type: "Inspection Report",
    date: inspections[0]?.date ?? e.commissionDate,
    relevance: 90,
    content: inspections.map((i) => `${i.date} (${i.inspector}) — ${i.observations} [${i.status}]`).join("\n"),
    viewerKind: "table",
  });

  if (e.bearingTemp || e.vibration) {
    items.push({
      name: `Live Sensor Feed — ${e.tag}`,
      type: "Sensor Data",
      date: "Live",
      relevance: 97,
      content: `Bearing temperature: ${e.bearingTemp ?? "N/A"}°C\nVibration: ${e.vibration ?? "N/A"} mm/s\nRunning hours: ${e.runningHours.toLocaleString("en-IN")}\nLast event: ${e.lastTrip ?? "None"}`,
      viewerKind: "text",
    });
  }

  const rcas = getPreviousRcas(tag, workflowIncidents);
  if (rcas.length) {
    items.push({
      name: `Previous RCA — ${rcas[0].title}`,
      type: "Previous RCA",
      date: rcas[0].date,
      relevance: 89,
      content: `Root cause: ${rcas[0].rootCause}`,
      viewerKind: "text",
    });
  }

  const sops = getLinkedSops(tag);
  items.push({
    name: sops[0]?.title ?? "Linked SOP",
    type: "SOP",
    date: "Current revision",
    relevance: 85,
    content: `Source: ${sops[0]?.docRef}. Categories on file: ${sops.map((s) => s.category).join(", ")}.`,
    viewerKind: "text",
  });

  const pidDoc = documents.find((d) => d.type === "P&ID");
  if (pidDoc) {
    items.push({
      name: pidDoc.title,
      type: "P&ID Drawing",
      date: pidDoc.uploadDate,
      relevance: 91,
      content: `Location: ${e.location}`,
      viewerKind: "pid",
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Section 13 — Related Equipment
// ---------------------------------------------------------------------------

export function getRelatedEquipment(tag: string) {
  const e = getEquipmentByTag(tag);
  if (!e) return { usersAlsoViewed: [], similarEquipment: [], similarFailures: [] };
  const others = equipment.filter((o) => o.id !== e.id);
  return {
    usersAlsoViewed: others.slice(0, 3),
    similarEquipment: others.filter((o) => o.system === e.system || o.type === e.type).slice(0, 3),
    similarFailures: others.filter((o) => o.health !== "healthy" || o.lastTrip).slice(0, 3),
  };
}

// ---------------------------------------------------------------------------
// Spare parts (reused for the Action Panel / recommendations context)
// ---------------------------------------------------------------------------

export function getSpareParts() {
  return spareParts;
}
