import type { DocumentItem } from "./types";
import type { EvidenceCard, PdfContent } from "./documentViewer";

/** Real excerpt content per document, grounded in the source material each entry is drawn from. */
export const DOCUMENT_CONTENT: Record<string, string> = {
  "doc-1": `NTPC SIPAT SUPER THERMAL POWER PROJECT — STAGE-III (1×800 MW)
Bidding Document Ref: CS-8003-001-2

Drawing Index (P&ID set):
- XXXX-999-POM-A-004 — Main Steam, Hot Reheat & Cold Reheat P&ID
- XXXX-999-POM-A-005 — HP & LP Bypass System P&ID
- XXXX-001-POM-A-015B — Centralised Nitrogen Filling System
- XXXX-101-POM-A-022 — Scheme of FGD-Absorber System
- XXXX-001-POM-A-018a/b — Air & Flue Gas Path
- 0000-104-POM-A-003 — Section of ESP Hopper

Drawing numbering follows a UNIT-AREA-DISCIPLINE-SHEET scheme (POM = mechanical, POI = instrumentation, POE = electrical single-line).
No built-in legend sheet — annotations in the P&ID Viewer are AI-generated for cross-reference.`,

  "doc-2": `NRL NUMALIGARH REFINERY EXPANSION PROJECT — POLYPROPYLENE UNIT
Detailed Feasibility Report, Rev.B — Ref: B394-RP-79-41-0001

Location: Numaligarh, Golaghat district, Assam
Capacity: 360 KTPA Polypropylene
Licensor: Lummus Novolen Technology
Estimated capex: ₹4,515 Cr
Key equipment: Propylene mounded storage bullets, cooling towers, PFCC feedstock unit (1.955 MMTPA upstream)

This DFR was prepared by EIL (Engineers India Limited) and forms the basis for detailed engineering of the propylene handling and polymerisation train.`,

  "doc-3": `NTPC O&M BEST PRACTICES MANUAL
Corporate Operation Services, PMI — February 2018

Contributing engineers: Ranjan Kumar (Corp. Operation Services), JSS Murty (Boiler Maintenance), A K Sehgal (Steam Turbine), Ramakanta Panda (Electrical), Anjan K. Pal (C&I), Biswadip Roy (Fuel/CHP), Bhanu Samanta (Ash Handling), Binod Kumar (BOP), Bikasendu Bhattacharya (Chemistry), V K Shahi (MMSD), S K Grover (R&M)

Selected practices on file:
- Boiler excess O2 optimisation — target 3.5% dry-basis, reducible to 2.5–2.8% with CO monitoring
- Mill optimisation for combustion tuning
- Controlled fast cooling of steam turbine during planned shutdown
- HP/IP inner-casing parting-plane fasteners replaced every 100,000 running hours
- Condenser tube eddy-current testing every 1 lakh (100,000) running hours
- Boiler & turbine protection checking every 3 months
- Dissolved gas analysis of transformers`,

  "doc-4": `KSB "Ixo N" SUBMERSIBLE BOREHOLE PUMP
Installation / Operating Manual — Original operating manual
© KSB SE & Co. KGaA, Frankenthal — dated 21/05/2021

Sections on file: Glossary · General (principles, target group, safety symbols) · Safety (intended use, personnel qualification, consequences of non-compliance, safety information for operation/maintenance/inspection/installation).

Used at SIPAT STPP as the OEM reference for submersible/borehole pump installation, commissioning and lubrication interval specifications.`,

  "doc-5": `OISD — LETTER TO PNGRB
Ref: OISD/ENGG/GEN/22, dated 30-Apr-2020
Subject: Applicability of OISD Standards to Refineries / Gas Plants

Mandatory standards referenced:
- OISD STD 105 — Work Permit System
- OISD STD 106 — Pressure Relief & Disposal System
- OISD STD 116 — Fire Protection Facilities for Refineries/Gas Plants
- OISD STD 118 — Layouts for Oil & Gas Installations
- OISD STD 128 — Inspection of Unfired Pressure Vessels
- OISD STD 129 — Inspection of Storage Tanks
- OISD RP 149 — Design aspects for safety in electrical systems
- OISD STD 150 — LPG Mounded Storage design/safety
- OISD GDN 178 — Management of Change

Full annexure lists 60 OISD standards in total; the above are tracked in the Safety & Compliance module.`,

  "doc-6": `ASIAN DEVELOPMENT BANK — PROJECT COMPLETION REPORT
Unchahar Thermal Power Station (NTPC), Uttar Pradesh — 2×210 MW
ADB Loan 907-IND, September 2002

Performance trend:
- FY2000: Availability 97.53% · PLF 97.53%
- FY2001: Availability 85.98% · PLF 84.42% · Aux. consumption 8.31% · Heat rate 2,473 kcal/kWh
- FY2002: Availability 95.03% · PLF 91.21% · Aux. consumption 8.56% · Heat rate 2,464 kcal/kWh

Ranked 9th-best plant (FY2001) and 5th-best plant (FY2002) by the Ministry of Power / NREB.
Key lesson on record: "NTPC has demonstrated that it can turn around poorly performing power plants within a reasonable time."`,

  "doc-7": `CONDITION-BASED MAINTENANCE OF POWER PLANT MACHINERY THROUGH NDT AND EMERGING TECHNIQUES
S. Ravichandran — IJMET, 2010

Case 1 — Cooling System Fan: high vibration + abnormal noise.
Pre-repair: DE bearing 11/9 (µm/mm·s⁻¹), NDE bearing 10/7, bearing base 6/8 — all outside acceptable limits.
Root cause: impeller and bearing damaged, pulley key missing, locking bolt sheared, pulley displaced.
Post-repair: DE 5/1.4, NDE 5/1.2, base 3.4/0.8 — within limits.

Case 2 — Purge Fan No. 12 (East): SPM readings 35–50 dBN (above the 35 dBN bearing-replacement threshold).
Root cause: shaft worn at stuffing box area, shaft bent.
Corrective action: new shaft fitted, rotor balanced; plummer block and bearings checked at parting plane with nib corrections.`,

  "doc-8": `MAITHON POWER LIMITED — HVAC/AC SYSTEMS AMC (O&M)
Expression of Interest — Ref: MPL/MMD/DB/2026/2000092852

Site: 2×525 MW Maithon Thermal Power Plant, Dhanbad district, Jharkhand (74:26 JV of Tata Power & DVC)

Major equipment in scope:
- Screw Chiller (Voltas, 2W+1S, 240 TR, R134A, semi-hermetic screw compressor)
- Chilled/Condenser Water Pumps (Kirloskar Brothers, CE 80/40 & CE 100/32, 200 m³/hr, 30 kW)
- Cooling Tower (Mihir Polacel, cross-flow, spiral bevel gear drive)
- Air Handling Units (Voltas, Krugger fans) across TG Building, ESP Control Rooms, Technical Building

SLA highlights: Critical equipment availability ≥99% (Rs 25,000 penalty per 1% shortfall); MTTR <5 hrs/month for critical equipment; RCA of breakdowns due within 7 days (Rs 5,000/day penalty for late submission).`,

  "doc-9": `BHEL TECHNICAL SPECIFICATION — HYDROGEN GENERATION PLANT
TANGEDCO Ennore SEZ Supercritical Thermal Power Project, Tamil Nadu
Specification No. PETS412168A001 — BHEL Power Sector, Project Engineering Management, Noida

Volume II-B covers specific technical requirements (mechanical & electrical) for the Hydrogen Generation Plant package, including Annexures for Quality Plan, Sub-vendors List, Functional Guarantees & Liquidated Damages, Mandatory Spares List, and Guaranteed Performance Data.

Note: source document uses a non-standard embedded font encoding; some sections require OCR re-processing for full-text search (flagged "Needs Review" in the library).`,
};

