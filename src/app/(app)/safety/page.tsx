"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertOctagon, Phone, ChevronRight, Download, Share2, CheckCircle2, FilePlus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { downloadTextFile, printToPdf, shareOrCopyLink } from "@/lib/download";
import { formatDateTime, formatDate } from "@/lib/dateFormat";
import { useSession } from "@/lib/session";
import { getRoleAccess } from "@/lib/roles";
import {
  incidents,
  complianceRows,
  permits as initialPermits,
  emergencyProtocols,
  emergencyContacts,
} from "@/lib/mock-data";
import type { PermitToWork } from "@/lib/types";

type Tab = "hazard" | "checklists" | "incidents" | "compliance" | "ptw" | "emergency";

const TABS: { key: Tab; label: string }[] = [
  { key: "hazard", label: "Hazard Identification" },
  { key: "checklists", label: "Safety Checklists" },
  { key: "incidents", label: "Incident Analysis" },
  { key: "compliance", label: "Compliance Tracker" },
  { key: "ptw", label: "PTW Management" },
  { key: "emergency", label: "Emergency Response" },
];

const complianceTone = { pass: "green", warning: "amber", fail: "red" } as const;
const ptwTone = { active: "green", closed: "neutral", expired: "red" } as const;
const PTW_TYPES: PermitToWork["type"][] = ["Hot Work", "Cold Work", "Confined Space", "Electrical", "Height"];

const INITIAL_CHECKLISTS = [
  { title: "Pre-Startup Safety Review — Boiler Unit 3", done: 18, total: 22, submitted: false },
  { title: "Monthly Safety Inspection — Turbine Hall", done: 20, total: 20, submitted: false },
  { title: "Hot Work Permit Checklist", done: 9, total: 12, submitted: false },
];

const HAZARDS = [
  {
    hazard: "No emergency isolation valve on Centralised Nitrogen Filling System supply",
    sheet: "Drg. XXXX-001-POM-A-015B",
    severity: "high" as const,
    category: "Process Safety",
    recommendation: "Install manual isolation valve before the nitrogen injection point per OISD STD 106 (Pressure Relief & Disposal System)",
  },
  {
    hazard: "Platen superheater tube bank shows signs of erosion-driven thinning",
    sheet: "Drg. XXXX-999-POM-A-004",
    severity: "high" as const,
    category: "Mechanical Integrity",
    recommendation: "Schedule ultrasonic thickness survey on adjacent tube banks",
  },
  {
    hazard: "ID Fan-A vibration approaching alarm threshold",
    sheet: "Equipment Register",
    severity: "medium" as const,
    category: "Rotating Equipment",
    recommendation: "Perform vibration analysis and bearing inspection within 48 hours",
  },
];

