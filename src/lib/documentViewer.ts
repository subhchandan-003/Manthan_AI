/**
 * Shared types for the Universal Evidence Viewer.
 *
 * There are no real PDF/Excel/Word binaries anywhere in this app — every
 * document is mock metadata. Rather than fake a viewer that "downloads" a
 * file that doesn't exist, each document gets real, structured, addressable
 * content (pages / sheets+rows / paragraphs) so the viewers below can do
 * real page navigation, real sorting/search, and real "jump to the exact
 * thing the AI used" highlighting. Swap `content` generation for a real
 * PDF.js / SheetJS / mammoth.js parse later — every viewer's props shape
 * stays the same.
 */

export interface PdfPage {
  pageNumber: number;
  heading: string;
  paragraphs: string[];
}

export interface PdfContent {
  kind: "pdf";
  pages: PdfPage[];
  /** 1-based page number the AI answer drew from */
  aiPage: number;
  /** index into that page's paragraphs array that AI actually used */
  aiParagraphIndex: number;
}

export interface ExcelSheet {
  name: string;
  columns: string[];
  rows: Record<string, string>[];
}

export interface ExcelContent {
  kind: "excel";
  sheets: ExcelSheet[];
  aiSheetIndex: number;
  aiRowIndex: number;
}

export interface WordSection {
  heading: string;
  paragraphs: string[];
}

export interface WordContent {
  kind: "word";
  sections: WordSection[];
  aiSectionIndex: number;
  aiParagraphIndex: number;
}

export interface ImageContent {
  kind: "image";
  src: string;
  caption: string;
  /** percentage-based box (0-100) to highlight, if AI referenced a specific area */
  highlightBox?: { x: number; y: number; w: number; h: number };
}

export interface PidContent {
  kind: "pid";
  highlightTag?: string;
}

export interface TextContent {
  kind: "text";
  text: string;
}

export type DocumentContent = PdfContent | ExcelContent | WordContent | ImageContent | PidContent | TextContent;

export type DocType = "PDF" | "Excel" | "Word" | "Image" | "Drawing" | "Text";

export interface EvidenceCard {
  id: string;
  name: string;
  docType: DocType;
  uploadDate: string;
  relevance: number;
  /** How much this single source contributed to the AI's overall confidence score */
  confidenceContribution: number;
  version?: string;
  uploadedBy?: string;
  fileSize?: string;
  status?: string;
  content: DocumentContent;
}

/** Generates a simple labelled schematic placeholder — used where no real photo/scan exists. */
export function placeholderImage(label: string, accent = "#3D8BFD"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
    <rect width="640" height="420" fill="#151c25"/>
    <rect x="40" y="40" width="560" height="340" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="8 6" rx="12"/>
    <circle cx="320" cy="170" r="70" fill="${accent}22" stroke="${accent}" stroke-width="3"/>
    <rect x="260" y="260" width="120" height="18" fill="${accent}55"/>
    <text x="320" y="360" text-anchor="middle" font-family="monospace" font-size="20" fill="#F0F4F8">${label}</text>
    <text x="320" y="385" text-anchor="middle" font-family="monospace" font-size="11" fill="#64748B">Field photo placeholder — no image on file</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
