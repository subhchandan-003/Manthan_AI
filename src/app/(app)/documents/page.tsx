"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, LayoutGrid, List, Search } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UploadZone } from "@/components/documents/UploadZone";
import { KnowledgeGraph } from "@/components/documents/KnowledgeGraph";
import { documents } from "@/lib/mock-data";
import type { DocumentItem } from "@/lib/types";

const TYPES: Array<DocumentItem["type"] | "All"> = [
  "All",
  "P&ID",
  "SOP",
  "Maintenance Log",
  "Safety Manual",
  "OEM Manual",
  "Inspection Report",
];

const typeTone = {
  "P&ID": "purple",
  SOP: "blue",
  "Maintenance Log": "amber",
  "Safety Manual": "red",
  "OEM Manual": "cyan",
  "Inspection Report": "green",
} as const;

const statusLabel = { indexed: "Indexed ✓", processing: "Processing…", "needs-review": "Needs Review" } as const;
const statusTone = { indexed: "green", processing: "amber", "needs-review": "red" } as const;

export default function DocumentsPage() {
  const [typeFilter, setTypeFilter] = useState<(typeof TYPES)[number]>("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) =>
          (typeFilter === "All" || d.type === typeFilter) &&
          d.title.toLowerCase().includes(search.toLowerCase())
      ),
    [typeFilter, search]
  );

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <h1 className="font-display text-xl font-semibold text-text-primary">Document Intelligence Hub</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Upload, process and cross-reference your plant&apos;s P&amp;IDs, SOPs and maintenance records.
      </p>

      <Card className="mt-5">
        <CardHeader title="Upload Documents" />
        <UploadZone />
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as (typeof TYPES)[number])}
              className="rounded-md border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs text-text-primary focus:border-border-active focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-2.5 py-1.5 text-xs text-text-muted focus-within:border-border-active">
              <Search className="h-3.5 w-3.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, tag, equipment..."
                className="w-full bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
            <div className="flex rounded-md border border-border-subtle">
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 ${view === "grid" ? "bg-bg-tertiary text-text-primary" : "text-text-muted"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 ${view === "list" ? "bg-bg-tertiary text-text-primary" : "text-text-muted"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={view === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "flex flex-col gap-2"}>
            {filtered.map((d) => (
              <div key={d.id} className="rounded-md border border-border-subtle bg-bg-primary p-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 shrink-0 text-accent-purple" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-text-primary">{d.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone={typeTone[d.type]}>{d.type}</Badge>
                      <Badge tone={statusTone[d.status]}>{statusLabel[d.status]}</Badge>
                    </div>
                    {(d.tagsIdentified || d.loopsMapped) && (
                      <p className="mt-1.5 text-[11px] text-text-muted">
                        {d.tagsIdentified ?? 0} equipment tags identified · {d.loopsMapped ?? 0} control loops mapped
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-text-muted">Uploaded {d.uploadDate}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 text-xs">
                  <Link
                    href={d.type === "P&ID" ? "/pid-viewer" : "/documents"}
                    className="flex-1 rounded-md border border-border-subtle py-1.5 text-center font-medium text-text-primary hover:bg-bg-tertiary"
                  >
                    View
                  </Link>
                  <Link
                    href={d.type === "P&ID" ? "/pid-viewer" : "/chat"}
                    className="flex-1 rounded-md border border-border-subtle py-1.5 text-center font-medium text-text-primary hover:bg-bg-tertiary"
                  >
                    Analyze
                  </Link>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-text-muted">No documents match your filters.</p>
            )}
          </div>
          <p className="mt-4 text-[11px] text-text-muted">
            Showing {filtered.length} of {documents.length} documents
          </p>
        </Card>

        <Card>
          <CardHeader title="Knowledge Graph" />
          <KnowledgeGraph />
        </Card>
      </div>
    </div>
  );
}
