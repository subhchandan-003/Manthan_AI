"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Search,
  StretchHorizontal,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import type { PdfContent } from "@/lib/documentViewer";

function highlightMatches(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-accent-amber/40 text-text-primary">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function PdfViewer({ content }: { content: PdfContent }) {
  const [page, setPage] = useState(content.aiPage);
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState("");
  const [fitWidth, setFitWidth] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  const current = content.pages.find((p) => p.pageNumber === page) ?? content.pages[0];
  const isAiPage = page === content.aiPage;

  const matchCount = useMemo(() => {
    if (!search.trim()) return 0;
    return content.pages.reduce((sum, p) => sum + p.paragraphs.join(" ").toLowerCase().split(search.toLowerCase()).length - 1, 0);
  }, [search, content.pages]);

  return (
    <div className={fullscreen ? "fixed inset-4 z-[70] flex flex-col rounded-xl border border-border-subtle bg-bg-elevated p-3 shadow-2xl" : "flex flex-col"}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border-subtle bg-bg-secondary px-2 py-2 text-xs">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-md border border-border-subtle p-1.5 disabled:opacity-30">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="w-24 text-center text-text-secondary">
          Page {page} of {content.pages.length}
        </span>
        <button onClick={() => setPage((p) => Math.min(content.pages.length, p + 1))} disabled={page >= content.pages.length} className="rounded-md border border-border-subtle p-1.5 disabled:opacity-30">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1.5 h-4 w-px bg-border-subtle" />
        <button onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))} className="rounded-md border border-border-subtle p-1.5">
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <span className="w-10 text-center text-text-secondary">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))} className="rounded-md border border-border-subtle p-1.5">
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setFitWidth((v) => !v)}
          className={`flex items-center gap-1 rounded-md border px-2 py-1.5 ${fitWidth ? "border-border-active bg-accent-blue/10 text-text-primary" : "border-border-subtle text-text-secondary"}`}
        >
          <StretchHorizontal className="h-3.5 w-3.5" /> Fit width
        </button>
        <div className="mx-1.5 h-4 w-px bg-border-subtle" />
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border-subtle bg-bg-primary px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search this document..."
            className="w-full min-w-0 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          {search && <span className="shrink-0 text-[11px] text-text-muted">{matchCount} match{matchCount === 1 ? "" : "es"}</span>}
        </div>
        <button onClick={() => setFullscreen((v) => !v)} className="rounded-md border border-border-subtle p-1.5">
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Page jump strip */}
      <div className="flex gap-1 overflow-x-auto border-b border-border-subtle bg-bg-primary px-2 py-1.5">
        {content.pages.map((p) => (
          <button
            key={p.pageNumber}
            onClick={() => setPage(p.pageNumber)}
            className={`shrink-0 rounded px-2 py-1 text-[11px] font-medium ${
              p.pageNumber === page ? "bg-accent-blue text-white" : p.pageNumber === content.aiPage ? "bg-accent-cyan/15 text-accent-cyan" : "text-text-muted hover:bg-bg-tertiary"
            }`}
          >
            {p.pageNumber}
            {p.pageNumber === content.aiPage && " ✦"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-auto bg-bg-primary p-6 ${fullscreen ? "" : "max-h-[55vh]"}`}>
        <div className={fitWidth ? "mx-auto max-w-2xl" : "mx-auto w-[42rem]"} style={{ fontSize: `${zoom}rem`, transformOrigin: "top" }}>
          <h3 className="font-display text-sm font-semibold text-text-primary">{current.heading}</h3>
          <div className="mt-3 flex flex-col gap-3 text-xs leading-relaxed text-text-secondary">
            {current.paragraphs.map((para, idx) => {
              const isAiPara = isAiPage && idx === content.aiParagraphIndex;
              return (
                <div key={idx}>
                  {isAiPara && (
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-accent-cyan">
                      <Sparkles className="h-3 w-3" /> AI used this section
                    </div>
                  )}
                  <p className={isAiPara ? "rounded-md border-l-2 border-l-accent-cyan bg-accent-cyan/10 p-2.5 text-text-primary" : ""}>
                    {highlightMatches(para, search)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
