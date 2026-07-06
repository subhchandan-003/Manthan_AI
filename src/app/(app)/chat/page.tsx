"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
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
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { HealthDot } from "@/components/ui/HealthDot";
import { documents, equipment } from "@/lib/mock-data";

const FOLLOW_UPS = [
  "Show me the P&ID for this section",
  "Any recent maintenance on this equipment?",
  "What safety precautions apply here?",
];

const docTone = { "P&ID": "purple", PFD: "purple", SOP: "blue", "Maintenance Log": "amber", "Safety Manual": "red", "OEM Manual": "cyan", "Inspection Report": "green", "Reference Report": "neutral" } as const;

function findCitedDocs(text: string) {
  return documents.filter((d) => text.includes(d.title) || text.toLowerCase().includes(d.title.toLowerCase().slice(0, 20)));
}

type Tab = "sources" | "pid" | "equipment" | "history";

function ChatContent() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<Tab>("sources");
  const bottomRef = useRef<HTMLDivElement>(null);
  const firedInitial = useRef(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !firedInitial.current) {
      firedInitial.current = true;
      sendMessage({ text: q });
    }
  }, [searchParams, sendMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    sendMessage({ text: value });
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

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-full min-h-0">
      {/* Left: Chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border-subtle bg-bg-secondary px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-cyan animate-pulse-glow" />
            <div>
              <h1 className="font-display text-sm font-semibold text-text-primary">MANTHAN Assistant</h1>
              <p className="text-[11px] text-text-muted">Powered by Claude · Context: SIPAT STPP Documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 rounded-md border border-border-subtle px-2.5 py-1.5 hover:bg-bg-tertiary"
            >
              <Plus className="h-3.5 w-3.5" /> New Chat
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-text-muted">
              <Sparkles className="h-8 w-8 text-accent-cyan" strokeWidth={1.5} />
              <p className="max-w-sm text-sm">
                Ask about equipment, process flows, SOPs, maintenance history or safety protocols across{" "}
                {documents.length} indexed plant documents.
              </p>
            </div>
          )}
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((m) => {
              const text = m.parts
                .filter((p) => p.type === "text")
                .map((p) => (p as { type: "text"; text: string }).text)
                .join("");
              const cited = m.role === "assistant" ? findCitedDocs(text) : [];
              return (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
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
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-border-subtle bg-bg-secondary p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-md border border-border-subtle bg-bg-primary px-3 py-2 focus-within:border-border-active">
            <button className="text-text-muted hover:text-text-secondary" aria-label="Attach file">
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
              placeholder="Ask about equipment, processes, SOPs, maintenance, safety..."
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

      {/* Right: Context panel */}
      <aside className="hidden w-[340px] shrink-0 flex-col border-l border-border-subtle bg-bg-secondary md:flex">
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
                <Link
                  key={e.id}
                  href="/maintenance"
                  className="flex items-center gap-2 py-2 text-xs hover:bg-bg-tertiary/50"
                >
                  <HealthDot status={e.health} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">{e.name}</p>
                    <p className="truncate text-text-muted">
                      {e.tag} · Next PM {e.nextPM}
                    </p>
                  </div>
                  <Wrench className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                </Link>
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
      </aside>
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
