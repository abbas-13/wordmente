import type { Evaluation, KeyboardState } from './types';

/**
 * Ranking used when folding rows into keyboard state. A later row may upgrade a
 * key but never downgrade it: `correct` beats `present` beats `absent`, and
 * `unknown` loses to everything.
 */
export const KEYBOARD_RANK: Record<KeyboardState, number> = {
  unknown: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

/**
 * Fold every submitted row into one state per letter.
 *
 * @param guesses     submitted words, in order
 * @param evaluations matching per-row evaluations
 */
export function computeKeyboardState(
  guesses: readonly string[],
  evaluations: readonly (readonly Evaluation[])[],
): Record<string, KeyboardState> {
  const state: Record<string, KeyboardState> = {};

  guesses.forEach((guess, rowIndex) => {
    const row = evaluations[rowIndex];
    if (!row) return;
    for (let i = 0; i < guess.length; i += 1) {
      const letter = guess[i];
      const evaluation = row[i];
      if (!evaluation) continue;
      const current = state[letter] ?? 'unknown';
      if (KEYBOARD_RANK[evaluation] > KEYBOARD_RANK[current]) {
        state[letter] = evaluation;
      }
    }
  });

  return state;
}
