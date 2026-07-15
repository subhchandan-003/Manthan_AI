"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { workflowIncidents as seedIncidents } from "./mock-data";
import { deduplicateIncidents } from "./incidentWorkflow";
import type { IncidentActivity, WorkflowIncident } from "./types";

const STORAGE_KEY = "manthan-incidents-v1";

interface IncidentsContextValue {
  incidents: WorkflowIncident[];
  ready: boolean;
  addIncident: (incident: WorkflowIncident) => void;
  updateIncident: (
    id: string,
    patch: Partial<WorkflowIncident>,
    activity: Omit<IncidentActivity, "time">
  ) => void;
  removeIncident: (id: string) => void;
  resetIncidents: () => void;
}

const IncidentsContext = createContext<IncidentsContextValue | null>(null);

function now() {
  return new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function IncidentsProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<WorkflowIncident[]>(seedIncidents);
  const [ready, setReady] = useState(false);

  // Load persisted incidents once on mount so mutations survive navigation/login switches.
  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setIncidents(deduplicateIncidents(JSON.parse(raw)));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  // Persist every change — this is the demo's shared "database" across roles/sessions in this browser.
  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
  }, [incidents, ready]);

  const addIncident = useCallback((incident: WorkflowIncident) => {
    setIncidents((prev) => [incident, ...prev]);
  }, []);

  const updateIncident = useCallback(
    (id: string, patch: Partial<WorkflowIncident>, activity: Omit<IncidentActivity, "time">) => {
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, ...patch, activityLog: [...i.activityLog, { ...activity, time: now() }] } : i
        )
      );
    },
    []
  );

  const removeIncident = useCallback((id: string) => {
    setIncidents((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const resetIncidents = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setIncidents(seedIncidents);
  }, []);

  return (
    <IncidentsContext.Provider value={{ incidents, ready, addIncident, updateIncident, removeIncident, resetIncidents }}>
      {children}
    </IncidentsContext.Provider>
  );
}

export function useIncidents() {
  const ctx = useContext(IncidentsContext);
  if (!ctx) throw new Error("useIncidents must be used within IncidentsProvider");
  return ctx;
}
