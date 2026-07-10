"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import clsx from "clsx";

const SIZE_CLASS = { md: "max-w-md", lg: "max-w-2xl" } as const;

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Extra classes on the fixed overlay root, e.g. "lg:hidden" to only show below a breakpoint */
  className?: string;
  /** Modal width — "lg" for content-heavy viewers like document previews */
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className={clsx("fixed inset-0 z-50 flex items-center justify-center p-4", className)}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={clsx("relative z-10 flex max-h-[85vh] w-full flex-col rounded-xl border border-border-subtle bg-bg-elevated p-6 shadow-2xl", SIZE_CLASS[size])}
          >
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <h2 className="font-display text-base font-semibold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
