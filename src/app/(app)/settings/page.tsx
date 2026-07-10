"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LogOut, UserPlus, RefreshCw, Trash2, Save } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useSession } from "@/lib/session";
import { documents as initialDocuments } from "@/lib/mock-data";
import type { Role } from "@/lib/types";

type Tab = "plant" | "users" | "ai" | "documents" | "audit";

const TABS: { key: Tab; label: string }[] = [
  { key: "plant", label: "Plant Config" },
  { key: "users", label: "Users" },
  { key: "ai", label: "AI Config" },
  { key: "documents", label: "Documents" },
  { key: "audit", label: "Audit Log" },
];

const ROLES: Role[] = [
  "Technician / Shift Operator",
  "Maintenance Engineer",
  "Plant Engineer",
  "Safety Officer",
  "Maintenance Manager / Reliability Manager",
];

const INITIAL_USERS = [
  { name: "Subhchandan Das", role: "Plant Engineer" as Role, access: "Standard" as const },
  { name: "M. Reddy", role: "Maintenance Engineer" as Role, access: "Standard" as const },
  { name: "A. Sharma", role: "Safety Officer" as Role, access: "Elevated" as const },
  { name: "V. Nair", role: "Technician / Shift Operator" as Role, access: "Standard" as const },
  { name: "K. Subramaniam", role: "Maintenance Manager / Reliability Manager" as Role, access: "Elevated" as const },
];

