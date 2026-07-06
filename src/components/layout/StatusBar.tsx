"use client";

import { useSession } from "@/lib/session";
import { documents } from "@/lib/mock-data";

export function StatusBar() {
  const { session } = useSession();
  const indexed = documents.filter((d) => d.status === "indexed").length;

  return (
    <footer className="flex h-7 shrink-0 items-center gap-2 border-t border-border-subtle bg-bg-secondary px-4 font-mono text-[11px] text-text-muted">
      <span>Plant: {session?.plantShort ?? "—"}</span>
      <span className="text-border-subtle">·</span>
      <span>Unit: {session?.unit ?? "3"}</span>
      <span className="text-border-subtle">·</span>
      <span>Shift: {session?.shift ?? "B"}</span>
      <span className="text-border-subtle">·</span>
      <span>Last sync: 2 min ago</span>
      <span className="text-border-subtle">·</span>
      <span>{indexed} documents indexed</span>
    </footer>
  );
}
