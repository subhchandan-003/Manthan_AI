"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Send,
  Mic,
  Paperclip,
  Plus,
  History,
  FileText,
  GitBranch,
  Wrench,
  Sparkles,
  PanelRight,
  ClipboardPlus,
  ArrowUpCircle,
  Bell,
  Share2,
  Download,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { HealthDot } from "@/components/ui/HealthDot";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "@/lib/session";
import { getRoleAccess } from "@/lib/roles";
import { useIncidents } from "@/lib/incidentsStore";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { downloadTextFile, shareOrCopyLink } from "@/lib/download";
import { formatDateTime, formatDate } from "@/lib/dateFormat";
import { documents, equipment } from "@/lib/mock-data";
import { findEquipmentInText } from "@/lib/equipmentIntelligence";
import { buildEvidenceForDocument } from "@/lib/documentContent";
import { EquipmentWorkspace, type AiSummary } from "@/components/chat/EquipmentWorkspace";
import { EvidenceDrawer } from "@/components/viewers/EvidenceDrawer";
import type { EvidenceCard } from "@/lib/documentViewer";
import type { EquipmentItem, WorkflowIncident } from "@/lib/types";

const FOLLOW_UPS = [
  "Show me the P&ID for this section",
  "Any recent maintenance on this equipment?",
  "What safety precautions apply here?",
];

const EXAMPLE_QUERIES = [
  "Show everything related to ID Fan-A",
  "Explain Boiler Feed Pump-A",
  "Show previous failures of Purge Fan No. 12 (East)",
  "Ask AI to investigate Platen Superheater",
  "Why is ID Fan-A vibrating?",
  "Show maintenance history of FGD Absorber",
];

const docTone = { "P&ID": "purple", PFD: "purple", SOP: "blue", "Maintenance Log": "amber", "Safety Manual": "red", "OEM Manual": "cyan", "Inspection Report": "green", "Reference Report": "neutral" } as const;

function findCitedDocs(text: string) {
  return documents.filter((d) => text.includes(d.title) || text.toLowerCase().includes(d.title.toLowerCase().slice(0, 20)));
}

type Tab = "sources" | "pid" | "equipment" | "history";

