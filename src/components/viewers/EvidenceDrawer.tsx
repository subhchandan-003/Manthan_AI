"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { DocumentViewer } from "./DocumentViewer";
import type { EvidenceCard } from "@/lib/documentViewer";

export function EvidenceDrawer({
  evidence,
  onClose,
  onViewEquipmentSummary,
}: {
  evidence: EvidenceCard | null;
  onClose: () => void;
  onViewEquipmentSummary?: (tag: string) => void;
}) {
  useEffect(() => {
    if (!evidence) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [evidence, onClose]);

  return (
    <AnimatePresence>
      {evidence && (
        <>
          {/* Light backdrop — the AI summary stays visible behind the drawer, this just signals modality */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border-subtle bg-bg-elevated shadow-2xl sm:w-[80vw] lg:w-[58vw] xl:w-[50vw]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse-glow" />
                <h2 className="font-display text-sm font-semibold text-text-primary">Evidence Viewer</h2>
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DocumentViewer evidence={evidence} onViewEquipmentSummary={onViewEquipmentSummary} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
