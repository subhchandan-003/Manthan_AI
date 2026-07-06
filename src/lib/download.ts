export function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown) {
  downloadTextFile(filename, JSON.stringify(data, null, 2), "application/json");
}

/** Opens the browser print dialog scoped to the current page — lets the user "Save as PDF" for real. */
export function printToPdf() {
  window.print();
}

export async function shareOrCopyLink(title: string, text: string, url: string) {
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title, text, url });
      return "shared" as const;
    } catch {
      // user cancelled — fall through to clipboard as a no-op
      return "cancelled" as const;
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied" as const;
}
