"use client";

import { useSession } from "@/lib/session";
import { documents } from "@/lib/mock-data";

export function StatusBar() {
  const { session } = useSession();
  const indexed = documents.filter((d) => d.status === "indexed").length;

  return (
    <footer className="hidden h-7 shrink-0 items-center gap-2 overflow-x-auto border-t border-border-subtle bg-bg-secondary px-4 font-mono text-[11px] text-text-muted md:flex">
      <span className="shrink-0">Plant: {session?.plantShort ?? "—"}</span>
      <span className="shrink-0 text-border-subtle">·</span>
      <span className="shrink-0">Unit: {session?.unit ?? "3"}</span>
      <span className="shrink-0 text-border-subtle">·</span>
      <span className="shrink-0">Shift: {session?.shift ?? "B"}</span>
      <span className="shrink-0 text-border-subtle">·</span>
      <span className="shrink-0">Last sync: 2 min ago</span>
      <span className="shrink-0 text-border-subtle">·</span>
      <span className="shrink-0">{indexed} documents indexed</span>
    </footer>
  );
}
