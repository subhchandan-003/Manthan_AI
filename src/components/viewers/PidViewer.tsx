"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";
import { HealthDot } from "@/components/ui/HealthDot";
import { equipment as equipmentRegistry } from "@/lib/mock-data";
import type { EquipmentItem } from "@/lib/types";

interface PidNode {
  tag: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const NODES: PidNode[] = [
  { tag: "Boiler Feed Pump-A", x: 30, y: 150, w: 110, h: 40 },
  { tag: "Attemperator", x: 180, y: 150, w: 100, h: 40 },
  { tag: "Platen Superheater", x: 320, y: 150, w: 110, h: 40 },
  { tag: "ID Fan-A", x: 480, y: 80, w: 90, h: 36 },
  { tag: "ID Fan-B", x: 480, y: 220, w: 90, h: 36 },
  { tag: "ESP", x: 610, y: 150, w: 70, h: 40 },
  { tag: "FGD Absorber", x: 720, y: 150, w: 100, h: 40 },
  { tag: "Cooling System Fan", x: 180, y: 260, w: 110, h: 36 },
  { tag: "Purge Fan No. 12 (East)", x: 320, y: 260, w: 130, h: 36 },
];

const EDGES: [string, string][] = [
  ["Boiler Feed Pump-A", "Attemperator"],
  ["Attemperator", "Platen Superheater"],
  ["Platen Superheater", "ID Fan-A"],
  ["Platen Superheater", "ID Fan-B"],
  ["ID Fan-A", "ESP"],
  ["ID Fan-B", "ESP"],
  ["ESP", "FGD Absorber"],
];

export function PidViewer({ highlightTag, onViewSummary }: { highlightTag?: string; onViewSummary?: (tag: string) => void }) {
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(highlightTag ?? null);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!highlightTag) return;
    setSelected(highlightTag);
    const node = NODES.find((n) => n.tag === highlightTag);
    if (node) {
      setZoom(1.6);
      setPan({ x: -(node.x + node.w / 2 - 400) * 1.6, y: -(node.y + node.h / 2 - 180) * 1.6 });
    }
  }, [highlightTag]);

  const selectedEquipment: EquipmentItem | undefined = selected ? equipmentRegistry.find((e) => e.tag === selected) : undefined;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border-subtle bg-bg-secondary px-2 py-2 text-xs">
        <button onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} className="rounded-md border border-border-subtle p-1.5">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="w-10 text-center text-text-secondary">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} className="rounded-md border border-border-subtle p-1.5">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="rounded-md border border-border-subtle p-1.5"
          title="Fit to screen"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <span className="ml-1 flex items-center gap-1 text-[11px] text-text-muted">
          <Move className="h-3 w-3" /> Read-only reference view
        </span>
      </div>

      <div className="relative h-[46vh] overflow-hidden bg-[#0a0e13]">
        <svg
          viewBox="0 0 900 340"
          className="h-full w-full transition-transform duration-300"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center" }}
        >
          {EDGES.map(([a, b], i) => {
            const na = NODES.find((n) => n.tag === a)!;
            const nb = NODES.find((n) => n.tag === b)!;
            return (
              <line
                key={i}
                x1={na.x + na.w}
                y1={na.y + na.h / 2}
                x2={nb.x}
                y2={nb.y + nb.h / 2}
                stroke="#3D4A5C"
                strokeWidth={2}
              />
            );
          })}
          {NODES.map((n) => {
            const eq = equipmentRegistry.find((e) => e.tag === n.tag);
            const isHighlighted = selected === n.tag;
            const color = eq?.health === "critical" ? "#EF4444" : eq?.health === "warning" ? "#F59E0B" : "#3D8BFD";
            return (
              <g key={n.tag} className="cursor-pointer" onClick={() => setSelected(n.tag)}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={6}
                  fill={isHighlighted ? `${color}33` : `${color}18`}
                  stroke={isHighlighted ? "#F0F4F8" : color}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                />
                <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 4} textAnchor="middle" fontSize={9} fill="#F0F4F8">
                  {n.tag.length > 16 ? n.tag.slice(0, 14) + "…" : n.tag}
                </text>
              </g>
            );
          })}
        </svg>

        {selectedEquipment && (
          <div className="absolute right-3 top-3 w-64 rounded-lg border border-border-subtle bg-bg-elevated p-3.5 shadow-xl">
            <p className="font-mono text-[11px] text-accent-cyan">{selectedEquipment.tag}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <HealthDot status={selectedEquipment.health} />
              <p className="text-sm font-semibold text-text-primary">{selectedEquipment.name}</p>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">Status: {selectedEquipment.health}</p>
            <div className="mt-3 flex gap-2 text-[11px]">
              <Link
                href={`/chat?q=${encodeURIComponent(`Tell me about ${selectedEquipment.tag} — ${selectedEquipment.name}`)}`}
                className="flex-1 rounded-md border border-border-subtle py-1.5 text-center font-medium text-text-primary hover:bg-bg-tertiary"
              >
                Ask AI
              </Link>
              <button
                onClick={() => onViewSummary?.(selectedEquipment.tag)}
                className="flex-1 rounded-md bg-accent-blue py-1.5 text-center font-semibold text-white hover:brightness-90"
              >
                Equipment Summary
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="border-t border-border-subtle bg-bg-secondary px-3 py-2 text-[11px] text-text-muted">
        Simplified schematic — open the full P&amp;ID Viewer for annotated drawings and flow paths.
      </p>
    </div>
  );
}
