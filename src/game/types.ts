/** Shared domain types for the game. */

/** Colour state of a single submitted letter. */
export type Evaluation = 'correct' | 'present' | 'absent';

/** State the board can be in. */
export type GameStatus = 'IN_PROGRESS' | 'WIN' | 'FAIL';

/**
 * Colour state of an on-screen keyboard key.
 *
 * `unknown` means the letter has not been tried yet.
 */
export type KeyboardState = 'unknown' | 'absent' | 'present' | 'correct';

/** A full guess row: the submitted letters and their evaluations. */
export interface GuessRow {
  letters: string[];
  evaluations: Evaluation[];
}
