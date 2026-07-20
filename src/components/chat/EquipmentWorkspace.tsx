"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  GitBranch,
  ClipboardPlus,
  ArrowUpCircle,
  Sparkles,
  Thermometer,
  Activity,
  Gauge as GaugeIcon,
  Wind,
  AlertOctagon,
  Clock,
  Download,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HealthDot } from "@/components/ui/HealthDot";
import { useIncidents } from "@/lib/incidentsStore";
import { downloadTextFile } from "@/lib/download";
import { formatDate } from "@/lib/dateFormat";
import {
  getEquipmentByTag,
  getDepartment,
  getCriticality,
  getHealthScore,
  getLastInspectionDate,
  getCurrentCondition,
  getMaintenanceHistory,
  getPreviousRcas,
  getLinkedSops,
  getInspectionReports,
  getRelatedWorkOrders,
  getConnectedEquipment,
  getRecommendations,
  getEvidence,
  getRelatedEquipment,
} from "@/lib/equipmentIntelligence";
import type { EquipmentItem } from "@/lib/types";
import type { EvidenceCard } from "@/lib/documentViewer";

const conditionIcon: Record<string, typeof Thermometer> = {
  Temperature: Thermometer,
  Vibration: Activity,
  Pressure: GaugeIcon,
  Flow: Wind,
  "Health Score": GaugeIcon,
  "Last Alarm": AlertOctagon,
  "Operational Status": Clock,
};

const statusTone = { healthy: "green", warning: "amber", critical: "red" } as const;

export interface AiSummary {
  currentCondition: string;
  recentMaintenance: string;
  knownIssues: string;
  failureTrends: string;
  recommendedActions: string[];
  reasoning: string[];
  confidence: number;
  aiUnavailable?: boolean;
}

