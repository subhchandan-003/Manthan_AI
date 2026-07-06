"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertOctagon, Phone, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  incidents,
  complianceRows,
  permits,
  emergencyProtocols,
  emergencyContacts,
} from "@/lib/mock-data";

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

const CHECKLISTS = [
  { title: "Pre-Startup Safety Review — Boiler Unit 3", done: 18, total: 22 },
  { title: "Monthly Safety Inspection — Turbine Hall", done: 20, total: 20 },
  { title: "Hot Work Permit Checklist", done: 9, total: 12 },
];

const HAZARDS = [
  {
    hazard: "No emergency isolation valve on nitrogen supply to boiler",
    sheet: "P&ID Sheet 22",
    severity: "high" as const,
    category: "Process Safety",
    recommendation: "Install manual isolation valve before nitrogen injection point per OISD-154",
  },
  {
    hazard: "Superheater tube bank shows signs of erosion-driven thinning",
    sheet: "P&ID Sheet 10",
    severity: "high" as const,
    category: "Mechanical Integrity",
    recommendation: "Schedule ultrasonic thickness survey on adjacent tube banks",
  },
  {
    hazard: "ID Fan 3A vibration approaching alarm threshold",
    sheet: "Equipment Register",
    severity: "medium" as const,
    category: "Rotating Equipment",
    recommendation: "Perform vibration analysis and bearing inspection within 48 hours",
  },
];

