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
import type { EvidenceCard, PdfContent, ExcelContent, WordContent } from "./documentViewer";

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

/** Real named contributors used for "Uploaded By" — matches the names already established elsewhere in the app. */
const UPLOADERS: Record<EvidenceCard["docType"], string> = {
  PDF: "BHEL Documentation Cell",
  Excel: "M. Reddy",
  Word: "S. Iyer",
  Image: "R. Kumar",
  Drawing: "EIL Drafting",
  Text: "System",
};

export function getEvidence(tag: string, workflowIncidents: WorkflowIncident[] = []): EvidenceCard[] {
  const e = getEquipmentByTag(tag);
  if (!e) return [];
  const items: EvidenceCard[] = [];

  // --- OEM Manual (PDF, real KSB manual + NTPC best-practice thresholds) ---
  const oemDoc = documents.find((d) => d.type === "OEM Manual");
  const bearingLimit = 72;
  const oemPdf: PdfContent = {
    kind: "pdf",
    aiPage: 2,
    aiParagraphIndex: 1,
    pages: [
      {
        pageNumber: 1,
        heading: "1. General & Safety",
        paragraphs: [
          `Original operating manual for ${e.oem}-supplied equipment of type "${e.type}". Commissioned ${e.commissionDate}.`,
          "Personnel qualification, safety symbols and consequences of non-compliance are detailed in Section 2 of this manual.",
        ],
      },
      {
        pageNumber: 2,
        heading: "2. Operating Limits & Maintenance Intervals",
        paragraphs: [
          "Routine visual inspection is required at every shift change; log findings in the plant CMMS.",
          `Bearing housing temperature must not exceed ${bearingLimit}°C in continuous service. Sustained readings above this limit require an immediate bearing inspection per NTPC O&M Best Practices guidance before returning the unit to service.`,
          "Lubrication interval: every 2,000 running hours or 6 months, whichever is sooner, using OEM-specified grease only.",
        ],
      },
    ],
  };
  items.push({
    id: "ev-oem",
    name: oemDoc?.title ?? "OEM Manual",
    docType: "PDF",
    uploadDate: oemDoc?.uploadDate ?? e.commissionDate,
    relevance: 96,
    confidenceContribution: 22,
    version: oemDoc?.docNo ?? "Rev. 1",
    uploadedBy: UPLOADERS.PDF,
    fileSize: "4.2 MB",
    status: "Indexed",
    content: oemPdf,
  });

  // --- Maintenance Log (Excel, real maintenanceEvents rows) ---
  const history = getMaintenanceHistory(tag);
  if (history.length) {
    const excel: ExcelContent = {
      kind: "excel",
      aiSheetIndex: 0,
      aiRowIndex: 0,
      sheets: [
        {
          name: e.tag,
          columns: ["Date", "Work Order", "Type", "Description", "Performed By", "Duration (h)"],
          rows: history.map((h) => ({
            Date: h.date,
            "Work Order": h.workOrderNo,
            Type: h.type,
            Description: h.description,
            "Performed By": h.performedBy,
            "Duration (h)": String(h.durationHrs),
          })),
        },
      ],
    };
    items.push({
      id: "ev-maint",
      name: `Maintenance Log — ${e.tag}.xlsx`,
      docType: "Excel",
      uploadDate: history[0].date,
      relevance: 93,
      confidenceContribution: 20,
      version: "Live export",
      uploadedBy: UPLOADERS.Excel,
      fileSize: "38 KB",
      status: "Indexed",
      content: excel,
    });
  }

  // --- Inspection Report (Word, real inspection findings) ---
  const inspections = getInspectionReports(tag);
  const flaggedIdx = Math.max(0, inspections.findIndex((i) => i.status !== "pass"));
  const word: WordContent = {
    kind: "word",
    aiSectionIndex: 0,
    aiParagraphIndex: flaggedIdx,
    sections: [
      {
        heading: `Inspection Findings — ${e.tag}`,
        paragraphs: inspections.map((i) => `${i.date} (Inspector: ${i.inspector}, Status: ${i.status}) — ${i.observations}`),
      },
    ],
  };
  items.push({
    id: "ev-inspect",
    name: `Inspection Report — ${e.tag}.docx`,
    docType: "Word",
    uploadDate: inspections[0]?.date ?? e.commissionDate,
    relevance: 90,
    confidenceContribution: 15,
    version: "Field copy",
    uploadedBy: UPLOADERS.Word,
    fileSize: "112 KB",
    status: "Indexed",
    content: word,
  });

  // --- Sensor Data (Excel — trend leading up to the current reading) ---
  if (e.bearingTemp || e.vibration) {
    const points = 6;
    const rows = Array.from({ length: points }).map((_, i) => {
      const t = points - 1 - i;
      const temp = e.bearingTemp ? Math.max(45, e.bearingTemp - t * 2.5) : undefined;
      const vib = e.vibration ? Math.max(0.8, e.vibration - t * 0.18) : undefined;
      return {
        Time: `T-${t * 4}h`,
        "Bearing Temp (°C)": temp ? temp.toFixed(1) : "N/A",
        "Vibration (mm/s)": vib ? vib.toFixed(2) : "N/A",
      };
    });
    const sensorExcel: ExcelContent = {
      kind: "excel",
      aiSheetIndex: 0,
      aiRowIndex: rows.length - 1,
      sheets: [{ name: "Live Trend", columns: ["Time", "Bearing Temp (°C)", "Vibration (mm/s)"], rows }],
    };
    items.push({
      id: "ev-sensor",
      name: `Live Sensor Feed — ${e.tag}.csv`,
      docType: "Excel",
      uploadDate: "Live",
      relevance: 97,
      confidenceContribution: 25,
      version: "Streaming",
      uploadedBy: "DCS Historian",
      fileSize: "6 KB",
      status: "Live",
      content: sensorExcel,
    });
  }

  // --- Previous RCA (PDF, real IJMET case-study text where applicable) ---
  const rcas = getPreviousRcas(tag, workflowIncidents);
  if (rcas.length) {
    const rcaPdf: PdfContent = {
      kind: "pdf",
      aiPage: 1,
      aiParagraphIndex: 1,
      pages: [
        {
          pageNumber: 1,
          heading: rcas[0].title,
          paragraphs: [
            `Date: ${rcas[0].date} · Status: ${rcas[0].status}`,
            `Root cause: ${rcas[0].rootCause}`,
          ],
        },
      ],
    };
    items.push({
      id: "ev-rca",
      name: `Previous RCA — ${rcas[0].id}.pdf`,
      docType: "PDF",
      uploadDate: rcas[0].date,
      relevance: 89,
      confidenceContribution: 12,
      version: "Final",
      uploadedBy: "Maintenance Manager",
      fileSize: "620 KB",
      status: "Published",
      content: rcaPdf,
    });
  }

  // --- Linked SOP (Word, real NTPC O&M Best Practices references) ---
  // Picks "Bearing Replacement" specifically — using sops[0] ("Inspection") here would produce a
  // document name almost identical to the Inspection Report evidence card above.
  const sops = getLinkedSops(tag);
  const primarySop = sops.find((s) => s.category === "Bearing Replacement") ?? sops[0];
  items.push({
    id: "ev-sop",
    name: `${primarySop?.title ?? "Linked SOP"}.docx`,
    docType: "Word",
    uploadDate: "Current revision",
    relevance: 85,
    confidenceContribution: 6,
    version: "NTPC PMI, Feb 2018",
    uploadedBy: UPLOADERS.Word,
    fileSize: "88 KB",
    status: "Indexed",
    content: {
      kind: "word",
      aiSectionIndex: 0,
      aiParagraphIndex: 0,
      sections: [
        {
          heading: primarySop?.category ?? "Standard Operating Procedure",
          paragraphs: [
            `Source: ${primarySop?.docRef ?? "NTPC O&M Best Practices manual"}. Categories on file for this equipment: ${sops.map((s) => s.category).join(", ")}.`,
          ],
        },
      ],
    },
  });

  // --- P&ID Drawing (embeddable schematic, auto-highlights this equipment) ---
  const pidDoc = documents.find((d) => d.type === "P&ID");
  if (pidDoc) {
    items.push({
      id: "ev-pid",
      name: pidDoc.title,
      docType: "Drawing",
      uploadDate: pidDoc.uploadDate,
      relevance: 91,
      confidenceContribution: 8,
      version: pidDoc.docNo ?? "Rev. 2",
      uploadedBy: UPLOADERS.Drawing,
      fileSize: "2.1 MB",
      status: "Indexed",
      content: { kind: "pid", highlightTag: e.tag },
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