const QUICK_ACTIONS: { key: string; label: string; target?: string }[] = [
  { key: "summary", label: "Equipment Summary", target: "section-summary" },
  { key: "history", label: "Maintenance History", target: "section-history" },
  { key: "rca", label: "Previous RCAs", target: "section-rca" },
  { key: "sops", label: "Linked SOPs", target: "section-sops" },
  { key: "pid", label: "View P&ID" },
  { key: "inspections", label: "Inspection Reports", target: "section-inspections" },
  { key: "generate-rca", label: "Ask AI to Investigate" },
  { key: "similar", label: "Find Similar Failures", target: "section-related" },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const REASONING_KEYWORDS: [string, string][] = [
  ["oem", "ev-oem"],
  ["manual", "ev-oem"],
  ["maintenance log", "ev-maint"],
  ["inspection", "ev-inspect"],
  ["sensor", "ev-sensor"],
  ["vibration", "ev-sensor"],
  ["rca", "ev-rca"],
  ["root cause", "ev-rca"],
  ["sop", "ev-sop"],
  ["procedure", "ev-sop"],
  ["p&id", "ev-pid"],
  ["drawing", "ev-pid"],
];

/** Best-effort match from a free-text reasoning bullet to the evidence card it cites. */
function matchEvidenceForReasoning(text: string, evidence: EvidenceCard[]): EvidenceCard | undefined {
  const lower = text.toLowerCase();
  for (const [keyword, id] of REASONING_KEYWORDS) {
    if (lower.includes(keyword)) {
      const match = evidence.find((ev) => ev.id === id);
      if (match) return match;
    }
  }
  return undefined;
}

export function EquipmentWorkspace({
  tag,
  onOpenDocument,
  onSelectEquipment,
  onGenerateRca,
  onCreateWorkOrder,
  onEscalate,
  onSummaryLoaded,
}: {
  tag: string;
  onOpenDocument: (item: EvidenceCard) => void;
  onSelectEquipment: (tag: string) => void;
  onGenerateRca: (e: EquipmentItem) => void;
  onCreateWorkOrder: (e: EquipmentItem) => void;
  onEscalate: (e: EquipmentItem) => void;
  onSummaryLoaded?: (summary: AiSummary | null) => void;
}) {
  const e = getEquipmentByTag(tag);
  const { incidents } = useIncidents();
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);

  useEffect(() => {
    if (!e) return;
    setSummary(null);
    onSummaryLoaded?.(null);
    setLoadingSummary(true);
    fetch("/api/equipment-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: e.tag }),
    })
      .then((r) => r.json())
      .then((data: AiSummary) => {
        setSummary(data);
        onSummaryLoaded?.(data);
      })
      .catch(() => {
        const fallback: AiSummary = {
          currentCondition: "AI summary unavailable.",
          recentMaintenance: "",
          knownIssues: "",
          failureTrends: "",
          recommendedActions: [],
          reasoning: ["AI Gateway unavailable."],
          confidence: 0,
          aiUnavailable: true,
        };
        setSummary(fallback);
        onSummaryLoaded?.(fallback);
      })
      .finally(() => setLoadingSummary(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e?.tag]);

  if (!e) return null;

  const condition = getCurrentCondition(tag);
  const history = getMaintenanceHistory(tag);
  const rcas = getPreviousRcas(tag, incidents);
  const sops = getLinkedSops(tag);
  const inspections = getInspectionReports(tag);
  const workOrders = getRelatedWorkOrders(tag);
  const { upstream, downstream } = getConnectedEquipment(tag);
  const recommendations = getRecommendations(tag);
  const evidence = getEvidence(tag, incidents);
  const related = getRelatedEquipment(tag);

  function handleQuickAction(key: string, target?: string) {
    if (key === "pid") {
      window.location.href = "/pid-viewer";
      return;
    }
    if (key === "generate-rca") {
      onGenerateRca(e!);
      return;
    }
    if (target) scrollToSection(target);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-8">
      {/* Quick action chips */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.key}
            onClick={() => handleQuickAction(qa.key, qa.target)}
            className="rounded-full border border-border-subtle px-2.5 py-1 text-[11px] text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Section 1: Equipment Header */}
      <Card noMotion className="border-l-2 border-l-accent-cyan">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-accent-cyan">{e.tag}</p>
            <h2 className="font-display text-xl font-semibold text-text-primary">{e.name}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {e.type} · OEM {e.oem} · {e.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={statusTone[e.health]}>{e.health}</Badge>
            <Badge tone={getCriticality(e) === "Critical" ? "red" : getCriticality(e) === "High" ? "amber" : "blue"}>{getCriticality(e)} criticality</Badge>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3 lg:grid-cols-4">
          <HeaderStat label="Department" value={getDepartment(e)} />
          <HeaderStat label="Health Score" value={`${getHealthScore(e)}%`} />
          <HeaderStat label="Running Hours" value={e.runningHours.toLocaleString("en-IN")} />
          <HeaderStat label="Last Maintenance" value={history[0] ? formatDate(history[0].date) : "—"} />
          <HeaderStat label="Last Inspection" value={formatDate(getLastInspectionDate(e))} />
          <HeaderStat label="Commissioned" value={formatDate(e.commissionDate)} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/pid-viewer" className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
            <GitBranch className="h-3.5 w-3.5" /> View P&amp;ID
          </Link>
          <button onClick={() => onGenerateRca(e)} className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
            <Sparkles className="h-3.5 w-3.5" /> Ask AI to Investigate
          </button>
          <button onClick={() => onCreateWorkOrder(e)} className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
            <ClipboardPlus className="h-3.5 w-3.5" /> Create Work Order
          </button>
          <button onClick={() => onEscalate(e)} className="flex items-center gap-1.5 rounded-md border border-accent-red/40 px-3 py-2 text-xs font-medium text-accent-red transition-colors hover:bg-accent-red/10">
            <ArrowUpCircle className="h-3.5 w-3.5" /> Escalate
          </button>
        </div>
      </Card>

      {/* Section 2: AI Executive Summary */}
      <Card id="section-summary" noMotion aiGenerated>
        <CardHeader title="AI Executive Summary" icon={<Sparkles className="h-4 w-4 text-accent-cyan" />} />
        {loadingSummary ? (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Sparkles className="h-4 w-4 animate-pulse text-accent-cyan" /> Analyzing OEM manual, maintenance logs, inspections, sensor data, RCAs and SOPs...
          </div>
        ) : (
          summary && (
            <div className="flex flex-col gap-3 text-xs leading-relaxed text-text-secondary">
              <p><span className="font-medium text-text-primary">Current condition:</span> {summary.currentCondition}</p>
              <p><span className="font-medium text-text-primary">Recent maintenance:</span> {summary.recentMaintenance}</p>
              <p><span className="font-medium text-text-primary">Known issues:</span> {summary.knownIssues}</p>
              <p><span className="font-medium text-text-primary">Failure trends:</span> {summary.failureTrends}</p>
              {summary.recommendedActions.length > 0 && (
                <div>
                  <span className="font-medium text-text-primary">Recommended actions:</span>
                  <ul className="mt-1 list-inside list-disc">
                    {summary.recommendedActions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[11px] text-text-muted">AI Confidence</span>
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-bg-tertiary">
                  <div className="h-full rounded-full bg-accent-cyan" style={{ width: `${summary.confidence}%` }} />
                </div>
                <span className="text-[11px] font-medium text-text-primary">{summary.confidence}%</span>
              </div>

              {/* Section 12: Why AI Generated This Answer */}
              <button
                onClick={() => setShowReasoning((v) => !v)}
                className="mt-1 flex items-center gap-1 self-start text-[11px] font-medium text-accent-blue hover:underline"
              >
                {showReasoning ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Why AI generated this answer
              </button>
              {showReasoning && (
                <div id="section-reasoning" className="flex flex-col gap-2 rounded-md border border-border-subtle bg-bg-primary p-3">
                  {summary.reasoning.map((r, idx) => {
                    const matched = matchEvidenceForReasoning(r, evidence);
                    return (
                      <div key={idx} className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2 last:border-0 last:pb-0">
                        <p className="flex-1">• {r}</p>
                        {matched && (
                          <button
                            onClick={() => onOpenDocument(matched)}
                            className="shrink-0 rounded-md border border-border-subtle px-2 py-1 text-[11px] font-medium text-accent-blue hover:bg-bg-tertiary"
                          >
                            View Evidence
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        )}
      </Card>

      {/* Section 3: Current Equipment Condition */}
      <div>
        <h3 className="mb-3 text-xs font-semibold text-text-primary">Current Equipment Condition</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {condition.map((c) => {
            const Icon = conditionIcon[c.label] ?? Activity;
            return (
              <div key={c.label} className="rounded-lg border border-border-subtle bg-bg-secondary p-3">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[11px]">{c.label}</span>
                </div>
                <p className={`mt-1.5 text-sm font-semibold ${c.status === "critical" ? "text-accent-red" : c.status === "warning" ? "text-accent-amber" : "text-text-primary"}`}>
                  {c.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Maintenance History */}
      <Card id="section-history" noMotion>
        <CardHeader title="Maintenance History" />
        <div className="flex flex-col gap-3">
          {history.length === 0 && <p className="text-xs text-text-muted">No maintenance events on record.</p>}
          {history.map((h) => (
            <div key={h.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-border-subtle pb-3 text-xs last:border-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary">{h.description}</p>
                <p className="mt-1 text-text-muted">
                  {formatDate(h.date)} · {h.workOrderNo} · {h.performedBy} · {h.durationHrs}h
                </p>
              </div>
              <Badge tone={h.type === "Emergency" ? "red" : h.type === "CM" ? "amber" : h.type === "Overhaul" ? "blue" : "green"}>{h.type}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 5: Previous RCA Reports */}
      <div id="section-rca">
        <h3 className="mb-3 text-xs font-semibold text-text-primary">Previous RCA Reports</h3>
        {rcas.length === 0 ? (
          <p className="text-xs text-text-muted">No RCA reports on file for this equipment yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {rcas.map((r) => (
              <Card key={r.id} noMotion>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] text-accent-cyan">{r.id}</p>
                    <p className="text-sm font-medium text-text-primary">{r.title}</p>
                    <p className="mt-1 text-[11px] text-text-muted">{formatDate(r.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge tone={r.status === "closed" ? "green" : "amber"}>{r.status}</Badge>
                    <span className="text-[11px] text-text-muted">{r.similarity}% similarity</span>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">Root cause:</span> {r.rootCause}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href="/incidents" className="flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
                    <Eye className="h-3.5 w-3.5" /> View RCA
                  </Link>
                  <button
                    onClick={() => {
                      downloadTextFile(`${r.id}.txt`, `RCA ${r.id}\n${r.title}\n${formatDate(r.date)}\n\nRoot cause: ${r.rootCause}`);
                      toast.success("RCA downloaded");
                    }}
                    className="flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section 6: Linked SOPs */}
      <div id="section-sops">
        <h3 className="mb-3 text-xs font-semibold text-text-primary">Linked SOPs</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sops.map((s) => (
            <div key={s.title} className="rounded-lg border border-border-subtle bg-bg-secondary p-3.5">
              <p className="text-xs font-medium text-text-primary">{s.category}</p>
              <p className="mt-1 text-[11px] text-text-muted">{s.docRef}</p>
              <div className="mt-3 flex gap-2 text-[11px]">
                <Link href="/documents" className="flex-1 rounded-md border border-border-subtle py-1.5 text-center font-medium text-text-primary hover:bg-bg-tertiary">
                  View
                </Link>
                <Link href="/documents" className="flex-1 rounded-md border border-border-subtle py-1.5 text-center font-medium text-text-primary hover:bg-bg-tertiary">
                  Open
                </Link>
                <button
                  onClick={() => {
                    downloadTextFile(`${s.category.replace(/\s+/g, "_")}.txt`, `${s.title}\nSource: ${s.docRef}`);
                    toast.success("SOP downloaded");
                  }}
                  className="flex-1 rounded-md border border-border-subtle py-1.5 text-center font-medium text-text-primary hover:bg-bg-tertiary"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7: Inspection Reports */}
      <Card id="section-inspections" noMotion>
        <CardHeader title="Inspection Reports" />
        <div className="flex flex-col gap-3">
          {inspections.map((i, idx) => (
            <div key={idx} className="flex flex-wrap items-start justify-between gap-2 border-b border-border-subtle pb-3 text-xs last:border-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="text-text-primary">{i.observations}</p>
                <p className="mt-1 text-text-muted">{formatDate(i.date)} · Inspector: {i.inspector}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={i.status === "pass" ? "green" : i.status === "flagged" ? "amber" : "red"}>{i.status.replace("-", " ")}</Badge>
                <button
                  onClick={() =>
                    onOpenDocument({
                      id: `ev-inspect-${idx}`,
                      name: `Inspection Report — ${formatDate(i.date)}.docx`,
                      docType: "Word",
                      uploadDate: i.date,
                      relevance: 90,
                      confidenceContribution: 15,
                      version: "Field copy",
                      uploadedBy: i.inspector,
                      fileSize: "94 KB",
                      status: "Indexed",
                      content: {
                        kind: "word",
                        aiSectionIndex: 0,
                        aiParagraphIndex: 0,
                        sections: [{ heading: `Inspection — ${formatDate(i.date)}`, paragraphs: [`Inspector: ${i.inspector} · Status: ${i.status}`, i.observations] }],
                      },
                    })
                  }
                  className="rounded-md border border-border-subtle px-2 py-1 text-[11px] font-medium text-text-primary hover:bg-bg-tertiary"
                >
                  View Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 8: Related Work Orders */}
      <div id="section-workorders">
        <h3 className="mb-3 text-xs font-semibold text-text-primary">Related Work Orders</h3>
        <div className="overflow-hidden rounded-lg border border-border-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-tertiary text-text-secondary">
                <tr>
                  <th className="px-3 py-2.5 font-medium">WO No.</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Description</th>
                  <th className="px-3 py-2.5 font-medium">Completed By</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-text-muted">No work orders on record.</td>
                  </tr>
                )}
                {workOrders.map((w) => (
                  <tr key={w.id} className="border-t border-border-subtle bg-bg-secondary">
                    <td className="px-3 py-2.5 font-mono text-text-primary">{w.id}</td>
                    <td className="px-3 py-2.5 text-text-secondary">{formatDate(w.date)}</td>
                    <td className="px-3 py-2.5 text-text-secondary">{w.description}</td>
                    <td className="px-3 py-2.5 text-text-secondary">{w.completedBy}</td>
                    <td className="px-3 py-2.5"><Badge tone="green">{w.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 9: Connected Equipment */}
      <div id="section-connected">
        <h3 className="mb-3 text-xs font-semibold text-text-primary">Connected Equipment</h3>
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border-subtle bg-bg-secondary p-5">
          {upstream.map((u) => (
            <ConnectedNode key={u.id} item={u} onClick={() => onSelectEquipment(u.tag)} />
          ))}
          {upstream.length > 0 && <ArrowDown />}
          <ConnectedNode item={e} current onClick={() => {}} />
          {downstream.length > 0 && <ArrowDown />}
          {downstream.map((d) => (
            <ConnectedNode key={d.id} item={d} onClick={() => onSelectEquipment(d.tag)} />
          ))}
          {upstream.length === 0 && downstream.length === 0 && (
            <p className="text-xs text-text-muted">No mapped upstream/downstream connections for this equipment.</p>
          )}
        </div>
      </div>

      {/* Section 10: AI Recommendations */}
      <div id="section-recommendations">
        <h3 className="mb-3 text-xs font-semibold text-text-primary">AI Recommendations</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {recommendations.map((r) => (
            <div key={r.action} className="rounded-lg border border-border-subtle bg-bg-secondary p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-text-primary">{r.action}</p>
                <Badge tone={r.priority === "Critical" ? "red" : r.priority === "High" ? "amber" : "blue"}>{r.priority}</Badge>
              </div>
              <p className="mt-2 text-[11px] text-text-secondary">{r.reason}</p>
              <p className="mt-1.5 text-[11px] text-text-muted">Expected impact: {r.expectedImpact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 11: Evidence & Verification — every claim in the AI summary must trace back here */}
      <div id="section-evidence">
        <h3 className="mb-3 text-xs font-semibold text-text-primary">Evidence &amp; Verification</h3>
        <p className="mb-3 text-[11px] text-text-muted">Every source the AI Executive Summary above drew from, with its contribution to the overall confidence score.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {evidence.map((ev) => (
            <div key={ev.id} className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-bg-secondary p-3.5 text-xs">
              <div className="flex min-w-0 items-start gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-accent-purple" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">{ev.name}</p>
                  <p className="text-[11px] text-text-muted">{ev.docType} · {formatDate(ev.uploadDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-text-secondary">
                <span>{ev.relevance}% relevant</span>
                <span>·</span>
                <span>{ev.confidenceContribution}% of AI confidence</span>
              </div>
              <button
                onClick={() => onOpenDocument(ev)}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-border-subtle py-1.5 font-medium text-text-primary hover:bg-bg-tertiary"
              >
                <Eye className="h-3.5 w-3.5" /> Open Source
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 13: Related Equipment */}
      <div id="section-related">
        <h3 className="mb-3 text-xs font-semibold text-text-primary">Related Equipment</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RelatedGroup title="Users Also Viewed" items={related.usersAlsoViewed} onSelect={onSelectEquipment} />
          <RelatedGroup title="Similar Equipment" items={related.similarEquipment} onSelect={onSelectEquipment} />
          <RelatedGroup title="Similar Failures" items={related.similarFailures} onSelect={onSelectEquipment} />
        </div>
      </div>

      {/* Section 15: Next Best Actions */}
      <div className="rounded-lg border border-border-subtle bg-bg-secondary p-4">
        <h3 className="text-xs font-semibold text-text-primary">Recommended Next Actions</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { label: "View OEM Manual", action: () => scrollToSection("section-evidence") },
            { label: "Check Maintenance History", action: () => scrollToSection("section-history") },
            { label: "Ask AI to Investigate", action: () => onGenerateRca(e) },
            { label: "Compare Previous Failures", action: () => scrollToSection("section-related") },
            { label: "View P&ID", action: () => (window.location.href = "/pid-viewer") },
            { label: "Open Inspection Report", action: () => scrollToSection("section-inspections") },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              className="flex items-center gap-1 rounded-full border border-border-subtle px-2.5 py-1 text-[11px] text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
            >
              {a.label} <ArrowRight className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className="mt-0.5 font-medium text-text-primary">{value}</p>
    </div>
  );
}

function ConnectedNode({ item, current, onClick }: { item: EquipmentItem; current?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={current}
      className={`flex items-center gap-2 rounded-md border px-3.5 py-2 text-xs transition-colors ${
        current ? "border-accent-cyan bg-accent-cyan/10 text-text-primary" : "border-border-subtle bg-bg-primary text-text-secondary hover:border-border-active hover:text-text-primary"
      }`}
    >
      <HealthDot status={item.health} />
      {item.tag}
      {!current && <ArrowRight className="h-3 w-3" />}
    </button>
  );
}

function ArrowDown() {
  return <ChevronDown className="h-4 w-4 text-text-muted" />;
}

function RelatedGroup({ title, items, onSelect }: { title: string; items: EquipmentItem[]; onSelect: (tag: string) => void }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-text-secondary">{title}</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {items.length === 0 && <p className="text-[11px] text-text-muted">None found.</p>}
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onSelect(it.tag)}
            className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-secondary px-2.5 py-2 text-left text-[11px] transition-colors hover:bg-bg-tertiary"
          >
            <HealthDot status={it.health} />
            <span className="min-w-0 flex-1 truncate text-text-primary">{it.tag}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
