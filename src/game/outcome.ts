import { MAX_GUESSES } from './constants';
import type { GameStatus } from './types';

export interface Outcome {
  title: string;
  detail: string;
}

interface OutcomeInput {
  status: GameStatus;
  guesses: readonly string[];
  solution: string;
}

/**
 * The end-of-game message, or nothing while the game is still running.
 *
 * A loss always names the solution: the player should never finish a game
 * without learning the word.
 */
export const describeOutcome = ({
  status,
  guesses,
  solution,
}: OutcomeInput): Outcome | undefined => {
  if (status === 'WIN') {
    return { title: 'Solved', detail: `In ${guesses.length} of ${MAX_GUESSES}` };
  }
  if (status === 'FAIL') {
    return { title: 'Out of guesses', detail: `The word was ${solution.toUpperCase()}` };
  }
  return undefined;
};
