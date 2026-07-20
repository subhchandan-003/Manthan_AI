"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  MessageSquare,
  Upload,
  ShieldCheck,
  GitBranch,
  ArrowRight,
  Mic,
  Send,
  FileText,
  CalendarClock,
  ClipboardCheck,
  Users,
  CheckCircle2,
  ClipboardList,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HealthDot } from "@/components/ui/HealthDot";
import { Gauge } from "@/components/ui/Gauge";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "@/lib/session";
import { useIncidents } from "@/lib/incidentsStore";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { getRoleAccess, type DashboardWidget } from "@/lib/roles";
import { formatDate } from "@/lib/dateFormat";
import { alerts, documents, calendarEvents } from "@/lib/mock-data";
import { incidentsForRole, openIncidents, STAGE_LABEL } from "@/lib/incidentWorkflow";

const severityTone = { critical: "red", warning: "amber", info: "blue", high: "amber", medium: "blue", low: "neutral" } as const;
const docStatusTone = { indexed: "green", processing: "amber", "needs-review": "red" } as const;
const calStatusColor = { overdue: "bg-accent-red", scheduled: "bg-accent-amber", completed: "bg-accent-green" } as const;

const PINNED_QUESTIONS = [
  "What's the current status of Boiler Feed Pump-A?",
  "Show me the O&M best practice for boiler startup",
  "Any overdue maintenance items for this week?",
];

