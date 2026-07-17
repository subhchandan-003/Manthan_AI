"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Search, CheckCircle2, ClipboardPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useSession } from "@/lib/session";
import { getRoleAccess } from "@/lib/roles";
import { useWorkOrders } from "@/lib/workOrdersStore";
import type { WorkOrder } from "@/lib/types";

const woStatusTone = { open: "amber", "in-progress": "blue", completed: "green" } as const;
const woStatusLabel = { open: "Open", "in-progress": "In Progress", completed: "Completed" } as const;
const woTypeTone = { Preventive: "green", Corrective: "amber", Emergency: "red" } as const;
const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 } as const;

function isOverdue(wo: WorkOrder): boolean {
  if (wo.status === "completed" || !wo.dueDate) return false;
  return new Date(wo.dueDate) < new Date(new Date().toDateString());
}

type StatusFilter = "all" | "open" | "in-progress" | "completed";

export default function WorkOrdersPage() {
  const { session } = useSession();
  const { workOrders, updateWorkOrder } = useWorkOrders();
  const isReadOnly = getRoleAccess(session?.role).maintenance !== "full";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    let items = workOrders;
    if (statusFilter !== "all") items = items.filter((w) => w.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (w) => w.woNumber.toLowerCase().includes(q) || w.equipmentTag.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)
      );
    }
    return [...items].sort((a, b) => {
      if (a.status !== b.status) return a.status === "completed" ? 1 : b.status === "completed" ? -1 : 0;
      const overdueDiff = Number(isOverdue(b)) - Number(isOverdue(a));
      if (overdueDiff !== 0) return overdueDiff;
      return priorityRank[a.priority] - priorityRank[b.priority];
    });
  }, [workOrders, search, statusFilter]);

  function advanceWorkOrder(wo: WorkOrder) {
    if (wo.status === "open") {
      updateWorkOrder(wo.id, { status: "in-progress" });
      toast.success("Work order in progress", { description: wo.woNumber });
    } else if (wo.status === "in-progress") {
      const nowTs = Date.now();
      updateWorkOrder(wo.id, {
        status: "completed",
        completedAt: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        completedAtTs: nowTs,
      });
      toast.success("Work order completed", { description: wo.woNumber });
    }
  }

  const openCount = workOrders.filter((w) => w.status === "open").length;
  const inProgressCount = workOrders.filter((w) => w.status === "in-progress").length;
  const overdueCount = workOrders.filter(isOverdue).length;

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <h1 className="font-display text-xl font-semibold text-text-primary md:text-2xl">Work Orders</h1>
      <p className="mt-1.5 text-sm text-text-secondary">
        Every work order across the plant in one place — raised from equipment review, incident approvals, or auto-generated from overdue preventive maintenance.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border-subtle bg-bg-secondary p-3 text-center">
          <p className="font-display text-xl font-bold text-accent-amber">{openCount}</p>
          <p className="mt-1 text-[11px] text-text-secondary">Open</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-secondary p-3 text-center">
          <p className="font-display text-xl font-bold text-accent-blue">{inProgressCount}</p>
          <p className="mt-1 text-[11px] text-text-secondary">In Progress</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-bg-secondary p-3 text-center">
          <p className="font-display text-xl font-bold text-accent-red">{overdueCount}</p>
          <p className="mt-1 text-[11px] text-text-secondary">Overdue</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border-subtle bg-bg-secondary px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by WO number, equipment, or description..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </div>
        <div className="flex gap-1 text-[11px]">
          {(["all", "open", "in-progress", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full border px-2.5 py-1.5 font-medium transition-colors ${
                statusFilter === f ? "border-border-active bg-accent-blue/10 text-text-primary" : "border-border-subtle text-text-secondary hover:bg-bg-tertiary"
              }`}
            >
              {f === "all" ? "All" : f === "in-progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border-subtle bg-bg-secondary p-8 text-center">
            <ClipboardPlus className="h-6 w-6 text-text-muted" strokeWidth={1.5} />
            <p className="text-sm text-text-muted">No work orders match this view.</p>
          </div>
        )}
        {filtered.map((wo) => (
          <div key={wo.id} className="rounded-lg border border-border-subtle bg-bg-secondary p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-[11px] text-accent-cyan">{wo.woNumber}</p>
                  <Link
                    href={`/maintenance?tag=${encodeURIComponent(wo.equipmentTag)}`}
                    className="text-[11px] font-medium text-text-secondary hover:text-text-primary hover:underline"
                  >
                    {wo.equipmentTag}
                  </Link>
                  {wo.incidentId && (
                    <Link href="/incidents" className="text-[11px] font-medium text-accent-cyan hover:underline">
                      From Incident Workflow
                    </Link>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-text-primary">{wo.description}</p>
                <p className="mt-1 text-[11px] text-text-muted">
                  Raised by {wo.createdBy} ({wo.createdByRole}) · {wo.createdAt}
                  {wo.assignedTechnician && <> · Assigned to {wo.assignedTechnician}</>}
                  {wo.dueDate && <> · Due {wo.dueDate}</>}
                  {wo.reservedPart && <> · Part reserved: {wo.reservedPart}</>}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                <Badge tone={woTypeTone[wo.type]}>{wo.type}</Badge>
                <Badge tone={wo.priority === "Critical" ? "red" : wo.priority === "High" ? "amber" : "blue"}>{wo.priority}</Badge>
                <Badge tone={woStatusTone[wo.status]}>{woStatusLabel[wo.status]}</Badge>
                {isOverdue(wo) && <Badge tone="red">Overdue</Badge>}
              </div>
            </div>
            {wo.status === "completed" ? (
              <p className="mt-3 text-[11px] text-accent-green">Completed {wo.completedAt}</p>
            ) : (
              !isReadOnly && (
                <button
                  onClick={() => advanceWorkOrder(wo)}
                  className="mt-3 flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1.5 text-[11px] font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> {wo.status === "open" ? "Start Work" : "Mark Complete"}
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
