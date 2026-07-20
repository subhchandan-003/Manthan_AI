"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Search,
  Layers,
  Waypoints,
  BookOpen,
  Download,
  X,
} from "lucide-react";
import { equipment as equipmentRegistry } from "@/lib/mock-data";
import { downloadTextFile } from "@/lib/download";
import { useSession } from "@/lib/session";
import { getRoleAccess } from "@/lib/roles";
import { Modal } from "@/components/ui/Modal";

interface PidNode {
  tag: string;
  name: string;
  type: "pump" | "valve" | "instrument" | "heat-exchanger" | "vessel" | "safety";
  x: number;
  y: number;
  w: number;
  h: number;
  description: string;
  service: string;
  linkedSop?: string;
}

const NODE_COLOR: Record<PidNode["type"], string> = {
  pump: "#3D8BFD",
  valve: "#10B981",
  instrument: "#06B6D4",
  "heat-exchanger": "#F59E0B",
  vessel: "#8B5CF6",
  safety: "#EF4444",
};

const NODES: PidNode[] = [
  { tag: "Attemperator", name: "Attemperator / Spray Desuperheater", type: "heat-exchanger", x: 260, y: 90, w: 90, h: 40, description: "Spray desuperheating station controlling main steam temperature at the superheater outlet.", service: "Main Steam Temperature Control", linkedSop: "Drg. XXXX-999-POM-A-004 — Main Steam, HRH & CRH P&ID" },
  { tag: "Main Steam Stop Valve", name: "Main Steam Stop Valve", type: "valve", x: 460, y: 90, w: 70, h: 36, description: "Isolates main steam flow to the HP turbine inlet.", service: "Main Steam Isolation", linkedSop: "Drg. XXXX-999-POM-A-004 — Main Steam, HRH & CRH P&ID" },
  { tag: "HP Bypass Valve", name: "HP Bypass Station", type: "valve", x: 260, y: 190, w: 90, h: 36, description: "Bypasses HP turbine during startup / trip conditions.", service: "HP Bypass Control", linkedSop: "Drg. XXXX-999-POM-A-005 — HP & LP Bypass System P&ID" },
  { tag: "LP Bypass Valve", name: "LP Bypass Station", type: "valve", x: 380, y: 190, w: 90, h: 36, description: "Bypasses LP turbine during startup / trip conditions.", service: "LP Bypass Control", linkedSop: "Drg. XXXX-999-POM-A-005 — HP & LP Bypass System P&ID" },
  { tag: "FGD Absorber", name: "FGD Absorber", type: "vessel", x: 500, y: 190, w: 90, h: 36, description: "Wet limestone absorber for flue gas desulphurisation.", service: "Flue Gas Desulphurisation", linkedSop: "Drg. XXXX-101-POM-A-022 — Scheme of FGD-Absorber System" },
  { tag: "ID Fan-A", name: "ID Fan-A", type: "pump", x: 80, y: 270, w: 80, h: 40, description: "Induced draft fan maintaining furnace negative pressure.", service: "Air & Flue Gas Path", linkedSop: "Drg. XXXX-001-POM-A-018a/b — Air & Flue Gas Path" },
];

const FLOW_PATHS = [
  { id: "steam", color: "#EF4444", d: "M 60 108 H 260" },
  { id: "steam2", color: "#EF4444", d: "M 350 108 H 460" },
  { id: "steam3", color: "#EF4444", d: "M 530 108 H 600" },
  { id: "hpbypass", color: "#F59E0B", d: "M 305 130 V 190" },
  { id: "lpbypass", color: "#F59E0B", d: "M 425 130 V 190" },
  { id: "flue", color: "#94A3B8", d: "M 60 130 H 545 V 190" },
  { id: "draft", color: "#94A3B8", d: "M 120 270 V 130 H 60" },
];