export default function DashboardPage() {
  const { session } = useSession();
  const { incidents } = useIncidents();
  const router = useRouter();
  const access = getRoleAccess(session?.role);
  const [shiftAcknowledged, setShiftAcknowledged] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const isTechnician = session?.role === "Technician / Shift Operator";
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const relevantIncidents = session?.role
    ? isTechnician
      ? openIncidents(incidents)
      : incidentsForRole(incidents, session.role)
    : [];

  function askAI(question: string) {
    router.push(`/chat?q=${encodeURIComponent(question)}`);
  }

  function submitQuickQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    askAI(quickQuestion);
  }

  const startVoiceInput = useVoiceInput((text) => setQuickQuestion(text));

  function acknowledgeShift() {
    setShiftAcknowledged(true);
    toast.success("Shift acknowledged", { description: "You're now logged as on-shift. Handover notes archived." });
  }

  function renderWidget(key: DashboardWidget) {
    switch (key) {
      case "incidents":
        return (
          <Card key={key}>
            <CardHeader
              title={isTechnician ? "Open Incidents" : "Incidents Awaiting My Action"}
              icon={<ClipboardList className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />}
              action={
                <Link href="/incidents" className="text-xs text-accent-blue hover:underline">
                  Open Workflow
                </Link>
              }
            />
            {relevantIncidents.length === 0 ? (
              <p className="text-xs text-text-muted">
                {isTechnician ? "No open incidents right now." : "Nothing in your queue right now."}
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border-subtle">
                {relevantIncidents.slice(0, 4).map((i) => (
                  <Link key={i.id} href="/incidents" className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-bg-tertiary/50">
                    <HealthDot status={i.severity === "critical" || i.severity === "high" ? "critical" : i.severity === "medium" ? "warning" : "healthy"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-text-primary">{i.title}</p>
                      <span className="text-[11px] text-text-muted">{i.equipmentTag ?? "General"} · {STAGE_LABEL[i.stage]}</span>
                    </div>
                    <Badge tone={severityTone[i.severity]}>{i.severity}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        );

      case "shiftHandover":
        return (
          <Card key={key} aiGenerated>
            <CardHeader title="Shift Handover Summary" icon={<Users className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />} />
            <p className="text-xs leading-relaxed text-text-secondary">
              Shift A completed. Key notes: platen superheater tube leak isolated.
              ID Fan-A showing elevated bearing temperature (82°C). Boiler excess O2 trending above the
              3.5% dry-basis best-practice target.
            </p>
            <div className="mt-4 flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={acknowledgeShift}
                disabled={shiftAcknowledged}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-semibold transition ${
                  shiftAcknowledged ? "bg-accent-green/15 text-accent-green" : "bg-accent-blue text-white hover:brightness-90"
                }`}
              >
                {shiftAcknowledged ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Shift Started
                  </>
                ) : (
                  "Acknowledge & Start Shift"
                )}
              </motion.button>
            </div>
            <Link href={access.safety !== "none" ? "/safety" : "/incidents"} className="mt-3 block text-center text-[11px] text-accent-blue hover:underline">
              View Detailed Handover Log
            </Link>
          </Card>
        );

      case "activeAlerts":
        return (
          <Card key={key}>
            <CardHeader
              title="Active Alerts"
              action={
                <button onClick={() => setAlertsOpen(true)} className="text-xs text-accent-blue hover:underline">
                  View All
                </button>
              }
            />
            <div className="flex flex-col divide-y divide-border-subtle">
              {alerts.slice(0, 5).map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <HealthDot status={a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "healthy"} pulse />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-text-primary">{a.text}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {a.tag && <Badge tone={severityTone[a.severity]}>{a.tag}</Badge>}
                      <span className="text-[11px] text-text-muted">{a.timestamp}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="mt-4 text-xs text-text-muted">
              {alerts.length} active alerts · {criticalCount} critical
            </p>
          </Card>
        );

      case "plantHealth":
        return (
          <Card key={key}>
            <CardHeader title="Plant Health Overview" />
            <div className="flex items-center justify-center py-3">
              <Gauge value={87} size={128} color="var(--accent-cyan)" label="Overall Equipment Effectiveness" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <Link href={`/maintenance?tag=${encodeURIComponent("Platen Superheater")}`} className="rounded-md p-2.5 transition-colors hover:bg-bg-tertiary">
                <Gauge value={92} size={60} stroke={5} color="var(--accent-green)" />
                <div className="mt-1.5 text-[11px] text-text-secondary">Boiler</div>
              </Link>
              <Link href={`/maintenance?tag=${encodeURIComponent("HP/IP Turbine")}`} className="rounded-md p-2.5 transition-colors hover:bg-bg-tertiary">
                <Gauge value={78} size={60} stroke={5} color="var(--accent-amber)" />
                <div className="mt-1.5 text-[11px] text-text-secondary">Turbine</div>
              </Link>
              <Link href={`/maintenance?tag=${encodeURIComponent("Cooling System Fan")}`} className="rounded-md p-2.5 transition-colors hover:bg-bg-tertiary">
                <Gauge value={95} size={60} stroke={5} color="var(--accent-green)" />
                <div className="mt-1.5 text-[11px] text-text-secondary">BOP</div>
              </Link>
            </div>
          </Card>
        );

      case "safetyCompliance":
        return (
          <Card key={key}>
            <CardHeader title="Safety Compliance Snapshot" icon={<ClipboardCheck className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />} />
            <div className="flex items-center gap-5">
              <Gauge value={94} size={84} color="var(--accent-green)" />
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">PTW compliance</span>
                  <span className="font-medium text-accent-green">100% ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">SOP adherence</span>
                  <span className="font-medium text-accent-green">96% ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Overdue inspections</span>
                  <span className="font-medium text-accent-amber">3 ⚠️</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Open NCRs</span>
                  <span className="font-medium text-accent-amber">2 ⚠️</span>
                </div>
              </div>
            </div>
            <Link
              href="/safety"
              className="mt-4 flex items-center justify-center gap-1 rounded-md border border-border-subtle py-2.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
            >
              Run Full Compliance Check
            </Link>
          </Card>
        );

      case "maintenanceCalendar":
        return (
          <Card key={key}>
            <CardHeader
              title="Maintenance Calendar"
              icon={<CalendarClock className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />}
              action={
                <button onClick={() => setScheduleOpen(true)} className="text-xs text-accent-blue hover:underline">
                  View Full Schedule
                </button>
              }
            />
            <div className="flex flex-col gap-3">
              {calendarEvents.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-center gap-3 text-xs">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${calStatusColor[c.status]}`} />
                  <span className="flex-1 truncate text-text-primary">{c.title}</span>
                  <span className="shrink-0 text-text-muted">
                    {formatDate(c.date)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        );

      case "quickChat":
        return (
          <Card key={key} aiGenerated>
            <CardHeader title="Ask MANTHAN" icon={<Sparkles className="h-4 w-4 text-accent-cyan" strokeWidth={1.5} />} />
            <p className="text-xs text-text-secondary">Ask about equipment, SOPs, maintenance history or P&amp;IDs.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PINNED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => askAI(q)}
                  className="rounded-full border border-border-subtle px-2.5 py-1 text-[11px] text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
            <form onSubmit={submitQuickQuestion} className="mt-3 flex items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-3 py-2.5 focus-within:border-border-active">
              <input
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                placeholder="Ask anything about your plant..."
                className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <button type="button" onClick={startVoiceInput} aria-label="Voice input" title="Speak your question" className="text-text-muted transition-colors hover:text-accent-cyan">
                <Mic className="h-4 w-4" />
              </button>
              <button type="submit" disabled={!quickQuestion.trim()} aria-label="Ask" className="rounded-md bg-accent-blue p-1.5 text-white disabled:opacity-40">
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
            <Link href="/chat" className="mt-3 flex items-center gap-1 text-xs font-medium text-accent-blue hover:underline">
              Open Full Chat <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>
        );

      case "recentDocuments":
        return (
          <Card key={key}>
            <CardHeader
              title="Recent Documents"
              action={
                <Link href="/documents" className="text-xs text-accent-blue hover:underline">
                  View All
                </Link>
              }
            />
            <div className="flex flex-col divide-y divide-border-subtle">
              {documents.slice(0, 5).map((d) => (
                <Link
                  key={d.id}
                  href={`/documents?doc=${d.id}`}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition-colors hover:bg-bg-tertiary/50"
                >
                  <FileText className="h-4 w-4 shrink-0 text-accent-purple" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-text-primary">{d.title}</p>
                    <span className="text-[11px] text-text-muted">{formatDate(d.uploadDate)}</span>
                  </div>
                  <Badge tone={docStatusTone[d.status]}>
                    {d.status === "indexed" ? "Processed ✓" : d.status === "processing" ? "Processing…" : "Needs Review"}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>
        );
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] p-6 md:p-8">
      <Card className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-bg-secondary to-bg-tertiary">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary md:text-2xl">
            Good {timeOfDay()}, {session?.employeeName?.split(" ")[0] ?? "there"}. You&apos;re on Shift{" "}
            {session?.shift} at {session?.plantShort} {`Unit ${session?.unit}`}.
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {" · "}Shift ends in 3h 20m
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/chat" className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3.5 py-2.5 text-xs font-semibold text-white transition hover:brightness-90">
            <MessageSquare className="h-3.5 w-3.5" /> Ask AI
          </Link>
          <Link href="/documents" className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3.5 py-2.5 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-tertiary">
            <Upload className="h-3.5 w-3.5" /> Upload Document
          </Link>
          {access.safety !== "none" && (
            <Link href="/safety" className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3.5 py-2.5 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-tertiary">
              <ShieldCheck className="h-3.5 w-3.5" /> Safety Check
            </Link>
          )}
          <Link href="/pid-viewer" className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3.5 py-2.5 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-tertiary">
            <GitBranch className="h-3.5 w-3.5" /> View P&amp;IDs
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">{access.dashboardLayout.primary.map(renderWidget)}</div>
        <div className="flex flex-col gap-6">{access.dashboardLayout.secondary.map(renderWidget)}</div>
      </div>

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Full Maintenance Schedule">
        <div className="flex flex-col divide-y divide-border-subtle">
          {calendarEvents.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2.5 text-xs first:pt-0 last:pb-0">
              <span className={`h-2 w-2 rounded-full shrink-0 ${calStatusColor[c.status]}`} />
              <span className="flex-1 text-text-primary">{c.title}</span>
              <Badge tone={c.status === "overdue" ? "red" : c.status === "completed" ? "green" : "amber"}>{c.status}</Badge>
              <span className="shrink-0 text-text-muted">
                {formatDate(c.date)}
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/maintenance"
          onClick={() => setScheduleOpen(false)}
          className="mt-4 flex items-center justify-center gap-1 rounded-md border border-border-subtle py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
        >
          Open Equipment Maintenance View
        </Link>
      </Modal>

      <Modal open={alertsOpen} onClose={() => setAlertsOpen(false)} title="All Active Alerts">
        <div className="flex flex-col divide-y divide-border-subtle">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
              {a.severity === "critical" ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-red" />
              ) : (
                <HealthDot status={a.severity === "warning" ? "warning" : "healthy"} />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-text-primary">{a.text}</p>
                <div className="mt-1 flex items-center gap-2">
                  {a.tag && <Badge tone={severityTone[a.severity]}>{a.tag}</Badge>}
                  <span className="text-[11px] text-text-muted">{a.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
