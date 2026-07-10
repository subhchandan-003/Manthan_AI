"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, FileText } from "lucide-react";

/** Simple flat-content viewer item — used for the Incidents page's attachment viewer. */
export interface EvidenceItem {
  name: string;
  type: string;
  date: string;
  relevance: number;
  content: string;
  viewerKind: "text" | "pid" | "table" | "image";
}

export function DocumentViewerModal({ item, onClose }: { item: EvidenceItem | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-border-subtle bg-bg-elevated shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border-subtle p-5">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 shrink-0 text-accent-purple" />
                <div className="min-w-0">
                  <h2 className="truncate font-display text-sm font-semibold text-text-primary">{item.name}</h2>
                  <p className="text-[11px] text-text-muted">
                    {item.type} · {item.date}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {item.viewerKind === "pid" ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-border-subtle bg-bg-primary p-8 text-center">
                  <p className="text-xs text-text-secondary">{item.content}</p>
                  <p className="text-[11px] text-text-muted">Open the full interactive P&amp;ID viewer for annotations and flow paths.</p>
                </div>
              ) : item.viewerKind === "image" ? (
                <div className="flex items-center justify-center rounded-lg border border-border-subtle bg-bg-primary p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.content} alt={item.name} className="max-h-[55vh] max-w-full rounded-md object-contain" />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap rounded-lg border border-border-subtle bg-bg-primary p-4 font-mono text-xs leading-relaxed text-text-secondary">
                  {item.content}
                </pre>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