export default function PidViewerPage() {
  const { session } = useSession();
  const canDownload = getRoleAccess(session?.role).canDownloadDocuments;
  const [zoom, setZoom] = useState(1);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showFlow, setShowFlow] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [legendModalOpen, setLegendModalOpen] = useState(false);
  const [selected, setSelected] = useState<PidNode | null>(null);
  const [searchTag, setSearchTag] = useState("");
  const [tab, setTab] = useState<"documents" | "history" | "connected" | "safety">("documents");

  const highlighted = useMemo(
    () => (searchTag ? NODES.find((n) => n.tag.toLowerCase().includes(searchTag.toLowerCase())) : null),
    [searchTag]
  );

  const registryMatch = selected ? equipmentRegistry.find((e) => e.tag === selected.tag) : undefined;

  function handleExport() {
    const svg = document.getElementById("pid-canvas-svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg-primary").trim();
    clone.setAttribute("style", `background:${bg}`);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgString = new XMLSerializer().serializeToString(clone);
    downloadTextFile(`sipat-pid-XXXX-999-POM-A-004-${Date.now()}.svg`, svgString, "image/svg+xml");
    toast.success("P&ID exported", { description: "Downloaded the current view as an SVG file." });
  }

  const legendBody = (
    <>
      <p className="mt-1 text-[11px] text-text-muted">
        The Sipat Stage-III bidding P&amp;ID set has no built-in legend page — this is an AI-generated reference.
      </p>

      <LegendSection title="Line Types">
        <LegendRow color="#3D4A5C" label="Major process pipe" />
        <LegendRow color="#EF4444" label="Main steam (dashed = flow anim.)" />
        <LegendRow color="#10B981" label="Relief / safety line" />
        <LegendRow color="#F59E0B" label="Bypass line" />
        <LegendRow color="#94A3B8" label="Draft / air line" />
      </LegendSection>

      <LegendSection title="Equipment Symbols">
        <LegendRow color={NODE_COLOR.pump} label="Pump / Fan" />
        <LegendRow color={NODE_COLOR.valve} label="Valve (gate/globe/bypass)" />
        <LegendRow color={NODE_COLOR["heat-exchanger"]} label="Heat exchanger / desuperheater" />
        <LegendRow color={NODE_COLOR.vessel} label="Vessel / tank" />
        <LegendRow color={NODE_COLOR.safety} label="Safety / relief device" />
        <LegendRow color={NODE_COLOR.instrument} label="Instrument (ISA S5.1)" />
      </LegendSection>

      <LegendSection title="Instrument Symbols (ISA S5.1)">
        <p className="text-[11px] leading-relaxed text-text-secondary">
          Circle = field-mounted · Circle with line = panel-mounted · Square = DCS/PLC function · Diamond =
          computer function. Tag prefix: F=Flow, T=Temp, P=Pressure, L=Level; suffix: I=Indicator,
          C=Controller, T=Transmitter, V=Valve, A=Alarm.
        </p>
      </LegendSection>

      <LegendSection title="Drawing Numbering">
        <p className="text-[11px] leading-relaxed text-text-secondary">
          Sipat Stage-III drawings follow a UNIT-AREA-DISCIPLINE-SHEET scheme, e.g.
          XXXX-999-POM-A-004 = Mechanical (POM) P&amp;ID sheet 004 for the common (999) area.
          Instrumentation sheets use the POI series, electrical single-lines use POE.
        </p>
      </LegendSection>
    </>
  );

  return (
    <div className="flex h-full min-h-0">
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="z-10 flex flex-wrap items-center gap-2 border-b border-border-subtle bg-bg-secondary px-4 py-2.5">
          <span className="text-xs text-text-secondary">Drg. XXXX-999-POM-A-004 — NTPC Sipat STPP Stage-III, Main Steam, HRH &amp; CRH P&amp;ID</span>
          <div className="mx-2 h-4 w-px bg-border-subtle" />
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))} className="rounded-md border border-border-subtle p-1.5 hover:bg-bg-tertiary">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-xs text-text-secondary">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2, z + 0.15))} className="rounded-md border border-border-subtle p-1.5 hover:bg-bg-tertiary">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setZoom(1)} className="rounded-md border border-border-subtle p-1.5 hover:bg-bg-tertiary">
            <Maximize className="h-3.5 w-3.5" />
          </button>
          <div className="mx-2 h-4 w-px bg-border-subtle" />
          <div className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-bg-primary px-2 py-1">
            <Search className="h-3.5 w-3.5 text-text-muted" />
            <input
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              placeholder="Search tag..."
              className="w-28 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <div className="mx-2 h-4 w-px bg-border-subtle" />
          <button
            onClick={() => setShowAnnotations((v) => !v)}
            className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${showAnnotations ? "border-border-active bg-accent-blue/10 text-text-primary" : "border-border-subtle text-text-secondary"}`}
          >
            <Layers className="h-3.5 w-3.5" /> Annotations
          </button>
          <button
            onClick={() => setShowFlow((v) => !v)}
            className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${showFlow ? "border-border-active bg-accent-blue/10 text-text-primary" : "border-border-subtle text-text-secondary"}`}
          >
            <Waypoints className="h-3.5 w-3.5" /> Flow Paths
          </button>
          <button
            onClick={() => {
              setShowLegend((v) => !v);
              setLegendModalOpen(true);
            }}
            className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${showLegend ? "border-border-active bg-accent-blue/10 text-text-primary" : "border-border-subtle text-text-secondary"}`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Legend
          </button>
          {canDownload && (
            <button
              onClick={handleExport}
              className="ml-auto flex items-center gap-1 rounded-md border border-border-subtle px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-tertiary"
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-[#0a0e13] p-8 md:p-10">
          <div
            className="mx-auto origin-top transition-transform"
            style={{ transform: `scale(${zoom})`, width: 640 }}
          >
            <svg id="pid-canvas-svg" viewBox="0 0 640 340" className="w-full rounded-md border border-border-subtle bg-bg-primary">
              {/* base pipe lines */}
              <path d="M 60 108 H 600" stroke="#3D4A5C" strokeWidth={3} fill="none" />
              <path d="M 120 270 V 130 H 60" stroke="#3D4A5C" strokeWidth={2} fill="none" />
              <path d="M 305 130 V 190" stroke="#3D4A5C" strokeWidth={2} fill="none" />
              <path d="M 425 130 V 190" stroke="#3D4A5C" strokeWidth={2} fill="none" />
              <path d="M 60 130 H 545 V 190" stroke="#3D4A5C" strokeWidth={2} fill="none" />

              {showFlow &&
                FLOW_PATHS.map((f) => (
                  <path key={f.id} d={f.d} stroke={f.color} strokeWidth={2} fill="none" strokeDasharray="6 4" opacity={0.9}>
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                  </path>
                ))}

              <text x={12} y={120} fontSize={9} fill="#64748B">
                Boiler
              </text>
              <text x={560} y={70} fontSize={9} fill="#64748B">
                HP Turbine Inlet
              </text>

              {NODES.map((n) => {
                const isHighlighted = highlighted?.tag === n.tag;
                const color = NODE_COLOR[n.type];
                return (
                  <g
                    key={n.tag}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelected(n);
                      setTab("documents");
                    }}
                  >
                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.w}
                      height={n.h}
                      rx={6}
                      fill={`${color}22`}
                      stroke={isHighlighted ? "#F0F4F8" : color}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                    />
                    {showAnnotations && (
                      <>
                        <text x={n.x + n.w / 2} y={n.y - 6} textAnchor="middle" fontSize={9} fill="#94A3B8">
                          {n.tag}
                        </text>
                        <text x={n.x + n.w - 4} y={n.y + 10} textAnchor="end" fontSize={7} fill={color}>
                          98%
                        </text>
                      </>
                    )}
                    <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 4} textAnchor="middle" fontSize={7.5} fill="#F0F4F8">
                      {n.name.length > 16 ? n.name.slice(0, 14) + "…" : n.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Popover */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 16, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-4 top-16 z-20 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border-subtle bg-bg-elevated p-5 shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-accent-cyan">{selected.tag}</p>
                  <h3 className="font-display text-sm font-semibold text-text-primary">{selected.name}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-text-muted transition-colors hover:text-text-primary">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-text-secondary">{selected.description}</p>
              <div className="mt-2.5 flex flex-col gap-1.5 text-[11px] text-text-muted">
                <span>Service: {selected.service}</span>
                {registryMatch && <span>Location: {registryMatch.location}</span>}
                {registryMatch?.lastTrip && <span>Last maintenance: {registryMatch.lastTrip}</span>}
              </div>
              {selected.linkedSop && (
                <Link href="/documents" className="mt-2.5 inline-block text-[11px] text-accent-blue hover:underline">
                  Reference: {selected.linkedSop} →
                </Link>
              )}
              <div className="mt-4 flex gap-2">
                <Link
                  href="/maintenance"
                  className="flex-1 rounded-md border border-border-subtle py-2 text-center text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                >
                  Full Details
                </Link>
                <Link
                  href={`/chat?q=${encodeURIComponent(`Tell me about ${selected.tag} — ${selected.name}`)}`}
                  className="flex-1 rounded-md bg-accent-blue py-2 text-center text-xs font-semibold text-white transition hover:brightness-90"
                >
                  Ask AI
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cross-reference bottom panel */}
        {selected && (
          <div className="border-t border-border-subtle bg-bg-secondary px-4 py-3">
            <div className="flex gap-4 border-b border-border-subtle text-xs">
              {(["documents", "history", "connected", "safety"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b-2 pb-2 capitalize ${tab === t ? "border-b-accent-blue text-text-primary" : "border-b-transparent text-text-muted"}`}
                >
                  {t === "documents" ? "Related Documents" : t === "history" ? "Maintenance History" : t === "connected" ? "Connected Equipment" : "Safety Notes"}
                </button>
              ))}
            </div>
            <div className="pt-2.5 text-xs text-text-secondary">
              {tab === "documents" && `Documents mentioning ${selected.tag}: NTPC Sipat STPP Stage-III P&ID set, ${selected.linkedSop ?? "General O&M Best Practices manual"}.`}
              {tab === "history" && (registryMatch?.lastTrip ?? "No recent maintenance events recorded for this tag.")}
              {tab === "connected" && "Upstream: Boiler superheater outlet · Downstream: HP Turbine inlet."}
              {tab === "safety" && (selected.type === "safety" ? "Overpressure protection device — mandatory annual pop testing per OISD guidelines." : "No active safety flags for this equipment.")}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border-subtle bg-bg-secondary p-5 lg:block">
          <h3 className="font-display text-sm font-semibold text-text-primary">Legend</h3>
          {legendBody}
        </aside>
      )}
      <Modal open={legendModalOpen} onClose={() => setLegendModalOpen(false)} title="Legend" className="lg:hidden">
        {legendBody}
      </Modal>
    </div>
  );
}

function LegendSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold text-text-primary">{title}</h4>
      <div className="mt-2 flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-text-secondary">
      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} />
      {label}
    </div>
  );
}