const AUDIT_LOG = [
  { user: "Subhchandan Das", action: "Approved maintenance plan for Boiler excess O2 incident (WO-48213)", time: "10:42 AM" },
  { user: "M. Reddy", action: "Logged maintenance event on ID Fan-A", time: "09:15 AM" },
  { user: "A. Sharma", action: "Submitted safety checklist: Hot Work Permit", time: "08:50 AM" },
  { user: "K. Subramaniam", action: "Published RCA to Knowledge Base: FGD absorber pH excursion", time: "08:10 AM" },
  { user: "System", action: "Re-indexed document: BHEL OEM Manual — ID Fan", time: "07:30 AM" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("plant");
  const { session, logout } = useSession();

  const [plantForm, setPlantForm] = useState({
    plantName: session?.plantName ?? "",
    plantType: "Thermal Power",
    unit: `Unit ${session?.unit ?? "3"}`,
    shiftPattern: "8-hour",
  });

  const [users, setUsers] = useState(INITIAL_USERS);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", role: ROLES[0], access: "Standard" as "Standard" | "Elevated" });

  const [aiThreshold, setAiThreshold] = useState(85);
  const [aiTone, setAiTone] = useState("Technical");

  const [docs, setDocs] = useState(initialDocuments);

  function savePlantConfig(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Plant configuration saved");
  }

  function addUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUser.name.trim()) {
      toast.error("Enter a name for the new user.");
      return;
    }
    setUsers((prev) => [...prev, newUser]);
    toast.success("User added", { description: `${newUser.name} · ${newUser.role}` });
    setAddUserOpen(false);
    setNewUser({ name: "", role: ROLES[0], access: "Standard" });
  }

  function saveAiConfig() {
    toast.success("AI configuration saved", { description: `Threshold ${aiThreshold}% · Tone: ${aiTone}` });
  }

  function reprocessDocument(title: string) {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1600)), {
      loading: `Reprocessing "${title}"...`,
      success: `"${title}" reprocessed successfully`,
      error: "Reprocessing failed",
    });
  }

  function deleteDocument(id: string) {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast(`Deleted "${doc.title}"`, {
      action: { label: "Undo", onClick: () => setDocs((prev) => [...prev, doc]) },
    });
  }

  return (
    <div className="mx-auto max-w-[1100px] p-6 md:p-8">
      <h1 className="font-display text-xl font-semibold text-text-primary md:text-2xl">Settings &amp; Admin</h1>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border-subtle">
        {TABS.map((t) => (
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
        {tab === "plant" && (
          <Card className="max-w-lg">
            <form onSubmit={savePlantConfig} className="flex flex-col gap-5 text-xs">
              <Field
                label="Plant Name"
                value={plantForm.plantName}
                onChange={(v) => setPlantForm((f) => ({ ...f, plantName: v }))}
              />
              <Field
                label="Plant Type"
                value={plantForm.plantType}
                onChange={(v) => setPlantForm((f) => ({ ...f, plantType: v }))}
              />
              <Field label="Unit / Section" value={plantForm.unit} onChange={(v) => setPlantForm((f) => ({ ...f, unit: v }))} />
              <Field
                label="Shift Pattern"
                value={plantForm.shiftPattern}
                onChange={(v) => setPlantForm((f) => ({ ...f, shiftPattern: v }))}
              />
              <button type="submit" className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-accent-blue py-2.5 font-semibold text-white transition hover:brightness-90">
                <Save className="h-3.5 w-3.5" /> Save Changes
              </button>
            </form>
          </Card>
        )}

        {tab === "users" && (
          <Card>
            <div className="flex flex-col divide-y divide-border-subtle">
              {users.map((u) => (
                <div key={u.name} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <p className="font-medium text-text-primary">{u.name}</p>
                    <p className="text-text-muted">{u.role}</p>
                  </div>
                  <Badge tone={u.access === "Elevated" ? "amber" : "neutral"}>{u.access}</Badge>
                </div>
              ))}
            </div>
            <button
              onClick={() => setAddUserOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add User
            </button>
          </Card>
        )}

        {tab === "ai" && (
          <Card className="max-w-lg">
            <div className="flex flex-col gap-5 text-xs">
              <Field label="AI Model" value="Claude (via Vercel AI Gateway)" readOnly />
              <div>
                <label className="mb-2 block font-medium text-text-secondary">
                  Confidence Threshold for Annotations — {aiThreshold}%
                </label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={aiThreshold}
                  onChange={(e) => setAiThreshold(Number(e.target.value))}
                  className="w-full accent-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block font-medium text-text-secondary">Response Tone</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary focus:border-border-active focus:outline-none"
                >
                  <option>Technical</option>
                  <option>Simplified</option>
                  <option>Emergency</option>
                </select>
              </div>
              <button onClick={saveAiConfig} className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-accent-blue py-2.5 font-semibold text-white transition hover:brightness-90">
                <Save className="h-3.5 w-3.5" /> Save Configuration
              </button>
            </div>
          </Card>
        )}

        {tab === "documents" && (
          <Card>
            <p className="mb-4 text-xs text-text-muted">{docs.length} documents · storage 214 MB used</p>
            <div className="flex flex-col divide-y divide-border-subtle">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                  <span className="min-w-0 flex-1 truncate text-text-primary">{d.title}</span>
                  <div className="flex shrink-0 gap-3">
                    <button onClick={() => reprocessDocument(d.title)} className="flex items-center gap-1 text-accent-blue hover:underline">
                      <RefreshCw className="h-3 w-3" /> Reprocess
                    </button>
                    <button onClick={() => deleteDocument(d.id)} className="flex items-center gap-1 text-accent-red hover:underline">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {docs.length === 0 && <p className="py-4 text-center text-text-muted">No documents remaining.</p>}
            </div>
          </Card>
        )}

        {tab === "audit" && (
          <Card>
            <div className="flex flex-col divide-y divide-border-subtle">
              {AUDIT_LOG.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-3 text-xs">
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
        className="mt-8 flex items-center gap-1.5 rounded-md border border-border-subtle px-3.5 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
      >
        <LogOut className="h-3.5 w-3.5" /> Log Out
      </button>

      <Modal open={addUserOpen} onClose={() => setAddUserOpen(false)} title="Add User">
        <form onSubmit={addUser} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="mb-1.5 block font-medium text-text-secondary">Name</label>
            <input
              value={newUser.name}
              onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
              placeholder="Employee name"
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-border-active focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-medium text-text-secondary">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value as Role }))}
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary focus:border-border-active focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block font-medium text-text-secondary">Access Level</label>
            <select
              value={newUser.access}
              onChange={(e) => setNewUser((u) => ({ ...u, access: e.target.value as "Standard" | "Elevated" }))}
              className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-text-primary focus:border-border-active focus:outline-none"
            >
              <option>Standard</option>
              <option>Elevated</option>
            </select>
          </div>
          <button type="submit" className="mt-1 rounded-md bg-accent-blue py-2.5 font-semibold text-white transition hover:brightness-90">
            Add User
          </button>
        </form>
      </Modal>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-medium text-text-secondary">{label}</label>
      <input
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full rounded-md border border-border-subtle px-3 py-2 text-text-primary focus:border-border-active focus:outline-none ${
          readOnly ? "bg-bg-tertiary text-text-secondary" : "bg-bg-primary"
        }`}
      />
    </div>
  );
}
