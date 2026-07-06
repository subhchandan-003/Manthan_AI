"use client";

import { useState } from "react";

type NodeType = "document" | "equipment" | "process" | "standard" | "safety";

interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
}

const typeColor: Record<NodeType, string> = {
  document: "#8B5CF6",
  equipment: "#3D8BFD",
  process: "#10B981",
  standard: "#F59E0B",
  safety: "#EF4444",
};

const NODES: GraphNode[] = [
  { id: "n1", label: "Sipat P&ID Set", type: "document", x: 60, y: 40 },
  { id: "n2", label: "Attemperator", type: "equipment", x: 200, y: 30 },
  { id: "n3", label: "ID Fan-A", type: "equipment", x: 260, y: 110 },
  { id: "n4", label: "Main Steam Flow", type: "process", x: 140, y: 110 },
  { id: "n5", label: "O&M Best Practices", type: "standard", x: 40, y: 150 },
  { id: "n6", label: "OISD STD 106", type: "standard", x: 300, y: 40 },
  { id: "n7", label: "Superheater Tube Leak", type: "safety", x: 200, y: 190 },
  { id: "n8", label: "Air & Flue Gas Path", type: "process", x: 300, y: 170 },
];

const EDGES: [string, string][] = [
  ["n1", "n2"],
  ["n1", "n4"],
  ["n4", "n2"],
  ["n4", "n3"],
  ["n2", "n5"],
  ["n3", "n8"],
  ["n6", "n2"],
  ["n4", "n7"],
];

export function KnowledgeGraph() {
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const connected = new Set<string>();
  if (hovered) {
    EDGES.forEach(([a, b]) => {
      if (a === hovered) connected.add(b);
      if (b === hovered) connected.add(a);
    });
  }

  return (
    <div>
      <svg viewBox="0 0 340 220" className="w-full rounded-md border border-border-subtle bg-bg-primary">
        {EDGES.map(([a, b], i) => {
          const na = NODES.find((n) => n.id === a)!;
          const nb = NODES.find((n) => n.id === b)!;
          const dim = hovered && a !== hovered && b !== hovered;
          return (
            <line
              key={i}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke="var(--border-subtle)"
              strokeWidth={dim ? 1 : 1.5}
              opacity={dim ? 0.3 : 0.8}
            />
          );
        })}
        {NODES.map((n) => {
          const dim = hovered && hovered !== n.id && !connected.has(n.id);
          return (
            <g
              key={n.id}
              onClick={() => setSelected(n)}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
              opacity={dim ? 0.35 : 1}
            >
              <circle cx={n.x} cy={n.y} r={selected?.id === n.id ? 9 : 7} fill={typeColor[n.type]} stroke="var(--bg-primary)" strokeWidth={2} />
              <text x={n.x} y={n.y - 12} textAnchor="middle" fontSize={8} fill="var(--text-secondary)" className="select-none">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-muted">
        {(Object.entries(typeColor) as [NodeType, string][]).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>

      {selected && (
        <div className="mt-3 rounded-md border border-border-subtle bg-bg-primary p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: typeColor[selected.type] }} />
            <span className="font-medium text-text-primary">{selected.label}</span>
          </div>
          <p className="mt-1 text-text-muted">
            Type: {selected.type} · Connected to{" "}
            {EDGES.filter(([a, b]) => a === selected.id || b === selected.id).length} nodes
          </p>
        </div>
      )}

      <p className="mt-3 text-[11px] text-text-muted">
        Knowledge Graph: 1,247 nodes · 3,891 relationships · Last updated: 2 min ago
      </p>
    </div>
  );
}
