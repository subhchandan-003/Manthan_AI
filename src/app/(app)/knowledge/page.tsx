"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, BookOpen, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useIncidents } from "@/lib/incidentsStore";
import { formatDate } from "@/lib/dateFormat";
import { incidents as caseStudies } from "@/lib/mock-data";

export default function KnowledgePage() {
  const { incidents: workflowIncidents } = useIncidents();
  const [search, setSearch] = useState("");

  const publishedRcas = useMemo(
    () => workflowIncidents.filter((i) => i.rca && (i.stage === "knowledge-saved" || i.stage === "closed")),
    [workflowIncidents]
  );

  const q = search.trim().toLowerCase();
  const filteredRcas = q
    ? publishedRcas.filter(
        (i) => i.title.toLowerCase().includes(q) || i.equipmentTag?.toLowerCase().includes(q) || i.rca?.toLowerCase().includes(q)
      )
    : publishedRcas;
  const filteredCaseStudies = q
    ? caseStudies.filter((c) => c.title.toLowerCase().includes(q) || c.rootCause.toLowerCase().includes(q))
    : caseStudies;

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <h1 className="font-display text-xl font-semibold text-text-primary md:text-2xl">Knowledge Base</h1>
      <p className="mt-1.5 text-sm text-text-secondary">
        Search published RCAs and reference case studies across all equipment — the plant&apos;s institutional memory for diagnosing repeat failures.
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-md border border-border-subtle bg-bg-secondary px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by equipment, keyword, or failure mode..."
          className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <div className="mt-6">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-text-primary">
          <BookOpen className="h-4 w-4 text-accent-cyan" /> Published RCAs ({filteredRcas.length})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {filteredRcas.length === 0 && <p className="text-xs text-text-muted">No published RCAs match this search.</p>}
          {filteredRcas.map((i) => (
            <Card key={i.id} noMotion aiGenerated>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">{i.title}</p>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {i.equipmentTag ?? "General"} · {i.createdAt}
                  </p>
                </div>
                <Badge tone={i.severity === "critical" ? "red" : i.severity === "high" ? "amber" : "blue"}>{i.severity}</Badge>
              </div>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-relaxed text-text-secondary">{i.rca}</pre>
              {i.capa && (
                <p className="mt-3 text-xs text-text-secondary">
                  <span className="font-medium text-text-primary">CAPA:</span> {i.capa}
                </p>
              )}
              {i.equipmentTag && (
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/incidents?tag=${encodeURIComponent(i.equipmentTag)}`}
                    className="flex items-center gap-1.5 rounded-md border border-border-subtle px-2.5 py-1.5 text-[11px] font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
                  >
                    <FileText className="h-3.5 w-3.5" /> View Source Incident
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-sm font-semibold text-text-primary">Reference Case Studies ({filteredCaseStudies.length})</h2>
        <div className="mt-3 flex flex-col gap-3">
          {filteredCaseStudies.length === 0 && <p className="text-xs text-text-muted">No reference case studies match this search.</p>}
          {filteredCaseStudies.map((c) => (
            <Card key={c.id} noMotion>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-text-primary">{c.title}</p>
                  <p className="mt-1 text-[11px] text-text-muted">{formatDate(c.date)}</p>
                </div>
                <div className="flex gap-1.5">
                  <Badge tone={c.severity === "high" ? "red" : c.severity === "medium" ? "amber" : "blue"}>{c.severity}</Badge>
                  <Badge tone={c.status === "open" ? "amber" : "green"}>{c.status}</Badge>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-secondary">
                <span className="font-medium text-text-primary">Root cause:</span> {c.rootCause}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-medium text-text-secondary">Contributing Factors</p>
                  <ul className="mt-1.5 list-inside list-disc text-[11px] text-text-muted">
                    {c.contributingFactors.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-text-secondary">Corrective Actions</p>
                  <ul className="mt-1.5 list-inside list-disc text-[11px] text-text-muted">
                    {c.correctiveActions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
