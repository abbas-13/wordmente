import type { Evaluation } from './types';

/**
 * Score a guess against the solution.
 *
 * Two passes, exactly as the original does:
 *
 *  1. Exact matches become `correct` and consume that solution letter.
 *  2. Remaining guess letters become `present` only against a solution letter
 *     that is still unconsumed, scanning the solution left to right.
 *
 * Pass 2 is what makes duplicate letters behave: a letter can only be marked
 * `present` as many times as it actually occurs in the solution. Guessing
 * `speed` against `abide` therefore yields a single `present` for `e`, even
 * though the guess contains two of them.
 */
export function scoreGuess(guess: string, solution: string): Evaluation[] {
  const evaluations: Evaluation[] = Array(solution.length).fill('absent');

  // Guess positions still looking for a home; solution letters still available.
  const unmatchedGuess = Array(solution.length).fill(true);
  const availableSolution = Array(solution.length).fill(true);

  for (let i = 0; i < guess.length; i += 1) {
    if (guess[i] === solution[i] && availableSolution[i]) {
      evaluations[i] = 'correct';
      unmatchedGuess[i] = false;
      availableSolution[i] = false;
    }
  }

  for (let i = 0; i < guess.length; i += 1) {
    if (!unmatchedGuess[i]) continue;
    const letter = guess[i];
    for (let j = 0; j < solution.length; j += 1) {
      if (availableSolution[j] && letter === solution[j]) {
        evaluations[i] = 'present';
        availableSolution[j] = false;
        break;
      }
    }
  }

  return evaluations;
}

/** True when every letter is in its final place. */
export function isWinningRow(evaluations: readonly Evaluation[]): boolean {
  return evaluations.length > 0 && evaluations.every((value) => value === 'correct');
}
