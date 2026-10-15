/**
 * When the daily puzzle turns over.
 *
 * The puzzle is worked out from the player's own calendar date, so it changes at
 * their local midnight rather than at one fixed instant worldwide. That is what
 * keeps the puzzle number in step with the date on their wall, and it is what the
 * countdown counts to: a player in any country sees the time left on *their* day.
 */
export const nextResetAt = (from: Date): Date =>
  new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1, 0, 0, 0);

const MINUTE = 60_000;
const HOURS = 60;

/**
 * The time left, kept short enough to sit under a game result.
 *
 * `Intl.RelativeTimeFormat` would say "in 7 hours" and cannot express the "7h 12m"
 * shape this needs, so the arithmetic is done here instead.
 */
export const formatRemaining = (milliseconds: number): string => {
  if (milliseconds < MINUTE) {
    return 'less than a minute';
  }

  const minutes = Math.floor(milliseconds / MINUTE);
  const hours = Math.floor(minutes / HOURS);
  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes % HOURS}m`;
};