const STATUS_LABEL: Record<DocumentItem["status"], string> = {
  indexed: "Indexed",
  processing: "Processing",
  "needs-review": "Needs Review",
};

/** Wraps a global document into an evidence card so it can open in the Universal Evidence Viewer. */
export function buildEvidenceForDocument(d: DocumentItem): EvidenceCard {
  const text = DOCUMENT_CONTENT[d.id] ?? "No extracted content available yet — this document is still processing.";

  if (d.type === "P&ID") {
    return {
      id: `ev-doc-${d.id}`,
      name: d.title,
      docType: "Drawing",
      uploadDate: d.uploadDate,
      relevance: 98,
      confidenceContribution: 20,
      version: d.docNo,
      uploadedBy: "EIL Drafting",
      fileSize: "2.1 MB",
      status: STATUS_LABEL[d.status],
      content: { kind: "pid" },
    };
  }

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const pdf: PdfContent = {
    kind: "pdf",
    aiPage: 1,
    aiParagraphIndex: 0,
    pages: [{ pageNumber: 1, heading: d.title, paragraphs }],
  };
  return {
    id: `ev-doc-${d.id}`,
    name: d.title,
    docType: "PDF",
    uploadDate: d.uploadDate,
    relevance: 98,
    confidenceContribution: 18,
    version: d.docNo,
    uploadedBy: "System",
    fileSize: "1.4 MB",
    status: STATUS_LABEL[d.status],
    content: pdf,
  };
}
