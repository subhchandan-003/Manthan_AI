"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FileText, LayoutGrid, List, Search, Download, MessageSquare } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { UploadZone } from "@/components/documents/UploadZone";
import { KnowledgeGraph } from "@/components/documents/KnowledgeGraph";
import { downloadTextFile } from "@/lib/download";
import { documents } from "@/lib/mock-data";
import type { DocumentItem } from "@/lib/types";

const TYPES: Array<DocumentItem["type"] | "All"> = [
  "All",
  "P&ID",
  "PFD",
  "SOP",
  "Maintenance Log",
  "Safety Manual",
  "OEM Manual",
  "Inspection Report",
  "Reference Report",
];

const typeTone = {
  "P&ID": "purple",
  PFD: "purple",
  SOP: "blue",
  "Maintenance Log": "amber",
  "Safety Manual": "red",
  "OEM Manual": "cyan",
  "Inspection Report": "green",
  "Reference Report": "neutral",
} as const;

const statusLabel = { indexed: "Indexed ✓", processing: "Processing…", "needs-review": "Needs Review" } as const;
const statusTone = { indexed: "green", processing: "amber", "needs-review": "red" } as const;

/** Real excerpt content per document, grounded in the source material each entry is drawn from. */
const DOCUMENT_CONTENT: Record<string, string> = {
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

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState<(typeof TYPES)[number]>("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) =>
          (typeFilter === "All" || d.type === typeFilter) &&
          d.title.toLowerCase().includes(search.toLowerCase())
      ),
    [typeFilter, search]
  );

  function handleDownload(d: DocumentItem) {
    const content = `MANTHAN — Document Record
Title: ${d.title}
Type: ${d.type}
Reference: ${d.docNo ?? "—"}
Status: ${statusLabel[d.status]}
Uploaded: ${d.uploadDate}
${d.tagsIdentified ? `Equipment tags identified: ${d.tagsIdentified}\n` : ""}${
      d.loopsMapped ? `Control loops mapped: ${d.loopsMapped}\n` : ""
    }`;
    downloadTextFile(`${d.title.slice(0, 40).replace(/[^\w-]+/g, "_")}.txt`, content);
    toast.success("Download started", { description: d.title });
  }

  return (
    <div className="mx-auto max-w-[1440px] p-6 md:p-8">
      <h1 className="font-display text-xl font-semibold text-text-primary md:text-2xl">Document Intelligence Hub</h1>
      <p className="mt-1.5 text-sm text-text-secondary">
        Upload, process and cross-reference your plant&apos;s P&amp;IDs, SOPs and maintenance records.
      </p>

      <Card className="mt-6">
        <CardHeader title="Upload Documents" />
        <UploadZone />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as (typeof TYPES)[number])}
              className="rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary focus:border-border-active focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-muted focus-within:border-border-active">
              <Search className="h-3.5 w-3.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, tag, equipment..."
                className="w-full bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
            <div className="flex rounded-md border border-border-subtle">
              <button
                onClick={() => setView("grid")}
                className={`p-2 transition-colors ${view === "grid" ? "bg-bg-tertiary text-text-primary" : "text-text-muted"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 transition-colors ${view === "list" ? "bg-bg-tertiary text-text-primary" : "text-text-muted"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={view === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "flex flex-col gap-3"}>
            {filtered.map((d) => (
              <div key={d.id} className="rounded-md border border-border-subtle bg-bg-primary p-4 transition-colors hover:border-border-active/50">
                <div className="flex items-start gap-2.5">
                  <FileText className="h-5 w-5 shrink-0 text-accent-purple" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-text-primary">{d.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone={typeTone[d.type]}>{d.type}</Badge>
                      <Badge tone={statusTone[d.status]}>{statusLabel[d.status]}</Badge>
                    </div>
                    {(d.tagsIdentified || d.loopsMapped) && (
                      <p className="mt-2 text-[11px] text-text-muted">
                        {d.tagsIdentified ?? 0} equipment tags identified · {d.loopsMapped ?? 0} control loops mapped
                      </p>
                    )}
                    {d.docNo && <p className="mt-1 font-mono text-[11px] text-text-muted">Ref: {d.docNo}</p>}
                    <p className="mt-1 text-[11px] text-text-muted">Uploaded {d.uploadDate}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 text-xs">
                  {d.type === "P&ID" ? (
                    <Link
                      href="/pid-viewer"
                      className="flex-1 rounded-md border border-border-subtle py-2 text-center font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                    >
                      View
                    </Link>
                  ) : (
                    <button
                      onClick={() => setPreviewDoc(d)}
                      className="flex-1 rounded-md border border-border-subtle py-2 text-center font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                    >
                      View
                    </button>
                  )}
                  <Link
                    href={
                      d.type === "P&ID"
                        ? "/pid-viewer"
                        : `/chat?q=${encodeURIComponent(`Tell me about the document "${d.title}"`)}`
                    }
                    className="flex-1 rounded-md border border-border-subtle py-2 text-center font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                  >
                    Analyze
                  </Link>
                  <button
                    onClick={() => handleDownload(d)}
                    aria-label="Download"
                    className="rounded-md border border-border-subtle px-2.5 py-2 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-text-muted">No documents match your filters.</p>
            )}
          </div>
          <p className="mt-5 text-[11px] text-text-muted">
            Showing {filtered.length} of {documents.length} documents
          </p>
        </Card>

        <Card>
          <CardHeader title="Knowledge Graph" />
          <KnowledgeGraph />
        </Card>
      </div>

      <Modal open={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.title ?? ""} size="lg">
        {previewDoc && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={typeTone[previewDoc.type]}>{previewDoc.type}</Badge>
              <Badge tone={statusTone[previewDoc.status]}>{statusLabel[previewDoc.status]}</Badge>
            </div>
            <dl className="space-y-1.5 text-xs">
              {previewDoc.docNo && (
                <div className="flex justify-between gap-3">
                  <dt className="text-text-secondary">Reference</dt>
                  <dd className="font-mono text-text-primary">{previewDoc.docNo}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-text-secondary">Uploaded</dt>
                <dd className="text-text-primary">{previewDoc.uploadDate}</dd>
              </div>
              {previewDoc.tagsIdentified !== undefined && (
                <div className="flex justify-between gap-3">
                  <dt className="text-text-secondary">Equipment tags</dt>
                  <dd className="text-text-primary">{previewDoc.tagsIdentified}</dd>
                </div>
              )}
            </dl>
            <pre className="whitespace-pre-wrap rounded-lg border border-border-subtle bg-bg-primary p-4 font-mono text-xs leading-relaxed text-text-secondary">
              {DOCUMENT_CONTENT[previewDoc.id] ?? "No extracted content available yet — this document is still processing."}
            </pre>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleDownload(previewDoc)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border-subtle py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
              <Link
                href={`/chat?q=${encodeURIComponent(`Tell me about the document "${previewDoc.title}"`)}`}
                onClick={() => setPreviewDoc(null)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent-blue py-2 text-xs font-semibold text-white transition hover:brightness-90"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Ask AI
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
