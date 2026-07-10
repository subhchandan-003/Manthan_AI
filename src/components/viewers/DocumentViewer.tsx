"use client";

import { FileText, FileSpreadsheet, FileType, Image as ImageIcon, GitBranch, File } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { EvidenceCard } from "@/lib/documentViewer";
import { PdfViewer } from "./PdfViewer";
import { ExcelViewer } from "./ExcelViewer";
import { WordViewer } from "./WordViewer";
import { ImageViewer } from "./ImageViewer";
import { PidViewer } from "./PidViewer";

const docTypeIcon: Record<EvidenceCard["docType"], typeof FileText> = {
  PDF: FileText,
  Excel: FileSpreadsheet,
  Word: FileType,
  Image: ImageIcon,
  Drawing: GitBranch,
  Text: File,
};

export function DocumentViewer({ evidence, onViewEquipmentSummary }: { evidence: EvidenceCard; onViewEquipmentSummary?: (tag: string) => void }) {
  const Icon = docTypeIcon[evidence.docType];

  return (
    <div className="flex flex-col">
      {/* Document header */}
      <div className="border-b border-border-subtle bg-bg-secondary p-4">
        <div className="flex items-start gap-2.5">
          <Icon className="h-5 w-5 shrink-0 text-accent-purple" strokeWidth={1.5} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-sm font-semibold text-text-primary">{evidence.name}</h2>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-text-secondary sm:grid-cols-4">
              <span>Type: <span className="text-text-primary">{evidence.docType}</span></span>
              <span>Version: <span className="text-text-primary">{evidence.version ?? "1.0"}</span></span>
              <span>Uploaded: <span className="text-text-primary">{evidence.uploadDate}</span></span>
              <span>By: <span className="text-text-primary">{evidence.uploadedBy ?? "System"}</span></span>
              <span>Size: <span className="text-text-primary">{evidence.fileSize ?? "—"}</span></span>
              <span>Status: <Badge tone="green">{evidence.status ?? "Indexed"}</Badge></span>
            </div>
          </div>
        </div>
      </div>

      {/* Type-specific viewer */}
      {evidence.content.kind === "pdf" && <PdfViewer content={evidence.content} />}
      {evidence.content.kind === "excel" && <ExcelViewer content={evidence.content} />}
      {evidence.content.kind === "word" && <WordViewer content={evidence.content} />}
      {evidence.content.kind === "image" && <ImageViewer content={evidence.content} />}
      {evidence.content.kind === "pid" && <PidViewer highlightTag={evidence.content.highlightTag} onViewSummary={onViewEquipmentSummary} />}
      {evidence.content.kind === "text" && (
        <pre className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap bg-bg-primary p-5 font-mono text-xs leading-relaxed text-text-secondary">
          {evidence.content.text}
        </pre>
      )}
    </div>
  );
}
