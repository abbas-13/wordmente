/**
 * Ordinal formatting for error messages: 1st, 2nd, 3rd, 4th, 11th, 21st, 111th.
 *
 * Kept as the original implements it so the messages read identically.
 */
export function ordinal(value: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const tens = value % 100;
  const suffix = suffixes[(tens - 20) % 10] ?? suffixes[tens] ?? suffixes[0];
  return `${value}${suffix}`;
}
