"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, MessageSquare, GitBranch, ClipboardPlus, AlertTriangle, Info, PackageCheck, ArrowLeft, Siren } from "lucide-react";
import { HealthDot } from "@/components/ui/HealthDot";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "@/lib/session";
import { getRoleAccess } from "@/lib/roles";
import { useIncidents } from "@/lib/incidentsStore";
import { STAGE_LABEL } from "@/lib/incidentWorkflow";
import { equipment, maintenanceEvents, spareParts } from "@/lib/mock-data";
import type { EquipmentItem } from "@/lib/types";

type Tab = "overview" | "history" | "recommendations" | "sops" | "spares" | "troubleshooting";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "history", label: "Maintenance History" },
  { key: "recommendations", label: "AI Recommendations" },
  { key: "sops", label: "Linked SOPs" },
  { key: "spares", label: "Spare Parts" },
  { key: "troubleshooting", label: "Troubleshooting" },
];

const eventTone = { PM: "green", CM: "amber", Overhaul: "blue", Emergency: "red" } as const;

const SOP_LIBRARY: Record<string, string[]> = {
  "ID Fan-A": [
    "NTPC O&M Best Practices — Boiler & Turbine Protection Checking (every 3 months)",
    "NTPC O&M Best Practices — Mill/Draft-system optimisation guidance (Contact: Sh JSS Murty, Boiler Maintenance)",
  ],
  "Cooling System Fan": [
    "IJMET 2010 NDT case study — Cooling System Fan vibration diagnosis & repair procedure",
  ],
  "Purge Fan No. 12 (East)": [
    "IJMET 2010 NDT case study — Purge Fan shaft/SPM diagnosis & repair procedure",
  ],
};

const SYMPTOMS = ["High vibration", "High bearing temp", "Abnormal noise", "Low discharge pressure", "High motor current", "Trip event"];

const TROUBLESHOOT_STEPS: Record<string, { instruction: string; sop: string; safety: string }[]> = {
  "High vibration": [
    { instruction: "Check bearing oil level and quality", sop: "NTPC O&M Best Practices manual", safety: "Ensure fan is isolated per LOTO before opening inspection port" },
    { instruction: "Verify coupling alignment using dial gauge", sop: "NTPC O&M Best Practices manual", safety: "Wear hearing protection near running equipment" },
    { instruction: "Check Shock Pulse Meter (SPM) bearing reading against the 20/35 dBN observe/replace thresholds", sop: "IJMET 2010 NDT case study", safety: "Confined space entry permit required if entering fan casing" },
  ],
  "High bearing temp": [
    { instruction: "Confirm lubrication system flow and pressure", sop: "NTPC O&M Best Practices manual", safety: "Allow bearing housing to cool before manual contact" },
    { instruction: "Check cooling water supply to bearing jacket", sop: "NTPC O&M Best Practices manual", safety: "Verify isolation valves before opening cooling circuit" },
    { instruction: "Review vibration trend for correlated rise", sop: "IJMET 2010 NDT case study", safety: "No special precaution — remote monitoring only" },
  ],
};

const READONLY_HIDDEN_TABS: Tab[] = ["spares", "troubleshooting"];

