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
import { useIncidents } from "@/lib/incidentsStore";
import { downloadTextFile, shareOrCopyLink } from "@/lib/download";
import { documents, equipment } from "@/lib/mock-data";
import { findEquipmentInText, type EvidenceItem } from "@/lib/equipmentIntelligence";
import { EquipmentWorkspace, type AiSummary } from "@/components/chat/EquipmentWorkspace";
import { DocumentViewerModal } from "@/components/chat/DocumentViewerModal";
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
  "Generate RCA for Platen Superheater",
  "Why is ID Fan-A vibrating?",
  "Show maintenance history of FGD Absorber",
];

const QUICK_ACTION_CHIPS = [
  "Equipment Summary",
  "Maintenance History",
  "Previous RCAs",
  "Linked SOPs",
  "View P&ID",
  "Inspection Reports",
  "Generate RCA",
  "Find Similar Failures",
];

const docTone = { "P&ID": "purple", PFD: "purple", SOP: "blue", "Maintenance Log": "amber", "Safety Manual": "red", "OEM Manual": "cyan", "Inspection Report": "green", "Reference Report": "neutral" } as const;

function findCitedDocs(text: string) {
  return documents.filter((d) => text.includes(d.title) || text.toLowerCase().includes(d.title.toLowerCase().slice(0, 20)));
}

type Tab = "sources" | "pid" | "equipment" | "history";

function ChatContent() {
  const searchParams = useSearchParams();
  const { session } = useSession();
  const { addIncident } = useIncidents();
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<Tab>("sources");
  const [contextOpen, setContextOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [viewerItem, setViewerItem] = useState<EvidenceItem | null>(null);
  const [activeSummary, setActiveSummary] = useState<AiSummary | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firedInitial = useRef(false);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
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

  function handleVoice() {
    type SpeechRecognitionLike = {
      lang: string;
      onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
      start: () => void;
    };
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionCtor = w.webkitSpeechRecognition ?? w.SpeechRecognition;
    if (!SpeechRecognitionCtor) {
      alert("Voice input isn't supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-IN";
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };
    recognition.start();
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

  function quickActionChip(label: string) {
    if (!activeTag) {
      toast.error("Search for an equipment first", { description: 'e.g. "Show everything related to ID Fan-A"' });
      return;
    }
    // Equipment-scoped chips act on the already-open workspace; scrolling is handled inside it.
    const id =
      label === "Equipment Summary" ? "section-summary"
      : label === "Maintenance History" ? "section-history"
      : label === "Previous RCAs" ? "section-rca"
      : label === "Linked SOPs" ? "section-sops"
      : label === "Inspection Reports" ? "section-inspections"
      : label === "Find Similar Failures" ? "section-related"
      : null;
    if (label === "View P&ID") {
      window.location.href = "/pid-viewer";
      return;
    }
    if (label === "Generate RCA") {
      const e = equipment.find((x) => x.tag === activeTag);
      if (e) generateRca(e);
      return;
    }
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function generateRca(e: EquipmentItem) {
    const id = `wf-${Date.now()}`;
    const created: WorkflowIncident = {
      id,
      title: `AI-Requested RCA — ${e.tag}`,
      description: `RCA requested from the Equipment Intelligence Workspace for ${e.tag} (${e.name}).`,
      equipmentTag: e.tag,
      severity: e.health === "critical" ? "critical" : e.health === "warning" ? "high" : "medium",
      isCritical: e.health === "critical",
      requiresSafetyClearance: false,
      escalated: false,
      shutdownRequested: false,
      stage: "ai-investigation",
      raisedBy: session?.employeeName ?? "MANTHAN Assistant",
      raisedByRole: session?.role ?? "Technician / Shift Operator",
      createdAt: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      attachments: [],
      activityLog: [{ time: new Date().toLocaleString("en-IN"), actor: session?.employeeName ?? "You", role: session?.role ?? "Technician / Shift Operator", action: "Requested RCA from Equipment Intelligence Workspace" }],
    };
    addIncident(created);
    toast.success("RCA requested", { description: `Tracking as an incident for ${e.tag} — view it in Incident Workflow.` });
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
                    {e.tag} · Next PM {e.nextPM}
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
        <Sparkles className="h-3.5 w-3.5 text-accent-cyan" /> Generate RCA
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
      <button onClick={downloadSummary} className="flex items-center gap-2 rounded-md border border-border-subtle px-3 py-2 text-left text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary">
        <Download className="h-3.5 w-3.5" /> Download Summary
      </button>
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
                  onOpenDocument={setViewerItem}
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
                    <div className="mt-2 flex max-w-xl flex-wrap justify-center gap-1.5 border-t border-border-subtle pt-4">
                      {QUICK_ACTION_CHIPS.map((label) => (
                        <button
                          key={label}
                          onClick={() => quickActionChip(label)}
                          className="rounded-full bg-bg-tertiary px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:text-text-primary"
                        >
                          {label}
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
                              {cited.slice(0, 3).map((d) => (
                                <Link
                                  key={d.id}
                                  href="/documents"
                                  className="flex items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs hover:border-border-active"
                                >
                                  <FileText className="h-3.5 w-3.5 shrink-0 text-accent-purple" />
                                  <span className="truncate flex-1">{d.title}</span>
                                  <Badge tone={docTone[d.type]}>{d.type}</Badge>
                                </Link>
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
          {!activeTag && (
            <div className="mx-auto mt-2.5 flex max-w-3xl flex-wrap gap-1.5">
              {QUICK_ACTION_CHIPS.map((label) => (
                <button
                  key={label}
                  onClick={() => quickActionChip(label)}
                  className="rounded-full border border-border-subtle px-2.5 py-1 text-[11px] text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
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

      <DocumentViewerModal item={viewerItem} onClose={() => setViewerItem(null)} />
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
