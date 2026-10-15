import { MAX_GUESSES } from './constants';
import { readEntry, STATS_KEY, STATS_VERSION, writeEntry } from './storage';
import type { GameStatus } from './types';

/** A finished daily. An unfinished game has nothing to record. */
export type FinishedStatus = Exclude<GameStatus, 'IN_PROGRESS'>;

export interface DailyResult {
  puzzle: number;
  status: FinishedStatus;
  /** How many guesses it took, which is the distribution bucket. */
  guesses: number;
}

export interface Stats {
  version: number;
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  /** Wins by the guesses they took: index 0 is a win in one guess. */
  distribution: number[];
  /** The most recent daily counted, so replaying one cannot count it twice. */
  lastPuzzle?: number;
}

export const createStats = (): Stats => ({
  version: STATS_VERSION,
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: Array.from({ length: MAX_GUESSES }, () => 0),
});

export const winPercent = (stats: Stats): number =>
  stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);

const withWin = (distribution: number[], guesses: number): number[] => {
  const bucket = guesses - 1;
  if (bucket < 0 || bucket >= distribution.length) {
    return distribution;
  }
  return distribution.map((count, index) => (index === bucket ? count + 1 : count));
};

/**
 * Count a finished daily.
 *
 * A daily is counted once, so re-reporting one — which is what a reload of a
 * finished board does — leaves the statistics as they are. A streak continues
 * only from the day before: skipping a day ends it, which is what a streak is
 * meant to say.
 */
export const recordResult = (stats: Stats, result: DailyResult): Stats => {
  if (stats.lastPuzzle === result.puzzle) {
    return stats;
  }

  const won = result.status === 'WIN';
  const continues = stats.lastPuzzle === result.puzzle - 1;
  const currentStreak = won ? (continues ? stats.currentStreak + 1 : 1) : 0;

  return {
    ...stats,
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution: won ? withWin(stats.distribution, result.guesses) : stats.distribution,
    lastPuzzle: result.puzzle,
  };
};

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/**
 * A saved tally is only trusted once every field has been checked, including the
 * relationships between them: more wins than games played is not a tally.
 */
const isStats = (value: unknown): value is Stats => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const stats = value as Partial<Stats>;

  return (
    stats.version === STATS_VERSION &&
    isCount(stats.played) &&
    isCount(stats.wins) &&
    isCount(stats.currentStreak) &&
    isCount(stats.maxStreak) &&
    stats.wins <= stats.played &&
    stats.currentStreak <= stats.maxStreak &&
    Array.isArray(stats.distribution) &&
    stats.distribution.length === MAX_GUESSES &&
    stats.distribution.every(isCount) &&
    (stats.lastPuzzle === undefined || isCount(stats.lastPuzzle))
  );
};

export const loadStats = (storage: Storage | undefined): Stats => {
  const raw = readEntry(storage, STATS_KEY);
  if (raw === undefined) {
    return createStats();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn(`${STATS_KEY} is not readable, so the statistics start over`, error);
    return createStats();
  }

  if (!isStats(parsed)) {
    console.warn(
      `${STATS_KEY} did not match the shape this version expects, so the statistics start over`,
      parsed,
    );
    return createStats();
  }

  return parsed;
};

export const saveStats = (storage: Storage | undefined, stats: Stats): void => {
  writeEntry(storage, STATS_KEY, JSON.stringify(stats));
};

/** Read the tally, count a result if it is new, and return what is now recorded. */
export const recordDailyResult = (storage: Storage | undefined, result: DailyResult): Stats => {
  const stats = loadStats(storage);
  const recorded = recordResult(stats, result);
  if (recorded !== stats) {
    saveStats(storage, recorded);
  }
  return recorded;
};
