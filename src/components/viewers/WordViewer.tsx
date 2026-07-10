"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { WordContent } from "@/lib/documentViewer";

export function WordViewer({ content }: { content: WordContent }) {
  const aiRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    aiRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <div className="max-h-[55vh] overflow-y-auto bg-bg-primary p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {content.sections.map((section, sIdx) => (
          <div key={sIdx}>
            <h3 className="font-display text-sm font-semibold text-text-primary">{section.heading}</h3>
            <div className="mt-2.5 flex flex-col gap-2.5 text-xs leading-relaxed text-text-secondary">
              {section.paragraphs.map((para, pIdx) => {
                const isAi = sIdx === content.aiSectionIndex && pIdx === content.aiParagraphIndex;
                return (
                  <div key={pIdx}>
                    {isAi && (
                      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-accent-cyan">
                        <Sparkles className="h-3 w-3" /> Referenced by AI
                      </div>
                    )}
                    <p ref={isAi ? aiRef : undefined} className={isAi ? "rounded-md border-l-2 border-l-accent-cyan bg-accent-cyan/10 p-2.5 text-text-primary" : ""}>
                      {para}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
