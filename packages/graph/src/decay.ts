// ──────────────────────────────────────────────
// ECHO — Decay Score Calculator
// ──────────────────────────────────────────────

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DECAY_WINDOW_DAYS = 30;

/**
 * Calculate decay score based on how recently something was seen.
 * Score = 1.0 - (daysSinceLastSeen / DECAY_WINDOW_DAYS), clamped [0, 1]
 */
export function calculateDecayScore(lastSeen: string): number {
  const lastSeenTime = new Date(lastSeen).getTime();
  const now = Date.now();
  const daysSince = (now - lastSeenTime) / MS_PER_DAY;
  const score = 1.0 - daysSince / DECAY_WINDOW_DAYS;
  return Math.max(0, Math.min(1, score));
}

/**
 * Slugify a label for use as a node ID.
 * e.g., "Arun" → "arun", "PostgreSQL" → "postgresql"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