export default function SafetyPage() {
  const { session } = useSession();
  const canDownload = getRoleAccess(session?.role).canDownloadDocuments;
  const [tab, setTab] = useState<Tab>("hazard");
  const [checklists, setChecklists] = useState(INITIAL_CHECKLISTS);
  const [permits, setPermits] = useState(initialPermits);
  const [ptwModalOpen, setPtwModalOpen] = useState(false);
  const [ptwForm, setPtwForm] = useState({ type: PTW_TYPES[0], location: "", issuedTo: "", validTill: "" });

  const openIncidents = incidents.filter((i) => i.status === "open").length;
  const overdueCompliance = complianceRows.filter((c) => c.status !== "pass").length;

  function submitChecklist(title: string) {
    setChecklists((prev) => prev.map((c) => (c.title === title ? { ...c, submitted: true } : c)));
    toast.success("Checklist submitted for review", { description: title });
  }

  function shareChecklist(title: string) {
    shareOrCopyLink(title, `MANTHAN safety checklist: ${title}`, window.location.href).then((result) => {
      if (result === "copied") toast.success("Link copied to clipboard", { description: title });
      if (result === "shared") toast.success("Shared", { description: title });
    });
  }

  function generateComplianceReport() {
    const lines = [
      "MANTHAN — Compliance Report",
      `Generated: ${formatDateTime()}`,
      "",
      ...complianceRows.map(
        (c) =>
          `${c.regulation} — ${c.requirement}\n  Status: ${c.status.toUpperCase()} · Last audit: ${formatDate(c.lastAudit)} · Next due: ${formatDate(c.nextDue)}`
      ),
    ];
    downloadTextFile("manthan-compliance-report.txt", lines.join("\n\n"));
    toast.success("Compliance report generated", { description: "Downloaded manthan-compliance-report.txt" });
  }

  function createPtw(e: React.FormEvent) {
    e.preventDefault();
    if (!ptwForm.location || !ptwForm.issuedTo || !ptwForm.validTill) {
      toast.error("Fill in all fields to create the permit.");
      return;
    }
    const newPermit: PermitToWork = {
      id: `ptw-${Date.now()}`,
      type: ptwForm.type,
      location: ptwForm.location,
      issuedTo: ptwForm.issuedTo,
      validTill: ptwForm.validTill,
      status: "active",
    };
    setPermits((prev) => [newPermit, ...prev]);
    setPtwModalOpen(false);
    setPtwForm({ type: PTW_TYPES[0], location: "", issuedTo: "", validTill: "" });
    toast.success("Permit to Work created", { description: `${newPermit.type} at ${newPermit.location}` });
  }

  return (
    <div className="mx-auto max-w-[1440px] p-6 md:p-8">
      <h1 className="font-display text-xl font-semibold text-text-primary md:text-2xl">Safety &amp; Compliance</h1>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Safety Score" value="94/100" tone="green" />
        <StatCard label="Open Incidents" value={String(openIncidents)} tone="amber" />
        <StatCard label="Overdue Inspections" value={String(overdueCompliance)} tone="red" />
        <StatCard label="PTW Active" value={String(permits.filter((p) => p.status === "active").length)} tone="blue" />
      </div>

      <div className="mt-7 flex gap-1 overflow-x-auto border-b border-border-subtle">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors ${
              tab === t.key ? "border-b-accent-blue text-text-primary" : "border-b-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "hazard" && (
          <div className="flex flex-col gap-4">
            {HAZARDS.map((h) => (
              <Card key={h.hazard} className="border-l-2 border-l-accent-red">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{h.hazard}</p>
                    <p className="mt-1.5 text-xs text-text-muted">{h.category} · {h.sheet}</p>
                  </div>
                  <Badge tone={h.severity === "high" ? "red" : "amber"}>{h.severity === "high" ? "High" : "Medium"}</Badge>
                </div>
                <p className="mt-3 text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">Recommendation:</span> {h.recommendation}
                </p>
                <Link href="/pid-viewer" className="mt-3 inline-flex items-center gap-1 text-xs text-accent-blue hover:underline">
                  View on P&amp;ID <ChevronRight className="h-3 w-3" />
                </Link>
              </Card>
            ))}
          </div>
        )}

        {tab === "checklists" && (
          <div className="flex flex-col gap-4">
            {checklists.map((c) => (
              <Card key={c.title}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{c.title}</p>
                  <span className="text-xs text-text-muted">
                    {c.done} of {c.total} items checked
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
                  <div className="h-full rounded-full bg-accent-green transition-all" style={{ width: `${(c.done / c.total) * 100}%` }} />
                </div>
                <div className="mt-4 flex gap-2 text-xs">
                  {canDownload && (
                    <button onClick={printToPdf} className="flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-2 transition-colors hover:bg-bg-tertiary">
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </button>
                  )}
                  <button onClick={() => shareChecklist(c.title)} className="flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-2 transition-colors hover:bg-bg-tertiary">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </button>
                  <button
                    onClick={() => submitChecklist(c.title)}
                    disabled={c.submitted}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 font-semibold transition ${
                      c.submitted ? "bg-accent-green/15 text-accent-green" : "bg-accent-blue text-white hover:brightness-90"
                    }`}
                  >
                    {c.submitted ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                      </>
                    ) : (
                      "Submit for Review"
                    )}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "incidents" && (
          <div className="flex flex-col gap-4">
            {incidents.map((inc) => (
              <Card key={inc.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{inc.title}</p>
                    <p className="mt-1.5 text-xs text-text-muted">{formatDate(inc.date)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge tone={inc.severity === "high" ? "red" : inc.severity === "medium" ? "amber" : "blue"}>{inc.severity}</Badge>
                    <Badge tone={inc.status === "open" ? "amber" : "green"}>{inc.status}</Badge>
                  </div>
                </div>
                <p className="mt-3 text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">Root cause:</span> {inc.rootCause}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium text-text-secondary">Contributing Factors</p>
                    <ul className="mt-1.5 list-inside list-disc text-[11px] text-text-muted">
                      {inc.contributingFactors.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-secondary">Corrective Actions</p>
                    <ul className="mt-1.5 list-inside list-disc text-[11px] text-text-muted">
                      {inc.correctiveActions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "compliance" && (
          <div className="overflow-hidden rounded-lg border border-border-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-tertiary text-text-secondary">
                  <tr>
                    <th className="px-4 py-3 font-medium">Regulation</th>
                    <th className="px-4 py-3 font-medium">Requirement</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last Audit</th>
                    <th className="px-4 py-3 font-medium">Next Due</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceRows.map((c) => (
                    <tr key={c.regulation} className="border-t border-border-subtle bg-bg-secondary">
                      <td className="px-4 py-3 font-medium text-text-primary">{c.regulation}</td>
                      <td className="px-4 py-3 text-text-secondary">{c.requirement}</td>
                      <td className="px-4 py-3">
                        <Badge tone={complianceTone[c.status]}>{c.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(c.lastAudit)}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(c.nextDue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {canDownload && (
              <div className="flex justify-end bg-bg-secondary px-4 py-3">
                <button onClick={generateComplianceReport} className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-90">
                  <Download className="h-3.5 w-3.5" /> Generate Compliance Report
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "ptw" && (
          <div className="overflow-hidden rounded-lg border border-border-subtle">
            <div className="flex justify-end bg-bg-secondary px-4 py-3">
              <button onClick={() => setPtwModalOpen(true)} className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3.5 py-2 text-xs font-semibold text-white transition hover:brightness-90">
                <FilePlus className="h-3.5 w-3.5" /> Create New PTW
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-tertiary text-text-secondary">
                  <tr>
                    <th className="px-4 py-3 font-medium">PTW No.</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Issued To</th>
                    <th className="px-4 py-3 font-medium">Valid Till</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {permits.map((p) => (
                    <tr key={p.id} className="border-t border-border-subtle bg-bg-secondary">
                      <td className="px-4 py-3 font-mono text-text-primary">{p.id.toUpperCase()}</td>
                      <td className="px-4 py-3 text-text-secondary">{p.type}</td>
                      <td className="px-4 py-3 text-text-secondary">{p.location}</td>
                      <td className="px-4 py-3 text-text-secondary">{p.issuedTo}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(p.validTill)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={ptwTone[p.status]}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "emergency" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {emergencyProtocols.map((p) => (
                <div key={p.id} className="rounded-lg border-2 border-accent-red/40 bg-bg-secondary p-5">
                  <AlertOctagon className="h-6 w-6 text-accent-red" />
                  <h3 className="mt-2.5 font-display text-sm font-semibold text-text-primary">{p.title}</h3>
                  <p className="mt-1.5 text-xs text-text-secondary">{p.description}</p>
                  <p className="mt-1.5 text-[11px] text-text-muted">Est. response time: {p.responseTime}</p>
                  <Link
                    href={`/chat?q=${encodeURIComponent(`Walk me through the emergency protocol for: ${p.title}`)}`}
                    className="mt-4 block rounded-md bg-accent-red py-2.5 text-center text-xs font-bold text-white transition hover:brightness-90"
                  >
                    OPEN EMERGENCY PROTOCOL
                  </Link>
                </div>
              ))}
            </div>
            <Card>
              <h3 className="font-display text-sm font-semibold text-text-primary">Emergency Contacts</h3>
              <div className="mt-4 flex flex-col gap-3">
                {emergencyContacts.map((c) => (
                  <div key={c.role} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{c.role}</span>
                    <a href={`tel:${c.contact}`} className="flex items-center gap-1 font-mono text-text-primary hover:text-accent-blue">
                      <Phone className="h-3 w-3 text-accent-green" /> {c.contact}
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <Modal open={ptwModalOpen} onClose={() => setPtwModalOpen(false)} title="Create New Permit to Work">
        <form onSubmit={createPtw} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="mb-1.5 block font-medium text-text-secondary">Type</label>
            <select
              value={ptwForm.type}
              onChange={(e) => setPtwForm((f) => ({ ...f, type: e.target.value as PermitToWork["type"] }))}
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary focus:border-border-active focus:outline-none"
            >
              {PTW_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-medium text-text-secondary">Location</label>
            <input
              value={ptwForm.location}
              onChange={(e) => setPtwForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Boiler House — Superheater platform"
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-border-active focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-medium text-text-secondary">Issued To</label>
            <input
              value={ptwForm.issuedTo}
              onChange={(e) => setPtwForm((f) => ({ ...f, issuedTo: e.target.value }))}
              placeholder="Employee name"
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-border-active focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-medium text-text-secondary">Valid Till</label>
            <input
              type="datetime-local"
              value={ptwForm.validTill}
              onChange={(e) => setPtwForm((f) => ({ ...f, validTill: e.target.value }))}
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary focus:border-border-active focus:outline-none"
            />
          </div>
          <button type="submit" className="mt-1 rounded-md bg-accent-blue py-2.5 font-semibold text-white transition hover:brightness-90">
            Create Permit
          </button>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "green" | "amber" | "red" | "blue" }) {
  const toneColor = { green: "text-accent-green", amber: "text-accent-amber", red: "text-accent-red", blue: "text-accent-blue" }[tone];
  return (
    <Card>
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`mt-1.5 font-display text-2xl font-bold ${toneColor}`}>{value}</p>
    </Card>
  );
}
