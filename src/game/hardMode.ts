import { ordinal } from './ordinal';
import type { Evaluation } from './types';

export interface HardModeResult {
  validGuess: boolean;
  errorMessage?: string;
}

/** Evaluations that constrain later guesses. */
const CONSTRAINING: readonly Evaluation[] = ['correct', 'present'];

/**
 * Hard mode: a guess must respect what the previous guess revealed.
 *
 * Two rules, both taken from the original:
 *
 *  1. A letter revealed in the right place must be played again in that place.
 *  2. A letter revealed as `correct` or `present` must appear in the guess at
 *     least as many times as it was revealed.
 *
 * Only the immediately previous row is consulted, matching the original.
 */
export function validateHardMode(
  guess: string,
  previousGuess: string | undefined,
  previousEvaluations: readonly Evaluation[] | undefined,
): HardModeResult {
  if (!guess || !previousGuess || !previousEvaluations) return { validGuess: true };

  for (let i = 0; i < previousEvaluations.length; i += 1) {
    if (previousEvaluations[i] === 'correct' && guess[i] !== previousGuess[i]) {
      return {
        validGuess: false,
        errorMessage: `${ordinal(i + 1)} letter must be ${previousGuess[i]?.toUpperCase() ?? ''}`,
      };
    }
  }

  const required: Record<string, number> = {};
  for (let i = 0; i < previousEvaluations.length; i += 1) {
    const evaluation = previousEvaluations[i];
    if (!evaluation || !CONSTRAINING.includes(evaluation)) continue;
    const letter = previousGuess[i];
    if (!letter) continue;
    required[letter] = (required[letter] ?? 0) + 1;
  }

  const supplied: Record<string, number> = {};
  for (const letter of guess) {
    supplied[letter] = (supplied[letter] ?? 0) + 1;
  }

  for (const letter of Object.keys(required)) {
    if ((supplied[letter] ?? 0) < (required[letter] ?? 0)) {
      return {
        validGuess: false,
        errorMessage: `Guess must contain ${letter.toUpperCase()}`,
      };
    }
  }

  return { validGuess: true };
}
