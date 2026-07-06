"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Upload,
  ShieldCheck,
  GitBranch,
  ArrowRight,
  Mic,
  FileText,
  CalendarClock,
  ClipboardCheck,
  Users,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HealthDot } from "@/components/ui/HealthDot";
import { Gauge } from "@/components/ui/Gauge";
import { useSession } from "@/lib/session";
import { getRoleAccess } from "@/lib/roles";
import { alerts, documents, calendarEvents, complianceRows } from "@/lib/mock-data";

const severityTone = { critical: "red", warning: "amber", info: "blue" } as const;
const docStatusTone = { indexed: "green", processing: "amber", "needs-review": "red" } as const;
const calStatusColor = { overdue: "bg-accent-red", scheduled: "bg-accent-amber", completed: "bg-accent-green" } as const;

const PINNED_QUESTIONS = [
  "What's the current status of Boiler Feed Pump-A?",
  "Show me the O&M best practice for boiler startup",
  "Any overdue maintenance items for this week?",
];

export default function DashboardPage() {
  const { session } = useSession();
  const router = useRouter();
  const access = getRoleAccess(session?.role);
  const cards = access.dashboardCards;

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const compliancePassed = complianceRows.filter((c) => c.status === "pass").length;
  const complianceScore = Math.round((compliancePassed / complianceRows.length) * 100);

  function askAI(question: string) {
    router.push(`/chat?q=${encodeURIComponent(question)}`);
  }

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-bg-secondary to-bg-tertiary">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">
            Good {timeOfDay()}, {session?.employeeName?.split(" ")[0] ?? "there"}. You&apos;re on Shift{" "}
            {session?.shift} at {session?.plantShort} {`Unit ${session?.unit}`}.
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {" · "}Shift ends in 3h 20m
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/chat" className="flex items-center gap-1.5 rounded-md bg-accent-blue px-3 py-2 text-xs font-semibold text-white hover:bg-[#2f78e6]">
            <MessageSquare className="h-3.5 w-3.5" /> Ask AI
          </Link>
          <Link href="/documents" className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-tertiary">
            <Upload className="h-3.5 w-3.5" /> Upload Document
          </Link>
          {access.safety !== "none" && (
            <Link href="/safety" className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-tertiary">
              <ShieldCheck className="h-3.5 w-3.5" /> Safety Check
            </Link>
          )}
          <Link href="/pid-viewer" className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-tertiary">
            <GitBranch className="h-3.5 w-3.5" /> View P&amp;IDs
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Column 1 */}
        <div className="flex flex-col gap-5">
          {cards.plantHealth && (
            <Card>
              <CardHeader title="Plant Health Overview" />
              <div className="flex items-center justify-center py-2">
                <Gauge value={87} size={120} color="var(--accent-cyan)" label="Overall Equipment Effectiveness" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <Link href="/maintenance" className="rounded-md p-2 hover:bg-bg-tertiary">
                  <Gauge value={92} size={56} stroke={5} color="var(--accent-green)" />
                  <div className="mt-1 text-[11px] text-text-secondary">Boiler</div>
                </Link>
                <Link href="/maintenance" className="rounded-md p-2 hover:bg-bg-tertiary">
                  <Gauge value={78} size={56} stroke={5} color="var(--accent-amber)" />
                  <div className="mt-1 text-[11px] text-text-secondary">Turbine</div>
                </Link>
                <Link href="/maintenance" className="rounded-md p-2 hover:bg-bg-tertiary">
                  <Gauge value={95} size={56} stroke={5} color="var(--accent-green)" />
                  <div className="mt-1 text-[11px] text-text-secondary">BOP</div>
                </Link>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Active Alerts"
              action={
                access.safety !== "none" && (
                  <Link href="/safety" className="text-xs text-accent-blue hover:underline">
                    View All
                  </Link>
                )
              }
            />
            <div className="flex flex-col divide-y divide-border-subtle">
              {alerts.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                  <HealthDot
                    status={a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "healthy"}
                    pulse
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-text-primary">{a.text}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {a.tag && <Badge tone={severityTone[a.severity]}>{a.tag}</Badge>}
                      <span className="text-[11px] text-text-muted">{a.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-text-muted">
              {alerts.length} active alerts · {criticalCount} critical
            </p>
          </Card>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-5">
          <Card aiGenerated>
            <CardHeader
              title="AI Assistant Quick Chat"
              icon={<span className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse-glow" />}
            />
            <div className="flex flex-col gap-2 text-xs">
              <div className="self-end rounded-md rounded-tr-none bg-bg-tertiary px-3 py-2 text-text-primary">
                What&apos;s the current status of Boiler Feed Pump-A?
              </div>
              <div className="self-start rounded-md rounded-tl-none border-l-2 border-l-accent-cyan bg-bg-primary px-3 py-2 text-text-primary">
                Boiler Feed Pump-A is operating normally — bearing temp 61°C, vibration
                1.9 mm/s, next PM scheduled for Jul 20, 2026.
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PINNED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => askAI(q)}
                  className="rounded-full border border-border-subtle px-2.5 py-1 text-[11px] text-text-secondary hover:border-border-active hover:text-text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-3 py-2">
              <span className="flex-1 text-xs text-text-muted">Ask anything about your plant...</span>
              <Mic className="h-4 w-4 text-text-muted" />
            </div>
            <Link href="/chat" className="mt-3 flex items-center gap-1 text-xs font-medium text-accent-blue hover:underline">
              Open Full Chat <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>

          <Card>
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
                  href="/documents"
                  className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0 hover:bg-bg-tertiary/50"
                >
                  <FileText className="h-4 w-4 shrink-0 text-accent-purple" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-text-primary">{d.title}</p>
                    <span className="text-[11px] text-text-muted">{d.uploadDate}</span>
                  </div>
                  <Badge tone={docStatusTone[d.status]}>
                    {d.status === "indexed" ? "Processed ✓" : d.status === "processing" ? "Processing…" : "Needs Review"}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-5">
          {cards.maintenanceCalendar && (
            <Card>
              <CardHeader
                title="Maintenance Calendar"
                icon={<CalendarClock className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />}
                action={
                  <Link href="/maintenance" className="text-xs text-accent-blue hover:underline">
                    View Full Schedule
                  </Link>
                }
              />
              <div className="flex flex-col gap-2">
                {calendarEvents.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 text-xs">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${calStatusColor[c.status]}`} />
                    <span className="flex-1 truncate text-text-primary">{c.title}</span>
                    <span className="shrink-0 text-text-muted">
                      {new Date(c.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {cards.safetyCompliance && (
            <Card>
              <CardHeader
                title="Safety Compliance Snapshot"
                icon={<ClipboardCheck className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />}
              />
              <div className="flex items-center gap-4">
                <Gauge value={94} size={80} color="var(--accent-green)" />
                <div className="flex-1 space-y-1.5 text-xs">
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
                className="mt-3 flex items-center justify-center gap-1 rounded-md border border-border-subtle py-2 text-xs font-medium text-text-primary hover:bg-bg-tertiary"
              >
                Run Full Compliance Check
              </Link>
            </Card>
          )}

          {cards.shiftHandover && (
            <Card aiGenerated>
              <CardHeader
                title="Shift Handover Summary"
                icon={<Users className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />}
              />
              <p className="text-xs leading-relaxed text-text-secondary">
                Shift A completed. Key notes: platen superheater tube leak isolated.
                ID Fan-A showing elevated bearing temperature (82°C). Boiler excess O2 trending above the
                3.5% dry-basis best-practice target.
              </p>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-md bg-accent-blue px-3 py-2 text-xs font-semibold text-white hover:bg-[#2f78e6]">
                  Acknowledge &amp; Start Shift
                </button>
              </div>
              <Link href="/safety" className="mt-2 block text-center text-[11px] text-accent-blue hover:underline">
                View Detailed Handover Log
              </Link>
            </Card>
          )}
          {!cards.maintenanceCalendar && !cards.safetyCompliance && !cards.shiftHandover && (
            <Card>
              <p className="text-xs text-text-muted">No scheduling or compliance items relevant to your role right now.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