function ChatContent() {
  const searchParams = useSearchParams();
  const { session } = useSession();
  const canDownload = getRoleAccess(session?.role).canDownloadDocuments;
  const { incidents: workflowIncidents, addIncident, updateIncident } = useIncidents();
  const [input, setInput] = useState("");
  const handleVoice = useVoiceInput(setInput);
  const [tab, setTab] = useState<Tab>("sources");
  const [contextOpen, setContextOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [viewerEvidence, setViewerEvidence] = useState<EvidenceCard | null>(null);
  const [activeSummary, setActiveSummary] = useState<AiSummary | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firedInitial = useRef(false);
  // Guards against double-clicks: setIncidents/context updates are async, so two clicks
  // close together can both read the same stale `workflowIncidents` snapshot and both pass
  // the "does one already exist" check below. This ref updates synchronously, before React
  // has a chance to re-render, so the second click always sees the first click's claim.
  const rcaRequestedFor = useRef<Set<string>>(new Set());

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: () => {
      toast.error("MANTHAN AI is temporarily unavailable", { description: "Please try again in a moment." });
    },
  });

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !firedInitial.current) {
      firedInitial.current = true;
      runQuery(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function runQuery(text: string) {
    const match = findEquipmentInText(text);
    if (match) {
      setActiveTag(match.tag);
      setActiveSummary(null);
      return;
    }
    sendMessage({ text });
  }

  function handleSend(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    runQuery(value);
    setInput("");
  }

  function handleFileAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setInput((prev) => (prev ? `${prev} [Attached: ${file.name}]` : `[Attached: ${file.name}] `));
    toast.success("File attached", { description: file.name });
    e.target.value = "";
  }

  function startNewChat() {
    setMessages([]);
    setActiveTag(null);
    setActiveSummary(null);
    toast.success("Started a new chat");
  }

  function generateRca(e: EquipmentItem) {
    const existing = workflowIncidents.find(
      (i) => i.equipmentTag === e.tag && i.title === `AI Investigation Requested — ${e.tag}` && i.stage !== "closed"
    );
    if (existing || rcaRequestedFor.current.has(e.tag)) {
      toast.info("AI investigation already in progress", { description: `${e.tag} already has an open AI investigation request — view it in Incident Workflow.` });
      return;
    }
    rcaRequestedFor.current.add(e.tag);
    const id = `wf-${Date.now()}`;
    const title = `AI Investigation Requested — ${e.tag}`;
    const description = `AI investigation requested from the Equipment Intelligence Workspace for ${e.tag} (${e.name}).`;
    const created: WorkflowIncident = {
      id,
      title,
      description,
      equipmentTag: e.tag,
      severity: e.health === "critical" ? "critical" : e.health === "warning" ? "high" : "medium",
      isCritical: e.health === "critical",
      requiresSafetyClearance: false,
      escalated: false,
      shutdownRequested: false,
      stage: "ai-investigation",
      raisedBy: session?.employeeName ?? "MANTHAN Assistant",
      raisedByRole: session?.role ?? "Technician / Shift Operator",
      createdAt: formatDateTime(),
      attachments: [],
      activityLog: [{ time: formatDateTime(), actor: session?.employeeName ?? "You", role: session?.role ?? "Technician / Shift Operator", action: "Requested AI investigation from Equipment Intelligence Workspace" }],
    };
    addIncident(created);

    const investigatePromise = fetch("/api/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, equipmentTag: e.tag }),
    })
      .then((r) => r.json())
      .then((data: { recommendation: string; aiUnavailable?: boolean }) => {
        updateIncident(
          id,
          { aiRecommendation: data.recommendation, stage: "maintenance-review" },
          { actor: "MANTHAN AI", role: "System", action: "AI investigation complete — recommendation attached" }
        );
        return data;
      })
      .catch(() => {
        throw new Error("investigation failed");
      });

    toast.promise(investigatePromise, {
      loading: `AI investigating ${e.tag}...`,
      success: `AI investigation complete — routed to Maintenance Engineer`,
      error: "AI investigation unavailable — routed to Maintenance Engineer for manual review",
    });
  }

  function createWorkOrder(e: EquipmentItem) {
    const wo = `WO-${Math.floor(10000 + Math.random() * 89999)}`;
    toast.success(`Work order ${wo} created`, { description: e.tag });
  }

  function escalate(e: EquipmentItem) {
    toast.success("Escalated", { description: `${e.tag} flagged for Plant Engineer / Manager attention.` });
  }

  function shareReport() {
    if (!activeTag) return;
    shareOrCopyLink(`${activeTag} — Equipment Intelligence`, `AI-generated equipment intelligence report for ${activeTag}`, window.location.href).then((r) => {
      if (r === "copied") toast.success("Link copied to clipboard");
      if (r === "shared") toast.success("Shared");
    });
  }

  function downloadSummary() {
    if (!activeTag) return;
    const e = equipment.find((x) => x.tag === activeTag);
    const lines = [
      `MANTHAN — Equipment Intelligence Summary`,
      `${e?.tag} — ${e?.name}`,
      "",
      `Current condition: ${activeSummary?.currentCondition ?? "Loading…"}`,
      `Recent maintenance: ${activeSummary?.recentMaintenance ?? ""}`,
      `Known issues: ${activeSummary?.knownIssues ?? ""}`,
      `Failure trends: ${activeSummary?.failureTrends ?? ""}`,
      `Recommended actions: ${activeSummary?.recommendedActions?.join("; ") ?? ""}`,
      `AI Confidence: ${activeSummary?.confidence ?? "—"}%`,
    ];
    downloadTextFile(`${activeTag.replace(/[^\w-]+/g, "_")}-summary.txt`, lines.join("\n"));
    toast.success("Summary downloaded");
  }

  function notifyTeam() {
    toast.success("Team notified", { description: activeTag ? `Maintenance team alerted about ${activeTag}` : undefined });
  }

  const isStreaming = status === "streaming" || status === "submitted";
  const activeEquipment = activeTag ? equipment.find((e) => e.tag === activeTag) : undefined;

  const contextPanelBody = (
    <>
      <div className="flex border-b border-border-subtle text-xs">
        {([
          ["sources", "Sources"],
          ["pid", "P&ID View"],
          ["equipment", "Equipment"],
          ["history", "History"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 border-b-2 px-2 py-2.5 font-medium transition-colors ${
              tab === key ? "border-b-accent-blue text-text-primary" : "border-b-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "sources" && (
          <div className="flex flex-col gap-2">
            {documents.map((d) => (
              <div key={d.id} className="rounded-md border border-border-subtle p-2.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-accent-purple" />
                  <span className="truncate font-medium text-text-primary">{d.title}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <Badge tone={docTone[d.type]}>{d.type}</Badge>
                  <span className="text-text-muted">98% match</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "pid" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-md border border-border-subtle bg-bg-primary p-3 text-xs text-text-secondary">
              Drg. XXXX-999-POM-A-004 — Main Steam, HRH &amp; CRH P&amp;ID — last referenced in this conversation.
            </div>
            <Link
              href="/pid-viewer"
              className="flex items-center justify-center gap-1.5 rounded-md border border-border-subtle py-2 text-xs font-medium text-text-primary hover:bg-bg-tertiary"
            >
              <GitBranch className="h-3.5 w-3.5" /> Open Full P&ID Viewer
            </Link>
          </div>
        )}
        {tab === "equipment" && (
          <div className="flex flex-col divide-y divide-border-subtle">
            {equipment.map((e) => (
              <button
                key={e.id}
                onClick={() => setActiveTag(e.tag)}
                className="flex w-full items-center gap-2 py-2 text-left text-xs hover:bg-bg-tertiary/50"
              >
                <HealthDot status={e.health} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text-primary">{e.name}</p>
                  <p className="truncate text-text-muted">
                    {e.tag} · Next PM {formatDate(e.nextPM)}
                  </p>
                </div>
                <Wrench className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              </button>
            ))}
          </div>
        )}
        {tab === "history" && (
          <div className="flex flex-col gap-2 text-xs">
            {["Main steam system walkthrough", "ID Fan-A troubleshooting", "Nitrogen system hazard review"].map(
              (h) => (
                <div key={h} className="flex items-center gap-2 rounded-md border border-border-subtle p-2.5 hover:bg-bg-tertiary/50">
                  <History className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                  <span className="text-text-primary">{h}</span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );

  function ActionPanelBody({ showLabel }: { showLabel: boolean }) {
    if (!activeEquipment) return null;
    return (
    <div className="flex flex-col gap-2 p-3">
      {showLabel && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Action Panel</p>}
      <button onClick={() => generateRca(activeEquipment)} className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-left text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
        <Sparkles className="h-3.5 w-3.5 text-accent-cyan" /> Ask AI to Investigate
      </button>
      <button onClick={() => createWorkOrder(activeEquipment)} className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-left text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
        <ClipboardPlus className="h-3.5 w-3.5" /> Create Work Order
      </button>
      <button onClick={notifyTeam} className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-left text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
        <Bell className="h-3.5 w-3.5" /> Notify Team
      </button>
      <button onClick={() => escalate(activeEquipment)} className="flex items-center gap-2 rounded-md border border-accent-red/40 px-3 py-2 text-left text-xs font-medium text-accent-red transition-colors hover:bg-accent-red/10">
        <ArrowUpCircle className="h-3.5 w-3.5" /> Escalate
      </button>
      <button onClick={shareReport} className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-left text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
        <Share2 className="h-3.5 w-3.5" /> Share Report
      </button>
      {canDownload && (
        <button onClick={downloadSummary} className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-left text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
          <Download className="h-3.5 w-3.5" /> Download Summary
        </button>
      )}
    </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Left: Chat / Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border-subtle bg-bg-secondary px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-accent-cyan animate-pulse-glow" />
            <div>
              <h1 className="font-display text-sm font-semibold text-text-primary">
                {activeEquipment ? `Equipment Intelligence — ${activeEquipment.tag}` : "MANTHAN Assistant"}
              </h1>
              <p className="text-[11px] text-text-muted">Powered by Claude · Context: SIPAT STPP Documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {activeEquipment && (
              <button
                onClick={() => setActiveTag(null)}
                className="flex items-center gap-1 rounded-md border border-border-subtle px-2.5 py-1.5 transition-colors hover:bg-bg-tertiary"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Chat
              </button>
            )}
            <button
              onClick={startNewChat}
              className="flex items-center gap-1 rounded-md border border-border-subtle px-2.5 py-1.5 transition-colors hover:bg-bg-tertiary"
            >
              <Plus className="h-3.5 w-3.5" /> New Chat
            </button>
            <button
              onClick={() => setContextOpen(true)}
              aria-label="Sources & context"
              className="flex items-center gap-1 rounded-md border border-border-subtle px-2.5 py-1.5 transition-colors hover:bg-bg-tertiary md:hidden"
            >
              <PanelRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {activeTag ? (
              <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <EquipmentWorkspace
                  tag={activeTag}
                  onOpenDocument={setViewerEvidence}
                  onSelectEquipment={setActiveTag}
                  onGenerateRca={generateRca}
                  onCreateWorkOrder={createWorkOrder}
                  onEscalate={escalate}
                  onSummaryLoaded={setActiveSummary}
                />
              </motion.div>
            ) : (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                {messages.length === 0 && (
                  <div className="flex flex-col items-center gap-5 pt-10 text-center text-text-muted">
                    <Sparkles className="h-8 w-8 text-accent-cyan" strokeWidth={1.5} />
                    <p className="max-w-md text-sm">
                      Ask about equipment, failures, SOPs, maintenance history or P&amp;IDs across {documents.length} indexed
                      plant documents. Search an equipment tag or name to open its Equipment Intelligence Workspace.
                    </p>
                    <div className="flex max-w-xl flex-wrap justify-center gap-1.5">
                      {EXAMPLE_QUERIES.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSend(q)}
                          className="rounded-full border border-border-subtle px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mx-auto flex max-w-3xl flex-col gap-5">
                  {messages.map((m) => {
                    const text = m.parts
                      .filter((p) => p.type === "text")
                      .map((p) => (p as { type: "text"; text: string }).text)
                      .join("");
                    const cited = m.role === "assistant" ? findCitedDocs(text) : [];
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                      >
                        <div
                          className={
                            m.role === "user"
                              ? "max-w-[80%] rounded-lg rounded-tr-none bg-bg-tertiary px-4 py-2.5 text-sm text-text-primary"
                              : "max-w-[85%] rounded-lg rounded-tl-none border-l-2 border-l-accent-cyan bg-bg-secondary px-4 py-3 text-sm text-text-primary"
                          }
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{text || (isStreaming ? "…" : "")}</p>
                          {cited.length > 0 && (
                            <div className="mt-3 flex flex-col gap-1.5 border-t border-border-subtle pt-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Evidence Used</p>
                              {cited.slice(0, 3).map((d) => (
                                <div key={d.id} className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs">
                                  <FileText className="h-3.5 w-3.5 shrink-0 text-accent-purple" />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-text-primary">{d.title}</p>
                                    <p className="text-[10px] text-text-muted">{d.type} · 98% relevant</p>
                                  </div>
                                  <button
                                    onClick={() => setViewerEvidence(buildEvidenceForDocument(d))}
                                    className="shrink-0 rounded-md border border-border-subtle px-2 py-1 text-[11px] font-medium text-text-primary hover:bg-bg-tertiary"
                                  >
                                    Open Source
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {m.role === "assistant" && text && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {FOLLOW_UPS.map((f) =>
                                f.startsWith("Show me the P&ID") ? (
                                  <Link
                                    key={f}
                                    href="/pid-viewer"
                                    className="rounded-full border border-border-subtle px-2.5 py-1 text-[11px] text-text-secondary hover:border-border-active hover:text-text-primary"
                                  >
                                    {f}
                                  </Link>
                                ) : (
                                  <button
                                    key={f}
                                    onClick={() => handleSend(f)}
                                    className="rounded-full border border-border-subtle px-2.5 py-1 text-[11px] text-text-secondary hover:border-border-active hover:text-text-primary"
                                  >
                                    {f}
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-border-subtle bg-bg-secondary p-5">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-md border border-border-subtle bg-bg-primary px-3 py-2.5 focus-within:border-border-active">
            <input ref={fileInputRef} type="file" hidden onChange={handleFileAttach} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-text-muted transition-colors hover:text-text-secondary"
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder="Ask anything about equipment, failures, SOPs, maintenance history or P&IDs..."
              className="max-h-32 flex-1 resize-none bg-transparent py-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <button onClick={handleVoice} className="text-text-muted hover:text-accent-cyan" aria-label="Voice input" title="Voice-enabled for hands-free operation in the field">
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={isStreaming || !input.trim()}
              className="rounded-md bg-accent-blue p-1.5 text-white disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mx-auto mt-1.5 max-w-3xl text-[11px] text-text-muted">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Right: Context panel / Action Panel (desktop) */}
      <aside className="hidden w-[340px] shrink-0 flex-col border-l border-border-subtle bg-bg-secondary md:flex">
        {activeEquipment ? <ActionPanelBody showLabel /> : contextPanelBody}
      </aside>

      {/* Context panel (mobile) */}
      <Modal open={contextOpen} onClose={() => setContextOpen(false)} title={activeEquipment ? "Action Panel" : "Sources & Context"}>
        <div className="-mx-6 -mb-6 flex max-h-[65vh] flex-col overflow-hidden rounded-b-xl">
          {activeEquipment ? <ActionPanelBody showLabel={false} /> : contextPanelBody}
        </div>
      </Modal>

      <EvidenceDrawer
        evidence={viewerEvidence}
        onClose={() => setViewerEvidence(null)}
        onViewEquipmentSummary={(equipTag) => {
          setViewerEvidence(null);
          setActiveTag(equipTag);
        }}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatContent />
    </Suspense>
  );
}
