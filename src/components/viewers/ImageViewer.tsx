"use client";

import { useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, RefreshCcw } from "lucide-react";
import type { ImageContent } from "@/lib/documentViewer";

export function ImageViewer({ content }: { content: ImageContent }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const dragging = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = { startX: e.clientX, startY: e.clientY, originX: pan.x, originY: pan.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - dragging.current.startX;
    const dy = e.clientY - dragging.current.startY;
    setPan({ x: dragging.current.originX + dx, y: dragging.current.originY + dy });
  }
  function onMouseUp() {
    dragging.current = null;
  }
  function reset() {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className={fullscreen ? "fixed inset-4 z-[70] flex flex-col rounded-xl border border-border-subtle bg-bg-elevated p-3 shadow-2xl" : "flex flex-col"}>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border-subtle bg-bg-secondary px-2 py-2 text-xs">
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} className="rounded-md border border-border-subtle p-1.5">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="w-10 text-center text-text-secondary">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} className="rounded-md border border-border-subtle p-1.5">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1.5 h-4 w-px bg-border-subtle" />
        <button onClick={() => setRotation((r) => (r + 90) % 360)} className="rounded-md border border-border-subtle p-1.5">
          <RotateCw className="h-3.5 w-3.5" />
        </button>
        <button onClick={reset} className="flex items-center gap-1 rounded-md border border-border-subtle px-2 py-1.5 text-text-secondary">
          <RefreshCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <span className="ml-1 text-[11px] text-text-muted">Drag to pan</span>
        <button onClick={() => setFullscreen((v) => !v)} className="ml-auto rounded-md border border-border-subtle p-1.5">
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div
        className={`relative flex-1 select-none overflow-hidden bg-[#0a0e13] ${fullscreen ? "" : "h-[50vh]"}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: dragging.current ? "grabbing" : "grab" }}
      >
        <div
          className="absolute left-1/2 top-1/2 transition-transform"
          style={{ transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)` }}
        >
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.src} alt={content.caption} draggable={false} className="max-w-none rounded-md" style={{ width: 480 }} />
            {content.highlightBox && (
              <div
                className="absolute rounded-sm border-2 border-accent-cyan bg-accent-cyan/10"
                style={{
                  left: `${content.highlightBox.x}%`,
                  top: `${content.highlightBox.y}%`,
                  width: `${content.highlightBox.w}%`,
                  height: `${content.highlightBox.h}%`,
                }}
              />
            )}
          </div>
        </div>
        {content.highlightBox && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-bg-elevated/90 px-2 py-1 text-[11px] font-semibold text-accent-cyan">
            AI referenced this region
          </div>
        )}
      </div>
      <p className="border-t border-border-subtle bg-bg-secondary px-3 py-2 text-[11px] text-text-muted">{content.caption}</p>
    </div>
  );
}