export default function SafetyPage() {
  const [tab, setTab] = useState<Tab>("hazard");
  const openIncidents = incidents.filter((i) => i.status === "open").length;
  const overdueCompliance = complianceRows.filter((c) => c.status !== "pass").length;

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <h1 className="font-display text-xl font-semibold text-text-primary">Safety &amp; Compliance</h1>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Safety Score" value="94/100" tone="green" />
        <StatCard label="Open Incidents" value={String(openIncidents)} tone="amber" />
        <StatCard label="Overdue Inspections" value={String(overdueCompliance)} tone="red" />
        <StatCard label="PTW Active" value={String(permits.filter((p) => p.status === "active").length)} tone="blue" />
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border-subtle">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-2 text-xs font-medium ${
              tab === t.key ? "border-b-accent-blue text-text-primary" : "border-b-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "hazard" && (
          <div className="flex flex-col gap-3">
            {HAZARDS.map((h) => (
              <Card key={h.hazard} className="border-l-2 border-l-accent-red">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{h.hazard}</p>
                    <p className="mt-1 text-xs text-text-muted">{h.category} · {h.sheet}</p>
                  </div>
                  <Badge tone={h.severity === "high" ? "red" : "amber"}>{h.severity === "high" ? "High" : "Medium"}</Badge>
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">Recommendation:</span> {h.recommendation}
                </p>
                <Link href="/pid-viewer" className="mt-2 inline-flex items-center gap-1 text-xs text-accent-blue hover:underline">
                  View on P&amp;ID <ChevronRight className="h-3 w-3" />
                </Link>
              </Card>
            ))}
          </div>
        )}

        {tab === "checklists" && (
          <div className="flex flex-col gap-3">
            {CHECKLISTS.map((c) => (
              <Card key={c.title}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-primary">{c.title}</p>
                  <span className="text-xs text-text-muted">
                    {c.done} of {c.total} items checked
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
                  <div className="h-full rounded-full bg-accent-green" style={{ width: `${(c.done / c.total) * 100}%` }} />
                </div>
                <div className="mt-3 flex gap-2 text-xs">
                  <button className="rounded-md border border-border-subtle px-2.5 py-1.5 hover:bg-bg-tertiary">Download PDF</button>
                  <button className="rounded-md border border-border-subtle px-2.5 py-1.5 hover:bg-bg-tertiary">Share</button>
                  <button className="rounded-md bg-accent-blue px-2.5 py-1.5 font-semibold text-white hover:bg-[#2f78e6]">Submit for Review</button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "incidents" && (
          <div className="flex flex-col gap-3">
            {incidents.map((inc) => (
              <Card key={inc.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{inc.title}</p>
                    <p className="mt-1 text-xs text-text-muted">{inc.date}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge tone={inc.severity === "high" ? "red" : inc.severity === "medium" ? "amber" : "blue"}>{inc.severity}</Badge>
                    <Badge tone={inc.status === "open" ? "amber" : "green"}>{inc.status}</Badge>
                  </div>
                </div>
                <p className="mt-2 text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">Root cause:</span> {inc.rootCause}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium text-text-secondary">Contributing Factors</p>
                    <ul className="mt-1 list-inside list-disc text-[11px] text-text-muted">
                      {inc.contributingFactors.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-text-secondary">Corrective Actions</p>
                    <ul className="mt-1 list-inside list-disc text-[11px] text-text-muted">
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
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-tertiary text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium">Regulation</th>
                  <th className="px-3 py-2 font-medium">Requirement</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Last Audit</th>
                  <th className="px-3 py-2 font-medium">Next Due</th>
                </tr>
              </thead>
              <tbody>
                {complianceRows.map((c) => (
                  <tr key={c.regulation} className="border-t border-border-subtle bg-bg-secondary">
                    <td className="px-3 py-2 font-medium text-text-primary">{c.regulation}</td>
                    <td className="px-3 py-2 text-text-secondary">{c.requirement}</td>
                    <td className="px-3 py-2">
                      <Badge tone={complianceTone[c.status]}>{c.status}</Badge>
                    </td>
                    <td className="px-3 py-2 text-text-secondary">{c.lastAudit}</td>
                    <td className="px-3 py-2 text-text-secondary">{c.nextDue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end bg-bg-secondary px-3 py-2.5">
              <button className="rounded-md bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2f78e6]">
                Generate Compliance Report
              </button>
            </div>
          </div>
        )}

        {tab === "ptw" && (
          <div className="overflow-hidden rounded-lg border border-border-subtle">
            <div className="flex justify-end bg-bg-secondary px-3 py-2.5">
              <button className="rounded-md bg-accent-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2f78e6]">
                Create New PTW
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-tertiary text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium">PTW No.</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Issued To</th>
                  <th className="px-3 py-2 font-medium">Valid Till</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {permits.map((p) => (
                  <tr key={p.id} className="border-t border-border-subtle bg-bg-secondary">
                    <td className="px-3 py-2 font-mono text-text-primary">{p.id.toUpperCase()}</td>
                    <td className="px-3 py-2 text-text-secondary">{p.type}</td>
                    <td className="px-3 py-2 text-text-secondary">{p.location}</td>
                    <td className="px-3 py-2 text-text-secondary">{p.issuedTo}</td>
                    <td className="px-3 py-2 text-text-secondary">{p.validTill}</td>
                    <td className="px-3 py-2">
                      <Badge tone={ptwTone[p.status]}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "emergency" && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {emergencyProtocols.map((p) => (
                <div key={p.id} className="rounded-lg border-2 border-accent-red/40 bg-bg-secondary p-4">
                  <AlertOctagon className="h-6 w-6 text-accent-red" />
                  <h3 className="mt-2 font-display text-sm font-semibold text-text-primary">{p.title}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{p.description}</p>
                  <p className="mt-1 text-[11px] text-text-muted">Est. response time: {p.responseTime}</p>
                  <Link
                    href={`/chat?q=${encodeURIComponent(`Walk me through the emergency protocol for: ${p.title}`)}`}
                    className="mt-3 block rounded-md bg-accent-red py-2 text-center text-xs font-bold text-white hover:bg-[#dc2626]"
                  >
                    OPEN EMERGENCY PROTOCOL
                  </Link>
                </div>
              ))}
            </div>
            <Card>
              <h3 className="font-display text-sm font-semibold text-text-primary">Emergency Contacts</h3>
              <div className="mt-3 flex flex-col gap-2.5">
                {emergencyContacts.map((c) => (
                  <div key={c.role} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{c.role}</span>
                    <span className="flex items-center gap-1 font-mono text-text-primary">
                      <Phone className="h-3 w-3 text-accent-green" /> {c.contact}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "green" | "amber" | "red" | "blue" }) {
  const toneColor = { green: "text-accent-green", amber: "text-accent-amber", red: "text-accent-red", blue: "text-accent-blue" }[tone];
  return (
    <Card>
      <p className="text-xs text-text-secondary">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${toneColor}`}>{value}</p>
    </Card>
  );
}
