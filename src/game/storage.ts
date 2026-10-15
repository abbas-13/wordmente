import { MAX_GUESSES, WORD_LENGTH } from './constants';
import type { GameState } from './state';
import type { Evaluation, GameStatus } from './types';

/** Where this app keeps the daily board and the player's hard mode preference. */
export const DAILY_KEY = 'wordmente-daily';
export const HARD_MODE_KEY = 'wordmente-hard-mode';

/** Bumped whenever the saved shape changes, so an old entry is ignored rather than misread. */
export const STORAGE_VERSION = 1;

const GAME_STATUSES: readonly string[] = ['IN_PROGRESS', 'WIN', 'FAIL'];
const EVALUATIONS: readonly string[] = ['correct', 'present', 'absent'];

export interface DailySave {
  version: number;
  puzzle: number;
  solution: string;
  guesses: string[];
  evaluations: Evaluation[][];
  status: GameStatus;
}

/** The board fields that outlive a reload. Anything mid-reveal is deliberately left out. */
export type PersistedBoard = Pick<GameState, 'solution' | 'guesses' | 'evaluations' | 'status'>;

/** What the daily board has to match for a saved game to be today's. */
export interface ExpectedDaily {
  puzzle: number;
  solution: string;
}

/**
 * Resolve the browser's storage once.
 *
 * Reaching for `localStorage` can throw outright where storage is blocked, so
 * callers get `undefined` and the game plays on without saving.
 */
export const getStorage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Browser storage is unavailable, so this game will not be saved', error);
    return undefined;
  }
};

export const toDailySave = (board: PersistedBoard, puzzle: number): DailySave => ({
  version: STORAGE_VERSION,
  puzzle,
  solution: board.solution,
  guesses: board.guesses,
  evaluations: board.evaluations,
  status: board.status,
});

const write = (storage: Storage | undefined, key: string, value: string): void => {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(key, value);
  } catch (error) {
    console.warn(`${key} could not be saved, so this game will not survive a reload`, error);
  }
};

const read = (storage: Storage | undefined, key: string): string | undefined => {
  if (!storage) {
    return undefined;
  }
  try {
    return storage.getItem(key) ?? undefined;
  } catch (error) {
    console.warn(`${key} could not be read, so the game starts fresh`, error);
    return undefined;
  }
};

export const saveDaily = (storage: Storage | undefined, save: DailySave): void => {
  write(storage, DAILY_KEY, JSON.stringify(save));
};

export const saveHardMode = (storage: Storage | undefined, hardMode: boolean): void => {
  write(storage, HARD_MODE_KEY, String(hardMode));
};

const isEvaluation = (value: unknown): value is Evaluation =>
  typeof value === 'string' && EVALUATIONS.includes(value);

const isRow = (value: unknown): value is Evaluation[] =>
  Array.isArray(value) && value.length === WORD_LENGTH && value.every(isEvaluation);

/**
 * A saved board is only trusted once every field has been checked.
 *
 * Storage is editable by hand and can survive a version change, so a cast here
 * would let a malformed board reach the reducer as if it were real.
 */
const isDailySave = (value: unknown): value is DailySave => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const save = value as Partial<DailySave>;

  return (
    save.version === STORAGE_VERSION &&
    Number.isInteger(save.puzzle) &&
    typeof save.solution === 'string' &&
    save.solution.length === WORD_LENGTH &&
    Array.isArray(save.guesses) &&
    save.guesses.length <= MAX_GUESSES &&
    save.guesses.every((guess) => typeof guess === 'string' && guess.length === WORD_LENGTH) &&
    Array.isArray(save.evaluations) &&
    save.evaluations.length === save.guesses.length &&
    save.evaluations.every(isRow) &&
    typeof save.status === 'string' &&
    GAME_STATUSES.includes(save.status)
  );
};

/**
 * The daily board to restore, or nothing when there is no usable saved game.
 *
 * A board saved for an earlier puzzle is simply yesterday's game and is dropped
 * quietly. A board that claims this puzzle but a different word means the word
 * lists changed under it, which is worth saying out loud.
 */
export const readDaily = (
  storage: Storage | undefined,
  today: ExpectedDaily,
): DailySave | undefined => {
  const raw = read(storage, DAILY_KEY);
  if (raw === undefined) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn(`${DAILY_KEY} is not readable, so the board starts fresh`, error);
    return undefined;
  }

  if (!isDailySave(parsed)) {
    console.warn(
      `${DAILY_KEY} did not match the shape this version expects, so the board starts fresh`,
      parsed,
    );
    return undefined;
  }

  if (parsed.puzzle !== today.puzzle) {
    return undefined;
  }

  if (parsed.solution !== today.solution) {
    console.warn(
      `${DAILY_KEY} solved a different word for puzzle ${today.puzzle}, so the board starts fresh`,
      parsed.solution,
    );
    return undefined;
  }

  return parsed;
};

export const loadHardMode = (storage: Storage | undefined): boolean => {
  const raw = read(storage, HARD_MODE_KEY);
  if (raw === undefined) {
    return false;
  }
  if (raw !== 'true' && raw !== 'false') {
    console.warn(`${HARD_MODE_KEY} held an unexpected value, so hard mode starts off`, raw);
    return false;
  }
  return raw === 'true';
};
