"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  Lock,
  Send,
  AlertTriangle,
  Camera,
  Activity,
  LifeBuoy,
  ArrowUpCircle,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "@/lib/session";
import { useIncidents } from "@/lib/incidentsStore";
import { equipment } from "@/lib/mock-data";
import {
  STAGE_ORDER,
  STAGE_LABEL,
  visibleStages,
  actionableRole,
  nextStageAfterReview,
  nextStageAfterApproval,
  draftRca,
} from "@/lib/incidentWorkflow";
import type { IncidentActivity, IncidentAttachment, IncidentStage, Role, WorkflowIncident } from "@/lib/types";

const severityTone = { critical: "red", high: "amber", medium: "blue", low: "neutral" } as const;
const stageTone: Record<IncidentStage, "neutral" | "blue" | "amber" | "green" | "red" | "cyan" | "purple"> = {
  created: "neutral",
  "ai-investigation": "cyan",
  "maintenance-review": "blue",
  "safety-clearance": "amber",
  "plant-engineer-approval": "purple",
  "manager-approval": "purple",
  "maintenance-completed": "blue",
  "rca-generated": "cyan",
  "knowledge-saved": "green",
  closed: "green",
};

function now() {
  return new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function IncidentsPage() {
  const { session } = useSession();
  const role = (session?.role ?? "Technician / Shift Operator") as Role;
  const actorName = session?.employeeName ?? "You";

  const { incidents: list, addIncident, updateIncident } = useIncidents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [filter, setFilter] = useState<"queue" | "all" | "mine">("queue");
  const [search, setSearch] = useState("");
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [investigating, setInvestigating] = useState(false);

  const selected = list.find((i) => i.id === selectedId) ?? (selectedId ? null : list[0] ?? null);

  const filtered = useMemo(() => {
    let items = list;
    if (filter === "queue") items = items.filter((i) => actionableRole(i) === role);
    if (filter === "mine") items = items.filter((i) => i.raisedBy === actorName || i.assignedTechnician === actorName);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.title.toLowerCase().includes(q) || i.equipmentTag?.toLowerCase().includes(q));
    }
    return [...items].sort((a, b) => (a.stage === "closed" ? 1 : b.stage === "closed" ? -1 : 0));
  }, [list, filter, role, actorName, search]);

  function selectIncident(id: string) {
    setSelectedId(id);
    setMobileShowDetail(true);
  }

  async function raiseIncident(form: {
    title: string;
    equipmentTag: string;
    description: string;
    severity: WorkflowIncident["severity"];
    requiresSafetyClearance: boolean;
  }) {
    const id = `wf-${Date.now()}`;
    const created: WorkflowIncident = {
      id,
      title: form.title,
      description: form.description,
      equipmentTag: form.equipmentTag || undefined,
      severity: form.severity,
      isCritical: form.severity === "critical",
      requiresSafetyClearance: form.requiresSafetyClearance,
      escalated: false,
      shutdownRequested: false,
      stage: "ai-investigation",
      raisedBy: actorName,
      raisedByRole: role,
      createdAt: now(),
      attachments: [],
      activityLog: [{ time: now(), actor: actorName, role, action: "Raised incident" }],
    };
    addIncident(created);
    setSelectedId(id);
    setRaiseOpen(false);
    setMobileShowDetail(true);
    setInvestigating(true);

    const investigatePromise = fetch("/api/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, description: form.description, equipmentTag: form.equipmentTag }),
    })
      .then((r) => r.json())
      .then((data: { recommendation: string; aiUnavailable?: boolean }) => {
        updateIncident(
          id,
          { aiRecommendation: data.recommendation, stage: "maintenance-review" },
          { actor: "MANTHAN AI", role: "System", action: "AI investigation complete — recommendation attached" }
        );
        setInvestigating(false);
        return data;
      })
      .catch(() => {
        setInvestigating(false);
        throw new Error("investigation failed");
      });

    toast.promise(investigatePromise, {
      loading: "AI investigating incident...",
      success: "AI investigation complete — routed to Maintenance Engineer",
      error: "AI investigation unavailable — routed to Maintenance Engineer for manual review",
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      {/* List */}
      <div className={`w-full shrink-0 flex-col border-r border-border-subtle bg-bg-secondary md:flex md:w-96 ${mobileShowDetail ? "hidden" : "flex"}`}>
        <div className="border-b border-border-subtle p-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-display text-base font-semibold text-text-primary">Incident Workflow</h1>
            {role === "Technician / Shift Operator" && (
              <button
                onClick={() => setRaiseOpen(true)}
                className="flex items-center gap-1 rounded-md bg-accent-blue px-2.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-90"
              >
                <Plus className="h-3.5 w-3.5" /> Raise
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-3 py-2">
            <Search className="h-3.5 w-3.5 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search incidents..."
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-1 text-[11px]">
            {(["queue", "all", "mine"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-2.5 py-1 font-medium transition-colors ${
                  filter === f ? "border-border-active bg-accent-blue/10 text-text-primary" : "border-border-subtle text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                {f === "queue" ? "My Queue" : f === "all" ? "All" : "Raised / Assigned to Me"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((i) => (
            <button
              key={i.id}
              onClick={() => selectIncident(i.id)}
              className={`flex w-full flex-col gap-1.5 border-b border-border-subtle px-4 py-3 text-left text-xs transition-colors hover:bg-bg-tertiary ${
                selected?.id === i.id ? "bg-bg-tertiary" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-text-primary">{i.title}</p>
                {i.escalated && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-accent-red" />}
              </div>
              <p className="text-[11px] text-text-muted">{i.equipmentTag ?? "General"} · {i.createdAt}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={severityTone[i.severity]}>{i.severity}</Badge>
                <Badge tone={stageTone[i.stage]}>{STAGE_LABEL[i.stage]}</Badge>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="p-6 text-center text-xs text-text-muted">No incidents match this view.</p>}
        </div>
      </div>

      {/* Detail */}
      <div className={`min-w-0 flex-1 overflow-y-auto p-6 md:p-8 ${mobileShowDetail ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
        <button
          onClick={() => setMobileShowDetail(false)}
          className="mb-4 flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary md:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Incident list
        </button>

        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-sm text-text-muted">Select an incident to view its workflow.</div>
        ) : (
          <IncidentDetail
            key={selected.id}
            incident={selected}
            role={role}
            actorName={actorName}
            investigating={investigating && selected.stage === "ai-investigation"}
            onUpdate={(patch, activity) => updateIncident(selected.id, patch, activity)}
          />
        )}
      </div>

      <RaiseIncidentModal open={raiseOpen} onClose={() => setRaiseOpen(false)} onSubmit={raiseIncident} />
    </div>
  );
}

function IncidentDetail({
  incident,
  role,
  actorName,
  investigating,
  onUpdate,
}: {
  incident: WorkflowIncident;
  role: Role;
  actorName: string;
  investigating: boolean;
  onUpdate: (patch: Partial<WorkflowIncident>, activity: Omit<IncidentActivity, "time">) => void;
}) {
  const stages = visibleStages(incident);
  const currentIndex = STAGE_ORDER.indexOf(incident.stage);
  const isMyTurn = actionableRole(incident) === role;
  const canActAsRaiser = role === "Technician / Shift Operator" && incident.stage !== "closed";

  const [notes, setNotes] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [assignedTechnician, setAssignedTechnician] = useState(incident.assignedTechnician ?? "");
  const [needsSafety, setNeedsSafety] = useState(incident.requiresSafetyClearance);
  const [isCritical, setIsCritical] = useState(incident.isCritical);
  const [ppeVerified, setPpeVerified] = useState(false);
  const [loto, setLoto] = useState(false);
  const [workOrderNo, setWorkOrderNo] = useState(incident.plantEngineerApproval?.workOrderNo ?? "");
  const [capaApproved, setCapaApproved] = useState(false);
  const [workOrderApproved, setWorkOrderApproved] = useState(false);
  const [shutdownApproved, setShutdownApproved] = useState(false);
  const [rcaDraft, setRcaDraft] = useState(incident.rca ?? draftRca(incident));
  const [capaText, setCapaText] = useState(incident.capa ?? "");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const sensorInputRef = useRef<HTMLInputElement>(null);
  const findingInputRef = useRef<HTMLInputElement>(null);

  function completeReview() {
    if (!correctiveAction.trim()) return toast.error("Add a recommended corrective action first.");
    const patched = { ...incident, requiresSafetyClearance: needsSafety, isCritical };
    onUpdate(
      {
        maintenanceReview: { by: actorName, notes, correctiveAction },
        assignedTechnician: assignedTechnician || incident.assignedTechnician,
        requiresSafetyClearance: needsSafety,
        isCritical,
        stage: nextStageAfterReview(patched),
      },
      { actor: actorName, role, action: `Completed review — routed to ${needsSafety ? "Safety Officer" : "Plant Engineer"}` }
    );
    toast.success("Review submitted");
  }

  function safetyDecision(approved: boolean) {
    onUpdate(
      { safetyClearance: { by: actorName, approved, ppeVerified, loto, notes }, stage: approved ? "plant-engineer-approval" : "maintenance-review" },
      { actor: actorName, role, action: approved ? "Safety clearance approved" : "Safety clearance rejected — sent back to Maintenance Engineer" }
    );
    toast[approved ? "success" : "error"](approved ? "Safety clearance approved" : "Clearance rejected");
  }

  function escalateToManager(reason: string) {
    onUpdate(
      { isCritical: true, stage: "manager-approval" },
      { actor: actorName, role, action: `Escalated to Maintenance Manager — ${reason}` }
    );
    toast.success("Escalated to Maintenance Manager");
  }

  function plantEngineerDecision() {
    const patched = { ...incident, isCritical };
    onUpdate(
      { plantEngineerApproval: { by: actorName, approved: true, workOrderNo: workOrderNo || undefined, notes }, stage: nextStageAfterApproval(patched) },
      { actor: actorName, role, action: `Approved maintenance plan${workOrderNo ? ` — created ${workOrderNo}` : ""}` }
    );
    toast.success("Maintenance plan approved");
  }

  function managerApprove() {
    onUpdate(
      { managerApproval: { by: actorName, approved: true, capaApproved, notes }, stage: "maintenance-completed" },
      { actor: actorName, role, action: `Final approval granted (CAPA ${capaApproved ? "✓" : "–"}, Work Order ${workOrderApproved ? "✓" : "–"}, Shutdown ${shutdownApproved ? "✓" : "–"})` }
    );
    toast.success("Final approval granted");
  }

  function markCompleted() {
    onUpdate(
      { rca: draftRca(incident), stage: "rca-generated" },
      { actor: actorName, role, action: "Marked maintenance completed — RCA drafted" }
    );
    toast.success("Maintenance marked complete — RCA drafted");
  }

  function publishRca() {
    onUpdate(
      { rca: rcaDraft, capa: capaText, stage: "knowledge-saved" },
      { actor: actorName, role, action: "Published RCA to Knowledge Base" }
    );
    toast.success("RCA published to Knowledge Base");
  }

  function closeIncident() {
    onUpdate({ stage: "closed" }, { actor: actorName, role, action: "Closed incident" });
    toast.success("Incident closed");
  }

  function requestAssistance() {
    onUpdate({}, { actor: actorName, role, action: "Requested assistance" });
    toast.success("Assistance requested — notified Maintenance Engineer on duty");
  }

  function escalateAsTechnician() {
    onUpdate({ escalated: true }, { actor: actorName, role, action: "Escalated — flagged urgent" });
    toast.success("Incident flagged urgent");
  }

  function addAttachment(kind: IncidentAttachment["kind"], file: File) {
    const kindLabel = kind === "photo" ? "photo" : kind === "sensor-reading" ? "sensor reading" : "inspection finding";
    onUpdate(
      { attachments: [...incident.attachments, { name: file.name, kind }] },
      { actor: actorName, role, action: `Uploaded ${kindLabel}: ${file.name}` }
    );
    toast.success("Uploaded", { description: file.name });
  }

  function handleFilePicked(kind: IncidentAttachment["kind"]) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) addAttachment(kind, file);
      e.target.value = "";
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-text-primary">{incident.title}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {incident.equipmentTag ?? "General"} · Raised by {incident.raisedBy} ({incident.raisedByRole}) · {incident.createdAt}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={severityTone[incident.severity]}>{incident.severity}</Badge>
            <Badge tone={stageTone[incident.stage]}>{STAGE_LABEL[incident.stage]}</Badge>
            {incident.escalated && <Badge tone="red">Escalated</Badge>}
            {incident.isCritical && <Badge tone="purple">Critical path</Badge>}
          </div>
        </div>
        <p className="mt-3 text-sm text-text-secondary">{incident.description}</p>
      </div>

      {/* Stepper */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border-subtle bg-bg-secondary p-3">
        {stages.map((s, idx) => {
          const stageIdx = STAGE_ORDER.indexOf(s);
          const state = stageIdx < currentIndex ? "done" : stageIdx === currentIndex ? "current" : "upcoming";
          return (
            <div key={s} className="flex shrink-0 items-center gap-1">
              <div
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${
                  state === "done"
                    ? "bg-accent-green/15 text-accent-green"
                    : state === "current"
                    ? "bg-accent-blue/15 text-accent-blue"
                    : "text-text-muted"
                }`}
              >
                {state === "done" && <CheckCircle2 className="h-3 w-3" />}
                {STAGE_LABEL[s]}
              </div>
              {idx < stages.length - 1 && <span className="text-text-muted">→</span>}
            </div>
          );
        })}
      </div>

      {investigating && (
        <div className="flex items-center gap-2 rounded-md border border-l-2 border-l-accent-cyan border-border-subtle bg-bg-secondary p-3 text-xs text-text-secondary">
          <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-accent-cyan" /> AI is investigating this incident...
        </div>
      )}

      {incident.aiRecommendation && (
        <Section icon={<Sparkles className="h-4 w-4 text-accent-cyan" />} title="AI Recommendation" aiGenerated>
          {incident.aiRecommendation}
        </Section>
      )}
      {incident.maintenanceReview && (
        <Section title="Maintenance Engineer Review">
          <span className="font-medium text-text-primary">{incident.maintenanceReview.by}:</span> {incident.maintenanceReview.notes}
          <br />
          <span className="font-medium text-text-primary">Corrective action:</span> {incident.maintenanceReview.correctiveAction}
        </Section>
      )}
      {incident.safetyClearance && (
        <Section title="Safety Officer Clearance">
          <span className="font-medium text-text-primary">{incident.safetyClearance.by}</span> —{" "}
          {incident.safetyClearance.approved ? "Approved" : "Rejected"} · PPE {incident.safetyClearance.ppeVerified ? "verified" : "not verified"} · LOTO{" "}
          {incident.safetyClearance.loto ? "applied" : "not applied"}
          {incident.safetyClearance.notes && <> — {incident.safetyClearance.notes}</>}
        </Section>
      )}
      {incident.plantEngineerApproval && (
        <Section title="Plant Engineer Approval">
          <span className="font-medium text-text-primary">{incident.plantEngineerApproval.by}</span> — Approved
          {incident.plantEngineerApproval.workOrderNo && <> · Work Order {incident.plantEngineerApproval.workOrderNo}</>}
          {incident.plantEngineerApproval.notes && <> — {incident.plantEngineerApproval.notes}</>}
        </Section>
      )}
      {incident.managerApproval && (
        <Section title="Maintenance Manager Approval">
          <span className="font-medium text-text-primary">{incident.managerApproval.by}</span> — Final approval granted
          {incident.managerApproval.notes && <> — {incident.managerApproval.notes}</>}
        </Section>
      )}
      {incident.rca && incident.stage !== "rca-generated" && (
        <Section title="Root Cause Analysis">
          <pre className="whitespace-pre-wrap font-sans text-xs text-text-secondary">{incident.rca}</pre>
        </Section>
      )}
      {incident.capa && (
        <Section title="CAPA">{incident.capa}</Section>
      )}

      {incident.attachments.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-primary">Attachments</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {incident.attachments.map((a) => (
              <Badge key={a.name} tone="neutral">
                {a.kind === "photo" ? <Camera className="h-3 w-3" /> : a.kind === "sensor-reading" ? <Activity className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                {a.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Technician actions: available to whoever raised it while it's still open */}
      {canActAsRaiser && (
        <div className="rounded-lg border border-border-subtle bg-bg-secondary p-4">
          <h3 className="text-xs font-semibold text-text-primary">Technician Actions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={handleFilePicked("photo")}
            />
            <input
              ref={sensorInputRef}
              type="file"
              accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={handleFilePicked("sensor-reading")}
            />
            <input
              ref={findingInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,image/*"
              hidden
              onChange={handleFilePicked("finding")}
            />
            <button onClick={() => photoInputRef.current?.click()} className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
              <Camera className="h-3.5 w-3.5" /> Upload Photo
            </button>
            <button onClick={() => sensorInputRef.current?.click()} className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
              <Activity className="h-3.5 w-3.5" /> Upload Sensor Reading
            </button>
            <button onClick={() => findingInputRef.current?.click()} className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
              <FileText className="h-3.5 w-3.5" /> Upload Inspection Finding
            </button>
            <button onClick={requestAssistance} className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
              <LifeBuoy className="h-3.5 w-3.5" /> Request Assistance
            </button>
            {!incident.escalated && (
              <button onClick={escalateAsTechnician} className="flex items-center gap-1.5 rounded-md border border-accent-red/40 px-3 py-2 text-xs font-medium text-accent-red transition-colors hover:bg-accent-red/10">
                <ArrowUpCircle className="h-3.5 w-3.5" /> Escalate
              </button>
            )}
          </div>
        </div>
      )}

      {/* Role-gated stage action */}
      {isMyTurn && incident.stage === "maintenance-review" && (
        <ActionPanel title="Maintenance Engineer Review">
          <Field label="Assign Technician">
            <input value={assignedTechnician} onChange={(e) => setAssignedTechnician(e.target.value)} placeholder="Technician name" className={inputCls} />
          </Field>
          <Field label="Review Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Validation notes on the AI recommendation..." />
          </Field>
          <Field label="Recommended Corrective Action">
            <textarea value={correctiveAction} onChange={(e) => setCorrectiveAction(e.target.value)} rows={2} className={inputCls} placeholder="Required corrective action..." />
          </Field>
          <div className="flex flex-wrap gap-4">
            <Checkbox checked={needsSafety} onChange={setNeedsSafety} label="Requires Safety Officer clearance" />
            <Checkbox checked={isCritical} onChange={setIsCritical} label="Critical (requires Manager approval)" />
          </div>
          <ActionButton onClick={completeReview} icon={<Send className="h-3.5 w-3.5" />}>
            Complete Review
          </ActionButton>
        </ActionPanel>
      )}

      {isMyTurn && incident.stage === "safety-clearance" && (
        <ActionPanel title="Safety Officer Clearance">
          <div className="flex flex-wrap gap-4">
            <Checkbox checked={ppeVerified} onChange={setPpeVerified} label="PPE requirements verified" icon={<ShieldCheck className="h-3.5 w-3.5" />} />
            <Checkbox checked={loto} onChange={setLoto} label="Recommend isolation / LOTO" icon={<Lock className="h-3.5 w-3.5" />} />
          </div>
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Hazard identification / clearance notes..." />
          </Field>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => safetyDecision(true)} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
              Approve Clearance
            </ActionButton>
            <ActionButton onClick={() => safetyDecision(false)} tone="danger" icon={<XCircle className="h-3.5 w-3.5" />}>
              Reject
            </ActionButton>
            <ActionButton onClick={() => escalateToManager("high-risk safety finding")} tone="ghost" icon={<ArrowUpCircle className="h-3.5 w-3.5" />}>
              Escalate to Manager
            </ActionButton>
          </div>
        </ActionPanel>
      )}

      {isMyTurn && incident.stage === "plant-engineer-approval" && (
        <ActionPanel title="Plant Engineer Approval">
          <Field label="Work Order Number">
            <div className="flex gap-2">
              <input value={workOrderNo} onChange={(e) => setWorkOrderNo(e.target.value)} placeholder="WO-XXXXX" className={inputCls} />
              <button
                type="button"
                onClick={() => setWorkOrderNo(`WO-${Math.floor(10000 + Math.random() * 89999)}`)}
                className="shrink-0 rounded-md border border-border-subtle px-3 text-xs font-medium text-text-primary hover:bg-bg-tertiary"
              >
                Create
              </button>
            </div>
          </Field>
          {incident.shutdownRequested && <Checkbox checked={shutdownApproved} onChange={setShutdownApproved} label="Approve shutdown request" />}
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Approval notes..." />
          </Field>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={plantEngineerDecision} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
              Approve Maintenance Plan
            </ActionButton>
            <ActionButton onClick={() => escalateToManager("Plant Engineer escalation")} tone="ghost" icon={<ArrowUpCircle className="h-3.5 w-3.5" />}>
              Escalate to Manager
            </ActionButton>
          </div>
        </ActionPanel>
      )}

      {isMyTurn && incident.stage === "manager-approval" && (
        <ActionPanel title="Maintenance Manager — Final Approval">
          <div className="flex flex-wrap gap-4">
            <Checkbox checked={capaApproved} onChange={setCapaApproved} label="Approve CAPA" />
            <Checkbox checked={workOrderApproved} onChange={setWorkOrderApproved} label="Approve Work Order" />
            {incident.shutdownRequested && <Checkbox checked={shutdownApproved} onChange={setShutdownApproved} label="Approve Shutdown" />}
          </div>
          <Field label="Resource Allocation / Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} placeholder="Allocate crew / resources..." />
          </Field>
          <ActionButton onClick={managerApprove} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
            Grant Final Approval
          </ActionButton>
        </ActionPanel>
      )}

      {isMyTurn && incident.stage === "maintenance-completed" && (
        <ActionPanel title="Confirm Maintenance Completed">
          <p className="text-xs text-text-secondary">Marking this complete will auto-draft an RCA from the investigation and review notes above.</p>
          <ActionButton onClick={markCompleted} icon={<ClipboardCheck className="h-3.5 w-3.5" />}>
            Mark Maintenance Completed &amp; Draft RCA
          </ActionButton>
        </ActionPanel>
      )}

      {isMyTurn && incident.stage === "rca-generated" && (
        <ActionPanel title="Publish RCA to Knowledge Base">
          <Field label="RCA (editable)">
            <textarea value={rcaDraft} onChange={(e) => setRcaDraft(e.target.value)} rows={6} className={inputCls} />
          </Field>
          <Field label="CAPA">
            <textarea value={capaText} onChange={(e) => setCapaText(e.target.value)} rows={2} className={inputCls} placeholder="Corrective and Preventive Action..." />
          </Field>
          <ActionButton onClick={publishRca} icon={<Send className="h-3.5 w-3.5" />}>
            Publish RCA to Knowledge Base
          </ActionButton>
        </ActionPanel>
      )}

      {isMyTurn && incident.stage === "knowledge-saved" && (
        <ActionPanel title="Close Incident">
          <p className="text-xs text-text-secondary">RCA is published. This incident is ready to close.</p>
          <ActionButton onClick={closeIncident} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
            Close Incident
          </ActionButton>
        </ActionPanel>
      )}

      {/* Activity log */}
      <div>
        <h3 className="text-xs font-semibold text-text-primary">Activity Log</h3>
        <div className="mt-2 flex flex-col gap-2 border-l border-border-subtle pl-3">
          {incident.activityLog.map((a, idx) => (
            <div key={idx} className="text-[11px] text-text-secondary">
              <span className="text-text-muted">{a.time}</span> — <span className="font-medium text-text-primary">{a.actor}</span> ({a.role}): {a.action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-border-active focus:outline-none";

function Section({ icon, title, children, aiGenerated }: { icon?: React.ReactNode; title: string; children: React.ReactNode; aiGenerated?: boolean }) {
  return (
    <div className={`rounded-lg border border-border-subtle bg-bg-secondary p-4 ${aiGenerated ? "border-l-2 border-l-accent-cyan" : ""}`}>
      <h3 className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
        {icon} {title}
      </h3>
      <div className="mt-2 text-xs leading-relaxed text-text-secondary">{children}</div>
    </div>
  );
}

function ActionPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-active/40 bg-accent-blue/5 p-4">
      <h3 className="text-xs font-semibold text-text-primary">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium text-text-secondary">{label}</label>
      {children}
    </div>
  );
}

function Checkbox({ checked, onChange, label, icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; icon?: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-[var(--accent-blue)]" />
      {icon}
      {label}
    </label>
  );
}

function ActionButton({
  onClick,
  children,
  icon,
  tone = "primary",
}: {
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "primary" | "danger" | "ghost";
}) {
  const cls =
    tone === "primary"
      ? "bg-accent-blue text-white hover:brightness-90"
      : tone === "danger"
      ? "bg-accent-red/15 text-accent-red hover:bg-accent-red/25"
      : "border border-border-subtle text-text-primary hover:bg-bg-tertiary";
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition ${cls}`}>
      {icon}
      {children}
    </button>
  );
}

function RaiseIncidentModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: { title: string; equipmentTag: string; description: string; severity: WorkflowIncident["severity"]; requiresSafetyClearance: boolean }) => void;
}) {
  const [title, setTitle] = useState("");
  const [equipmentTag, setEquipmentTag] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<WorkflowIncident["severity"]>("medium");
  const [requiresSafetyClearance, setRequiresSafetyClearance] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Add a title and description.");
      return;
    }
    onSubmit({ title, equipmentTag, description, severity, requiresSafetyClearance });
    setTitle("");
    setEquipmentTag("");
    setDescription("");
    setSeverity("medium");
    setRequiresSafetyClearance(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Raise New Incident">
      <form onSubmit={submit} className="flex flex-col gap-4 text-xs">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" className={inputCls} />
        </Field>
        <Field label="Equipment">
          <select value={equipmentTag} onChange={(e) => setEquipmentTag(e.target.value)} className={inputCls}>
            <option value="">General / Not equipment-specific</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.tag}>
                {eq.tag} — {eq.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} placeholder="What did you observe?" />
        </Field>
        <Field label="Severity">
          <select value={severity} onChange={(e) => setSeverity(e.target.value as WorkflowIncident["severity"])} className={inputCls}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical (routes to Maintenance Manager)</option>
          </select>
        </Field>
        <Checkbox checked={requiresSafetyClearance} onChange={setRequiresSafetyClearance} label="This may involve a safety hazard (requires Safety Officer clearance)" />
        <button type="submit" className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-accent-blue py-2.5 font-semibold text-white transition hover:brightness-90">
          <Plus className="h-3.5 w-3.5" /> Raise Incident
        </button>
      </form>
    </Modal>
  );
}
