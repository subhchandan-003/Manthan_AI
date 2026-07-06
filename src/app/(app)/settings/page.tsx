"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useSession } from "@/lib/session";
import { documents } from "@/lib/mock-data";
import { LogOut } from "lucide-react";

type Tab = "plant" | "users" | "ai" | "documents" | "audit";

const TABS: { key: Tab; label: string }[] = [
  { key: "plant", label: "Plant Config" },
  { key: "users", label: "Users" },
  { key: "ai", label: "AI Config" },
  { key: "documents", label: "Documents" },
  { key: "audit", label: "Audit Log" },
];

const USERS = [
  { name: "Subhchandan Das", role: "Plant Engineer", access: "Standard" },
  { name: "M. Reddy", role: "Maintenance Engineer", access: "Standard" },
  { name: "A. Sharma", role: "Safety Officer", access: "Elevated" },
  { name: "V. Nair", role: "Shift In-Charge", access: "Elevated" },
];

const AUDIT_LOG = [
  { user: "Subhchandan Das", action: "Queried AI: 'Feed Water Pump 2B status'", time: "10:42 AM" },
  { user: "M. Reddy", action: "Logged maintenance event on 21-FN-301A", time: "09:15 AM" },
  { user: "A. Sharma", action: "Submitted safety checklist: Hot Work Permit", time: "08:50 AM" },
  { user: "System", action: "Re-indexed document: BHEL OEM Manual — ID Fan", time: "07:30 AM" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("plant");
  const { session, logout } = useSession();

  return (
    <div className="mx-auto max-w-[1100px] p-6">
      <h1 className="font-display text-xl font-semibold text-text-primary">Settings &amp; Admin</h1>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-border-subtle">
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
        {tab === "plant" && (
          <Card className="max-w-lg">
            <div className="flex flex-col gap-4 text-xs">
              <Field label="Plant Name" value={session?.plantName ?? ""} />
              <Field label="Plant Type" value="Thermal Power" />
              <Field label="Unit / Section" value={`Unit ${session?.unit ?? "3"}`} />
              <Field label="Shift Pattern" value="8-hour" />
            </div>
          </Card>
        )}

        {tab === "users" && (
          <Card>
            <div className="flex flex-col divide-y divide-border-subtle">
              {USERS.map((u) => (
                <div key={u.name} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <p className="font-medium text-text-primary">{u.name}</p>
                    <p className="text-text-muted">{u.role}</p>
                  </div>
                  <Badge tone={u.access === "Elevated" ? "amber" : "neutral"}>{u.access}</Badge>
                </div>
              ))}
            </div>
            <button className="mt-3 rounded-md border border-border-subtle px-3 py-1.5 text-xs font-medium hover:bg-bg-tertiary">
              + Add User
            </button>
          </Card>
        )}

        {tab === "ai" && (
          <Card className="max-w-lg">
            <div className="flex flex-col gap-4 text-xs">
              <Field label="AI Model" value="Claude (via Vercel AI Gateway)" />
              <div>
                <label className="mb-1.5 block font-medium text-text-secondary">Confidence Threshold for Annotations</label>
                <input type="range" min={50} max={100} defaultValue={85} className="w-full accent-[var(--accent-blue)]" />
              </div>
              <div>
                <label className="mb-1.5 block font-medium text-text-secondary">Response Tone</label>
                <select className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary focus:border-border-active focus:outline-none">
                  <option>Technical</option>
                  <option>Simplified</option>
                  <option>Emergency</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {tab === "documents" && (
          <Card>
            <p className="mb-3 text-xs text-text-muted">{documents.length} documents · storage 214 MB used</p>
            <div className="flex flex-col divide-y divide-border-subtle">
              {documents.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 text-xs">
                  <span className="truncate text-text-primary">{d.title}</span>
                  <div className="flex shrink-0 gap-2">
                    <button className="text-accent-blue hover:underline">Reprocess</button>
                    <button className="text-accent-red hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "audit" && (
          <Card>
            <div className="flex flex-col divide-y divide-border-subtle">
              {AUDIT_LOG.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <p className="text-text-primary">{a.action}</p>
                    <p className="text-text-muted">{a.user}</p>
                  </div>
                  <span className="shrink-0 text-text-muted">{a.time}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <button
        onClick={logout}
        className="mt-8 flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
      >
        <LogOut className="h-3.5 w-3.5" /> Log Out
      </button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1.5 block font-medium text-text-secondary">{label}</label>
      <input
        defaultValue={value}
        className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary focus:border-border-active focus:outline-none"
      />
    </div>
  );
}
