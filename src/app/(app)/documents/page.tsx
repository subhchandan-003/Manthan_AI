"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FileText, LayoutGrid, List, Search, Download, MessageSquare } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { UploadZone } from "@/components/documents/UploadZone";
import { KnowledgeGraph } from "@/components/documents/KnowledgeGraph";
import { downloadTextFile } from "@/lib/download";
import { formatDate } from "@/lib/dateFormat";
import { useSession } from "@/lib/session";
import { getRoleAccess } from "@/lib/roles";
import { documents } from "@/lib/mock-data";
import { DOCUMENT_CONTENT } from "@/lib/documentContent";
import type { DocumentItem } from "@/lib/types";

const TYPES: Array<DocumentItem["type"] | "All"> = [
  "All",
  "P&ID",
  "PFD",
  "SOP",
  "Maintenance Log",
  "Safety Manual",
  "OEM Manual",
  "Inspection Report",
  "Reference Report",
];

const typeTone = {
  "P&ID": "purple",
  PFD: "purple",
  SOP: "blue",
  "Maintenance Log": "amber",
  "Safety Manual": "red",
  "OEM Manual": "cyan",
  "Inspection Report": "green",
  "Reference Report": "neutral",
} as const;

const statusLabel = { indexed: "Indexed ✓", processing: "Processing…", "needs-review": "Needs Review" } as const;
const statusTone = { indexed: "green", processing: "amber", "needs-review": "red" } as const;

// DOCUMENT_CONTENT lives in @/lib/documentContent so the Chat page's evidence viewer can share it.

function DocumentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSession();
  const canDownload = getRoleAccess(session?.role).canDownloadDocuments;
  const [typeFilter, setTypeFilter] = useState<(typeof TYPES)[number]>("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  useEffect(() => {
    const docId = searchParams.get("doc");
    if (!docId) return;
    const match = documents.find((d) => d.id === docId);
    if (!match) return;
    if (match.type === "P&ID") {
      router.replace("/pid-viewer");
      return;
    }
    setPreviewDoc(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) =>
          (typeFilter === "All" || d.type === typeFilter) &&
          d.title.toLowerCase().includes(search.toLowerCase())
      ),
    [typeFilter, search]
  );

  function handleDownload(d: DocumentItem) {
    const content = `MANTHAN — Document Record
Title: ${d.title}
Type: ${d.type}
Reference: ${d.docNo ?? "—"}
Status: ${statusLabel[d.status]}
Uploaded: ${formatDate(d.uploadDate)}
${d.tagsIdentified ? `Equipment tags identified: ${d.tagsIdentified}\n` : ""}${
      d.loopsMapped ? `Control loops mapped: ${d.loopsMapped}\n` : ""
    }`;
    downloadTextFile(`${d.title.slice(0, 40).replace(/[^\w-]+/g, "_")}.txt`, content);
    toast.success("Download started", { description: d.title });
  }

  return (
    <div className="mx-auto max-w-[1440px] p-6 md:p-8">
      <h1 className="font-display text-xl font-semibold text-text-primary md:text-2xl">Document Intelligence Hub</h1>
      <p className="mt-1.5 text-sm text-text-secondary">
        Upload, process and cross-reference your plant&apos;s P&amp;IDs, SOPs and maintenance records.
      </p>

      <Card className="mt-6">
        <CardHeader title="Upload Documents" />
        <UploadZone />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as (typeof TYPES)[number])}
              className="rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-primary focus:border-border-active focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-xs text-text-muted focus-within:border-border-active">
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
                className={`p-2 transition-colors ${view === "grid" ? "bg-bg-tertiary text-text-primary" : "text-text-muted"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 transition-colors ${view === "list" ? "bg-bg-tertiary text-text-primary" : "text-text-muted"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className={view === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "flex flex-col gap-3"}>
            {filtered.map((d) => (
              <div key={d.id} className="rounded-md border border-border-subtle bg-bg-primary p-4 transition-colors hover:border-border-active/50">
                <div className="flex items-start gap-2.5">
                  <FileText className="h-5 w-5 shrink-0 text-accent-purple" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-text-primary">{d.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone={typeTone[d.type]}>{d.type}</Badge>
                      <Badge tone={statusTone[d.status]}>{statusLabel[d.status]}</Badge>
                    </div>
                    {(d.tagsIdentified || d.loopsMapped) && (
                      <p className="mt-2 text-[11px] text-text-muted">
                        {d.tagsIdentified ?? 0} equipment tags identified · {d.loopsMapped ?? 0} control loops mapped
                      </p>
                    )}
                    {d.docNo && <p className="mt-1 font-mono text-[11px] text-text-muted">Ref: {d.docNo}</p>}
                    <p className="mt-1 text-[11px] text-text-muted">Uploaded {formatDate(d.uploadDate)}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 text-xs">
                  {d.type === "P&ID" ? (
                    <Link
                      href="/pid-viewer"
                      className="flex-1 rounded-md border border-border-subtle py-2 text-center font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                    >
                      View
                    </Link>
                  ) : (
                    <button
                      onClick={() => setPreviewDoc(d)}
                      className="flex-1 rounded-md border border-border-subtle py-2 text-center font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                    >
                      View
                    </button>
                  )}
                  <Link
                    href={
                      d.type === "P&ID"
                        ? "/pid-viewer"
                        : `/chat?q=${encodeURIComponent(`Tell me about the document "${d.title}"`)}`
                    }
                    className="flex-1 rounded-md border border-border-subtle py-2 text-center font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                  >
                    Analyze
                  </Link>
                  {canDownload && (
                    <button
                      onClick={() => handleDownload(d)}
                      aria-label="Download"
                      className="rounded-md border border-border-subtle px-2.5 py-2 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-text-muted">No documents match your filters.</p>
            )}
          </div>
          <p className="mt-5 text-[11px] text-text-muted">
            Showing {filtered.length} of {documents.length} documents
          </p>
        </Card>

        <Card>
          <CardHeader title="Knowledge Graph" />
          <KnowledgeGraph />
        </Card>
      </div>

      <Modal open={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.title ?? ""} size="lg">
        {previewDoc && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={typeTone[previewDoc.type]}>{previewDoc.type}</Badge>
              <Badge tone={statusTone[previewDoc.status]}>{statusLabel[previewDoc.status]}</Badge>
            </div>
            <dl className="space-y-1.5 text-xs">
              {previewDoc.docNo && (
                <div className="flex justify-between gap-3">
                  <dt className="text-text-secondary">Reference</dt>
                  <dd className="font-mono text-text-primary">{previewDoc.docNo}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-text-secondary">Uploaded</dt>
                <dd className="text-text-primary">{formatDate(previewDoc.uploadDate)}</dd>
              </div>
              {previewDoc.tagsIdentified !== undefined && (
                <div className="flex justify-between gap-3">
                  <dt className="text-text-secondary">Equipment tags</dt>
                  <dd className="text-text-primary">{previewDoc.tagsIdentified}</dd>
                </div>
              )}
            </dl>
            <pre className="whitespace-pre-wrap rounded-lg border border-border-subtle bg-bg-primary p-4 font-mono text-xs leading-relaxed text-text-secondary">
              {DOCUMENT_CONTENT[previewDoc.id] ?? "No extracted content available yet — this document is still processing."}
            </pre>
            <div className="mt-2 flex gap-2">
              {canDownload && (
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border-subtle py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              )}
              <Link
                href={`/chat?q=${encodeURIComponent(`Tell me about the document "${previewDoc.title}"`)}`}
                onClick={() => setPreviewDoc(null)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent-blue py-2 text-xs font-semibold text-white transition hover:brightness-90"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Ask AI
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={null}>
      <DocumentsContent />
    </Suspense>
  );
}
