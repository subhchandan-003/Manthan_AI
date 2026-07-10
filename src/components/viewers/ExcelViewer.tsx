"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Search, Sparkles } from "lucide-react";
import type { ExcelContent } from "@/lib/documentViewer";

export function ExcelViewer({ content }: { content: ExcelContent }) {
  const [sheetIndex, setSheetIndex] = useState(content.aiSheetIndex);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const aiRowRef = useRef<HTMLTableRowElement>(null);

  const sheet = content.sheets[sheetIndex];
  const isAiSheet = sheetIndex === content.aiSheetIndex;

  useEffect(() => {
    aiRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [sheetIndex]);

  const rows = useMemo(() => {
    let list = sheet.rows.map((row, idx) => ({ row, originalIndex: idx }));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(({ row }) => Object.values(row).some((v) => v.toLowerCase().includes(q)));
    }
    if (sortCol) {
      list = [...list].sort((a, b) => {
        const av = a.row[sortCol] ?? "";
        const bv = b.row[sortCol] ?? "";
        const cmp = av.localeCompare(bv, undefined, { numeric: true });
        return sortAsc ? cmp : -cmp;
      });
    }
    return list;
  }, [sheet, search, sortCol, sortAsc]);

  function toggleSort(col: string) {
    if (sortCol === col) setSortAsc((v) => !v);
    else {
      setSortCol(col);
      setSortAsc(true);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Sheet tabs */}
      <div className="flex gap-1 border-b border-border-subtle bg-bg-secondary px-2 pt-2">
        {content.sheets.map((s, idx) => (
          <button
            key={s.name}
            onClick={() => setSheetIndex(idx)}
            className={`rounded-t-md border-x border-t px-3 py-1.5 text-xs font-medium ${
              idx === sheetIndex ? "border-border-subtle bg-bg-primary text-text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
            }`}
          >
            {s.name}
            {idx === content.aiSheetIndex && " ✦"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-border-subtle bg-bg-primary px-3 py-2 text-xs">
        <Search className="h-3.5 w-3.5 text-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search this sheet..."
          className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <span className="text-[11px] text-text-muted">{rows.length} of {sheet.rows.length} rows</span>
      </div>

      {isAiSheet && (
        <div className="flex items-center gap-1.5 border-b border-border-subtle bg-accent-cyan/10 px-3 py-1.5 text-[11px] font-semibold text-accent-cyan">
          <Sparkles className="h-3 w-3" /> AI used this record — highlighted below
        </div>
      )}

      <div className="max-h-[50vh] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-bg-tertiary text-text-secondary">
            <tr>
              {sheet.columns.map((col) => (
                <th key={col} className="cursor-pointer select-none whitespace-nowrap px-3 py-2 font-medium" onClick={() => toggleSort(col)}>
                  <span className="flex items-center gap-1">
                    {col} <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ row, originalIndex }) => {
              const isAiRow = isAiSheet && originalIndex === content.aiRowIndex;
              return (
                <tr
                  key={originalIndex}
                  ref={isAiRow ? aiRowRef : undefined}
                  className={`border-t border-border-subtle ${isAiRow ? "bg-accent-cyan/10" : "bg-bg-secondary"}`}
                >
                  {sheet.columns.map((col) => (
                    <td key={col} className="whitespace-nowrap px-3 py-2 text-text-secondary">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={sheet.columns.length} className="px-3 py-6 text-center text-text-muted">
                  No rows match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
