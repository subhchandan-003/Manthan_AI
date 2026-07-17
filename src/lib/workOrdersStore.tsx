"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { WorkOrder } from "./types";

const STORAGE_KEY = "manthan-workorders-v1";

interface WorkOrdersContextValue {
  workOrders: WorkOrder[];
  ready: boolean;
  addWorkOrder: (wo: WorkOrder) => void;
  updateWorkOrder: (id: string, patch: Partial<WorkOrder>) => void;
}

const WorkOrdersContext = createContext<WorkOrdersContextValue | null>(null);

export function WorkOrdersProvider({ children }: { children: React.ReactNode }) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [ready, setReady] = useState(false);

  // Load persisted work orders once on mount so they survive navigation/login switches.
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setWorkOrders(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
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

  const updateWorkOrder = useCallback((id: string, patch: Partial<WorkOrder>) => {
    setWorkOrders((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

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
