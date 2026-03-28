/**
 * Normalize a conference slug for cross-source matching.
 * Lowercases, strips year suffixes (2-digit or 4-digit), collapses hyphens, trims.
 */
export function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, "-")
    .replace(/-?(20\d{2}|\d{2})$/, "")
    .replace(/-+$/, "");
}
