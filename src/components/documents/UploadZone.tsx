"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

const STAGES = ["Uploading", "OCR", "Symbol Recognition", "Indexing", "Cross-Referencing", "Done"];

interface UploadJob {
  id: string;
  name: string;
  stageIndex: number;
  pct: number;
}

export function UploadZone() {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function ingest(files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setJobs((prev) => [...prev, { id, name: file.name, stageIndex: 0, pct: 0 }]);
      runProgress(id);
    });
  }

  function runProgress(id: string) {
    let stageIndex = 0;
    let pct = 0;
    const interval = setInterval(() => {
      pct += 14;
      if (pct >= 100) {
        pct = 0;
        stageIndex += 1;
      }
      if (stageIndex >= STAGES.length - 1) {
        setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, stageIndex: STAGES.length - 1, pct: 100 } : j)));
        clearInterval(interval);
        return;
      }
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, stageIndex, pct } : j)));
    }, 220);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          ingest(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
          dragOver ? "border-border-active bg-accent-blue/5" : "border-border-subtle bg-bg-secondary hover:border-border-active/60"
        }`}
      >
        <UploadCloud className="h-7 w-7 text-text-muted" strokeWidth={1.5} />
        <p className="text-sm text-text-secondary">Drop your plant documents here or click to browse</p>
        <p className="text-[11px] text-text-muted">PDF, PNG, JPG, TIFF, DWG, DXF, XLSX, DOCX</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => ingest(e.target.files)}
        />
      </div>

      {jobs.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {jobs.map((j) => (
            <div key={j.id} className="rounded-md border border-border-subtle bg-bg-secondary p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium text-text-primary">{j.name}</span>
                <span className="text-text-muted">
                  {STAGES[j.stageIndex]} {j.stageIndex === STAGES.length - 1 ? "✓" : `· ${j.pct}%`}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-tertiary">
                <div
                  className={`h-full rounded-full transition-all ${
                    j.stageIndex === STAGES.length - 1 ? "bg-accent-green" : "bg-accent-blue"
                  }`}
                  style={{
                    width: `${((j.stageIndex + j.pct / 100) / (STAGES.length - 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
