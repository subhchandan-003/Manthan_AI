/**
 * Single source of truth for how dates/times are displayed across the app. Previously each
 * page had its own inline toLocaleString(...) call with slightly different options (some
 * missing the year, one missing all formatting entirely), so the same incident's header and
 * its own activity log could show two different date styles side by side.
 */

/** "21 Jul 2026, 08:15 pm" — for anything with a specific moment in time (created/completed/etc). */
export function formatDateTime(input: Date | number | string = new Date()): string {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** "21 Jul 2026" — for date-only fields (due dates, PM schedules, document upload dates). */
export function formatDate(input: Date | number | string): string {
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