function MaintenanceContent() {
  const { session } = useSession();
  const searchParams = useSearchParams();
  const { incidents } = useIncidents();
  const isReadOnly = getRoleAccess(session?.role).maintenance === "readonly";
  const visibleTabs = isReadOnly ? TABS.filter((t) => !READONLY_HIDDEN_TABS.includes(t.key)) : TABS;

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(equipment[0].id);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [symptom, setSymptom] = useState("");
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [woModalOpen, setWoModalOpen] = useState(false);
  const [woDescription, setWoDescription] = useState("");
  const [woPriority, setWoPriority] = useState("Medium");
  const [requestedParts, setRequestedParts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const tag = searchParams.get("tag");
    if (!tag) return;
    const match = equipment.find((e) => e.tag === tag);
    if (match) {
      setSelectedId(match.id);
      setMobileShowDetail(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selected = equipment.find((e) => e.id === selectedId) as EquipmentItem;
  const filtered = useMemo(
    () =>
      equipment.filter(
        (e) =>
          e.tag.toLowerCase().includes(search.toLowerCase()) ||
          e.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );
  const history = maintenanceEvents.filter((m) => m.equipmentId === selected.id);
  const activeIncidents = incidents.filter((i) => i.equipmentTag === selected.tag && i.stage !== "closed");
  const sops = SOP_LIBRARY[selected.tag] ?? ["No SOPs linked yet — request document indexing."];
  const steps = symptom ? TROUBLESHOOT_STEPS[symptom] ?? [] : [];

  function selectEquipment(id: string) {
    setSelectedId(id);
    setTab("overview");
    setSymptom("");
    setDoneSteps(new Set());
    setMobileShowDetail(true);
  }

  function submitWorkOrder(e: React.FormEvent) {
    e.preventDefault();
    const woNumber = `WO-${Math.floor(10000 + Math.random() * 89999)}`;
    toast.success(`Work order ${woNumber} created`, {
      description: `${selected.tag} · Priority: ${woPriority}`,
    });
    setWoModalOpen(false);
    setWoDescription("");
    setWoPriority("Medium");
  }

  function requestSparePart(partNumber: string) {
    setRequestedParts((prev) => new Set(prev).add(partNumber));
    toast.success("Spare part requested", { description: partNumber });
  }

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <div
        className={`w-full shrink-0 flex-col border-r border-border-subtle bg-bg-secondary md:flex md:w-80 ${
          mobileShowDetail ? "hidden" : "flex"
        }`}
      >
        <div className="border-b border-border-subtle p-4">
          <div className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-3 py-2">
            <Search className="h-3.5 w-3.5 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tag, name, or system..."
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => selectEquipment(e.id)}
              className={`flex w-full items-center gap-3 border-b border-border-subtle px-4 py-3 text-left text-xs transition-colors hover:bg-bg-tertiary ${
                selected.id === e.id ? "bg-bg-tertiary" : ""
              }`}
            >
              <HealthDot status={e.health} pulse={e.health === "critical"} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[11px] text-text-secondary">{e.tag}</p>
                <p className="truncate font-medium text-text-primary">{e.name}</p>
                <p className="truncate text-[11px] text-text-muted">
                  {e.system} · Next PM {e.nextPM}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`min-w-0 flex-1 overflow-y-auto p-6 md:p-8 ${mobileShowDetail ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
        <button
          onClick={() => setMobileShowDetail(false)}
          className="mb-4 flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary md:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Equipment list
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-text-primary md:text-2xl">
              {selected.tag} — {selected.name}
            </h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              {selected.system} · {selected.location}
            </p>
            <div className="mt-2.5">
              <Badge tone={selected.health === "healthy" ? "green" : selected.health === "warning" ? "amber" : "red"}>
                Operational — {selected.health === "healthy" ? "Normal" : selected.health === "warning" ? "Warning" : "Critical"}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {session?.role === "Technician / Shift Operator" && (
              <Link
                href={`/incidents?raise=${encodeURIComponent(selected.tag)}`}
                className="flex items-center gap-1.5 rounded-md border border-accent-red/40 px-3 py-2 text-xs font-medium text-accent-red transition-colors hover:bg-accent-red/10"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Raise Incident
              </Link>
            )}
            <Link
              href={`/chat?q=${encodeURIComponent(`Tell me about ${selected.tag} — ${selected.name}`)}`}
              className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Ask AI
            </Link>
            <Link
              href="/pid-viewer"
              className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
            >
              <GitBranch className="h-3.5 w-3.5" /> View on P&amp;ID
            </Link>
            {!isReadOnly && (
              <button
                onClick={() => setWoModalOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-2 text-xs font-semibold text-white transition hover:brightness-90"
              >
                <ClipboardPlus className="h-3.5 w-3.5" /> Generate Work Order
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border-subtle">
          {visibleTabs.map((t) => (
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
          {tab === "overview" && (
            <div className="flex flex-col gap-5">
              {activeIncidents.length > 0 && (
                <Link
                  href={`/incidents?tag=${encodeURIComponent(selected.tag)}`}
                  className="flex items-start gap-3 rounded-lg border border-l-2 border-l-accent-red border-border-subtle bg-accent-red/5 p-4 transition-colors hover:bg-accent-red/10"
                >
                  <Siren className="mt-0.5 h-4 w-4 shrink-0 text-accent-red" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text-primary">
                      {activeIncidents.length} active incident{activeIncidents.length > 1 ? "s" : ""} on this equipment
                    </p>
                    <div className="mt-1.5 flex flex-col gap-1">
                      {activeIncidents.map((i) => (
                        <p key={i.id} className="text-[11px] text-text-secondary">
                          {i.title} — <span className="text-text-muted">{STAGE_LABEL[i.stage]}</span>
                        </p>
                      ))}
                    </div>
                    <p className="mt-1.5 text-[11px] font-medium text-accent-red">View in Incident Workflow →</p>
                  </div>
                </Link>
              )}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-border-subtle bg-bg-secondary p-5">
                <h3 className="font-display text-sm font-semibold text-text-primary">Specifications</h3>
                <dl className="mt-4 space-y-2.5 text-xs">
                  <Row label="Type" value={selected.type} />
                  <Row label="OEM" value={selected.oem} />
                  <Row label="Commission date" value={selected.commissionDate} />
                  <Row label="Location" value={selected.location} />
                  <Row label="Running hours" value={`${selected.runningHours.toLocaleString()} hrs`} />
                </dl>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-secondary p-5">
                <h3 className="font-display text-sm font-semibold text-text-primary">Current Condition</h3>
                <dl className="mt-4 space-y-2.5 text-xs">
                  {selected.bearingTemp !== undefined && (
                    <Row label="Bearing temperature" value={`${selected.bearingTemp}°C`} warn={selected.bearingTemp > 75} />
                  )}
                  {selected.vibration !== undefined && (
                    <Row label="Vibration level" value={`${selected.vibration} mm/s`} warn={selected.vibration > 4} />
                  )}
                  <Row label="Running hours" value={`${selected.runningHours.toLocaleString()} hrs`} />
                  {selected.lastTrip && <Row label="Last trip event" value={selected.lastTrip} warn />}
                </dl>
              </div>
              </div>
            </div>
          )}

          {tab === "history" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-text-muted">{history.length} maintenance events on record</p>
              <div className="relative ml-2 flex flex-col gap-6 border-l border-border-subtle pl-6">
                {history.length === 0 && <p className="text-sm text-text-muted">No maintenance events recorded.</p>}
                {history.map((h) => (
                  <div key={h.id} className="relative">
                    <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full bg-bg-primary ring-2 ring-border-active" />
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-text-primary">{h.date}</span>
                      <Badge tone={eventTone[h.type]}>{h.type}</Badge>
                      <span className="text-text-muted">{h.durationHrs}h</span>
                    </div>
                    <p className="mt-1.5 text-sm text-text-secondary">{h.description}</p>
                    <p className="mt-1 text-[11px] text-text-muted">Performed by {h.performedBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "recommendations" && (
            <div className="flex flex-col gap-4">
              {selected.health !== "healthy" && (
                <RecCard
                  tone="red"
                  icon={<AlertTriangle className="h-4 w-4" />}
                  text={`CRITICAL: ${selected.name} showing degraded condition. Recommend immediate inspection within 48 hours.`}
                />
              )}
              <RecCard
                tone="amber"
                icon={<AlertTriangle className="h-4 w-4" />}
                text={`Component wear likely based on ${selected.runningHours.toLocaleString()} running hours. Schedule visual inspection during next planned shutdown.`}
              />
              <RecCard
                tone="cyan"
                icon={<Info className="h-4 w-4" />}
                text="OEM recommends alignment/calibration check per maintenance interval. Verify against last recorded check."
              />
            </div>
          )}

          {tab === "sops" && (
            <div className="flex flex-col gap-2.5">
              {sops.map((s) => (
                <Link
                  key={s}
                  href="/documents"
                  className="rounded-md border border-border-subtle bg-bg-secondary p-4 text-xs text-text-primary transition-colors hover:border-border-active"
                >
                  {s}
                </Link>
              ))}
            </div>
          )}

          {tab === "spares" && (
            <div className="overflow-hidden rounded-lg border border-border-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-tertiary text-text-secondary">
                    <tr>
                      <th className="px-4 py-3 font-medium">Part Number</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium">Reorder Point</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {spareParts.map((p) => (
                      <tr key={p.partNumber} className="border-t border-border-subtle bg-bg-secondary">
                        <td className="px-4 py-3 font-mono text-text-primary">{p.partNumber}</td>
                        <td className="px-4 py-3 text-text-secondary">{p.description}</td>
                        <td className="px-4 py-3">
                          <Badge tone={p.stock <= p.reorderPoint ? "amber" : "green"}>{p.stock}</Badge>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{p.reorderPoint}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => requestSparePart(p.partNumber)}
                            disabled={requestedParts.has(p.partNumber)}
                            className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors ${
                              requestedParts.has(p.partNumber)
                                ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
                                : "border-border-subtle text-text-primary hover:bg-bg-tertiary"
                            }`}
                          >
                            {requestedParts.has(p.partNumber) ? (
                              <>
                                <PackageCheck className="h-3 w-3" /> Requested
                              </>
                            ) : (
                              "Request"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="bg-bg-secondary px-4 py-3 text-[11px] text-text-muted">
                Based on OEM manual and consumption history
              </p>
            </div>
          )}

          {tab === "troubleshooting" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-text-secondary">
                Select the issue you&apos;re experiencing
              </label>
              <select
                value={symptom}
                onChange={(e) => {
                  setSymptom(e.target.value);
                  setDoneSteps(new Set());
                }}
                className="w-full max-w-sm rounded-md border border-border-subtle bg-bg-primary px-3 py-2.5 text-xs text-text-primary focus:border-border-active focus:outline-none"
              >
                <option value="">Choose a symptom...</option>
                {SYMPTOMS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {symptom && steps.length === 0 && (
                <p className="mt-4 text-sm text-text-muted">
                  No pre-built guide for &quot;{symptom}&quot; yet — try asking the AI assistant directly.
                </p>
              )}

              {steps.length > 0 && (
                <div className="mt-5 flex flex-col gap-3">
                  {steps.map((s, i) => (
                    <div key={i} className="rounded-lg border border-border-subtle bg-bg-secondary p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={doneSteps.has(i)}
                          onChange={() =>
                            setDoneSteps((prev) => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              return next;
                            })
                          }
                          className="mt-0.5 accent-[var(--accent-blue)]"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${doneSteps.has(i) ? "text-text-muted line-through" : "text-text-primary"}`}>
                            Step {i + 1}: {s.instruction}
                          </p>
                          <p className="mt-1.5 text-[11px] text-text-muted">Reference: {s.sop}</p>
                          <p className="mt-0.5 text-[11px] text-accent-amber">⚠ {s.safety}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {doneSteps.size === steps.length && (
                    <div className="rounded-lg border border-l-2 border-l-accent-cyan border-border-subtle bg-bg-secondary p-4 text-sm text-text-primary">
                      All steps complete. Based on findings, recommend replacing worn components and updating
                      the PM interval for this failure mode.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal open={woModalOpen} onClose={() => setWoModalOpen(false)} title="Generate Work Order">
        <form onSubmit={submitWorkOrder} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="mb-1.5 block font-medium text-text-secondary">Equipment</label>
            <input
              readOnly
              value={`${selected.tag} — ${selected.name}`}
              className="w-full rounded-md border border-border-subtle bg-bg-tertiary px-3 py-2 text-text-secondary"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-medium text-text-secondary">Priority</label>
            <select
              value={woPriority}
              onChange={(e) => setWoPriority(e.target.value)}
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary focus:border-border-active focus:outline-none"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-medium text-text-secondary">Description of Work</label>
            <textarea
              value={woDescription}
              onChange={(e) => setWoDescription(e.target.value)}
              rows={3}
              placeholder="Describe the work required..."
              className="w-full resize-none rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-border-active focus:outline-none"
            />
          </div>
          <button type="submit" className="mt-1 rounded-md bg-accent-blue py-2.5 font-semibold text-white transition hover:brightness-90">
            Create Work Order
          </button>
        </form>
      </Modal>
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={null}>
      <MaintenanceContent />
    </Suspense>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd className={warn ? "font-medium text-accent-amber" : "font-medium text-text-primary"}>{value}</dd>
    </div>
  );
}

function RecCard({ tone, icon, text }: { tone: "red" | "amber" | "cyan"; icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-secondary p-4">
      <span className={tone === "red" ? "text-accent-red" : tone === "amber" ? "text-accent-amber" : "text-accent-cyan"}>
        {icon}
      </span>
      <p className="text-sm text-text-primary">{text}</p>
    </div>
  );
}
