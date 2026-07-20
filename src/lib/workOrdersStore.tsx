"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { equipment } from "./mock-data";
import { formatDateTime, formatDate } from "./dateFormat";
import { useIncidents } from "./incidentsStore";
import type { WorkOrder } from "./types";

const WO_STATUS_VERB: Record<WorkOrder["status"], string> = {
  open: "reopened",
  "in-progress": "started",
  completed: "marked complete",
  cancelled: "cancelled",
};

const STORAGE_KEY = "manthan-workorders-v1";
const PM_MARKER = "Scheduled preventive maintenance";

interface WorkOrdersContextValue {
  workOrders: WorkOrder[];
  ready: boolean;
  addWorkOrder: (wo: WorkOrder) => void;
  updateWorkOrder: (id: string, patch: Partial<WorkOrder>) => void;
}

const WorkOrdersContext = createContext<WorkOrdersContextValue | null>(null);

/**
 * Auto-raises a Preventive work order for any equipment whose nextPM date has passed and
 * doesn't already have one open — this is what actually closes the "PM is just a date field"
 * gap: a due date on its own does nothing without something turning it into real work.
 */
function generateDuePmWorkOrders(existing: WorkOrder[]): WorkOrder[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const generated: WorkOrder[] = [];

  for (const e of equipment) {
    const due = new Date(e.nextPM);
    if (due > today) continue;
    const alreadyOpen = existing
      .concat(generated)
      .some((w) => w.equipmentTag === e.tag && w.type === "Preventive" && w.status !== "completed" && w.description.startsWith(PM_MARKER));
    if (alreadyOpen) continue;

    const nowTs = Date.now();
    generated.push({
      id: `wo-pm-${e.tag}-${nowTs}`,
      woNumber: `WO-${Math.floor(10000 + Math.random() * 89999)}`,
      equipmentTag: e.tag,
      equipmentName: e.name,
      description: `${PM_MARKER} — due ${formatDate(e.nextPM)}.`,
      priority: e.health === "critical" ? "Critical" : e.health === "warning" ? "High" : "Medium",
      type: "Preventive",
      status: "open",
      createdBy: "MANTHAN",
      createdByRole: "System",
      createdAt: formatDateTime(nowTs),
      createdAtTs: nowTs,
      dueDate: e.nextPM,
    });
  }
  return generated;
}

export function WorkOrdersProvider({ children }: { children: React.ReactNode }) {
  const { updateIncident } = useIncidents();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [ready, setReady] = useState(false);

  // Load persisted work orders once on mount so they survive navigation/login switches.
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    let loaded: WorkOrder[] = [];
    if (raw) {
      try {
        loaded = JSON.parse(raw);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setWorkOrders([...generateDuePmWorkOrders(loaded), ...loaded]);
    setReady(true);
  }, []);

  // Persist every change — this is the demo's shared "database" across roles/sessions in this browser.
  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workOrders));
  }, [workOrders, ready]);

  const addWorkOrder = useCallback((wo: WorkOrder) => {
    setWorkOrders((prev) => [wo, ...prev]);
  }, []);

  // Flags the linked incident's Activity Log when a linked work order's status changes —
  // deliberately just a note, not a stage change. Auto-advancing the incident's own stage
  // would bypass the Maintenance Engineer's required field-verification step at
  // "Assigned for Repair", which exists specifically so repairs aren't self-certified.
  const updateWorkOrder = useCallback(
    (id: string, patch: Partial<WorkOrder>) => {
      setWorkOrders((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));

      if (patch.status) {
        const wo = workOrders.find((w) => w.id === id);
        if (wo?.incidentId && patch.status !== wo.status) {
          updateIncident(wo.incidentId, {}, { actor: "MANTHAN", role: "System", action: `Linked work order ${wo.woNumber} ${WO_STATUS_VERB[patch.status]}` });
        }
      }
    },
    [workOrders, updateIncident]
  );

  return (
    <WorkOrdersContext.Provider value={{ workOrders, ready, addWorkOrder, updateWorkOrder }}>
      {children}
    </WorkOrdersContext.Provider>
  );
}

export function useWorkOrders() {
  const ctx = useContext(WorkOrdersContext);
  if (!ctx) throw new Error("useWorkOrders must be used within WorkOrdersProvider");
  return ctx;
}
