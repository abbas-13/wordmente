import { MAX_GUESSES, WORD_LENGTH } from './constants';
import { isValidGuess } from './dictionary';
import { validateHardMode } from './hardMode';
import { isWinningRow, scoreGuess } from './scoring';
import type { Evaluation, GameMode, GameStatus } from './types';

/**
 * Game state for a single puzzle.
 *
 * The reducer owns every rule the game enforces: what can be typed, when a guess
 * is rejected and why, how rows are scored, and when the game is won or lost.
 * Keeping it free of React makes the rules testable on their own.
 */
export interface GameState {
  /** The word being guessed. */
  solution: string;
  /** Whether this board is today's daily puzzle or a practice round. */
  mode: GameMode;
  /** Words accepted as guesses, beyond the solution itself. */
  dictionary: ReadonlySet<string>;
  /** Submitted guesses, oldest first. */
  guesses: string[];
  /** Evaluations, one row per submitted guess, aligned with `guesses`. */
  evaluations: Evaluation[][];
  /** Letters typed for the row in progress. */
  current: string;
  status: GameStatus;
  hardMode: boolean;
  /** True from an accepted guess until its reveal animation has finished. */
  isRevealing: boolean;
  /** The most recent rejection reason, cleared by the next accepted input. */
  message?: string;
}

/** The part of a board that survives a reload, and can be handed between boards. */
export type GameBoard = Pick<GameState, 'solution' | 'guesses' | 'evaluations' | 'status'>;

export type GameAction =
  | { type: 'ADD_LETTER'; letter: string }
  | { type: 'DELETE_LETTER' }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'REVEAL_COMPLETE' }
  | { type: 'START_GAME'; mode: GameMode; solution: string }
  | { type: 'SET_HARD_MODE'; hardMode: boolean }
  | { type: 'RESTORE_GAME'; board: GameBoard };

export interface GameSetup {
  solution: string;
  dictionary: ReadonlySet<string>;
  hardMode?: boolean;
  mode?: GameMode;
}

const SINGLE_LETTER = /^[a-z]$/i;

export const createGameState = ({
  solution,
  dictionary,
  hardMode = false,
  mode = 'daily',
}: GameSetup): GameState => ({
  solution,
  mode,
  dictionary,
  guesses: [],
  evaluations: [],
  current: '',
  status: 'IN_PROGRESS',
  hardMode,
  isRevealing: false,
});

/** Row the player is filling, equal to the number of submitted guesses. */
export const currentRowIndex = (state: GameState): number => state.guesses.length;

/** Input is only accepted mid-game and when no reveal is running. */
const acceptsInput = (state: GameState): boolean =>
  state.status === 'IN_PROGRESS' && !state.isRevealing;

/** Returns the same state when the message is unchanged, so callers can rely on identity. */
const withMessage = (state: GameState, message: string): GameState =>
  state.message === message ? state : { ...state, message };

const addLetter = (state: GameState, letter: string): GameState => {
  if (!SINGLE_LETTER.test(letter)) {
    return state;
  }
  if (state.current.length >= WORD_LENGTH) {
    return state;
  }
  return { ...state, current: state.current + letter.toLowerCase(), message: undefined };
};

const deleteLetter = (state: GameState): GameState => {
  if (state.current.length === 0) {
    return state;
  }
  return { ...state, current: state.current.slice(0, -1), message: undefined };
};

/**
 * Submit the row in progress.
 *
 * Checks run in the order the game applies them: length, then the dictionary,
 * then hard mode when it is on. A rejected guess leaves the row on screen so the
 * player can correct it.
 */
const submitGuess = (state: GameState): GameState => {
  if (state.current.length !== WORD_LENGTH) {
    return withMessage(state, 'Not enough letters');
  }
  if (!isValidGuess(state.current, state.solution, state.dictionary)) {
    return withMessage(state, 'Not in word list');
  }

  const previousGuess = state.guesses.at(-1);
  const previousEvaluations = state.evaluations.at(-1);
  if (state.hardMode && previousGuess && previousEvaluations) {
    const verdict = validateHardMode(state.current, previousGuess, previousEvaluations);
    if (!verdict.validGuess) {
      return withMessage(state, verdict.errorMessage ?? 'Not valid in hard mode');
    }
  }

  const row = scoreGuess(state.current, state.solution);
  const guesses = [...state.guesses, state.current];
  const evaluations = [...state.evaluations, row];
  const status: GameStatus = isWinningRow(row)
    ? 'WIN'
    : guesses.length >= MAX_GUESSES
      ? 'FAIL'
      : 'IN_PROGRESS';

  return {
    ...state,
    guesses,
    evaluations,
    current: '',
    status,
    isRevealing: true,
    message: undefined,
  };
};

/** Compares only the fields a saved board carries, which is what a restore brings in. */
const sameBoard = (state: GameState, board: GameBoard): boolean =>
  JSON.stringify([state.solution, state.guesses, state.evaluations, state.status]) ===
  JSON.stringify([board.solution, board.guesses, board.evaluations, board.status]);

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'ADD_LETTER': {
      return acceptsInput(state) ? addLetter(state, action.letter) : state;
    }
    case 'DELETE_LETTER': {
      return acceptsInput(state) ? deleteLetter(state) : state;
    }
    case 'SUBMIT_GUESS': {
      return acceptsInput(state) ? submitGuess(state) : state;
    }
    case 'REVEAL_COMPLETE': {
      return state.isRevealing ? { ...state, isRevealing: false } : state;
    }
    case 'START_GAME': {
      return createGameState({ ...state, mode: action.mode, solution: action.solution });
    }
    case 'SET_HARD_MODE': {
      // An explicit value, not a flip: the whole app shares one preference, and
      // setting both boards to the same value keeps them from drifting apart.
      return state.hardMode === action.hardMode ? state : { ...state, hardMode: action.hardMode };
    }
    case 'RESTORE_GAME': {
      // A board already on screen is a no-op, and not merely an optimisation: two
      // tabs would otherwise write at each other for as long as they stayed open.
      if (sameBoard(state, action.board)) {
        return state;
      }
      return {
        ...state,
        ...action.board,
        current: '',
        isRevealing: false,
        message: undefined,
      };
    }
    default: {
      throw new Error(`unhandled game action: ${JSON.stringify(action)}`);
    }
  }
};
