import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DailyResult } from './stats';
import {
  createStats,
  loadStats,
  recordDailyResult,
  recordResult,
  saveStats,
  winPercent,
} from './stats';
import { STATS_KEY } from './storage';

const won = (puzzle: number, guesses = 3): DailyResult => ({ puzzle, status: 'WIN', guesses });
const lost = (puzzle: number): DailyResult => ({ puzzle, status: 'FAIL', guesses: 6 });

describe('recording daily results', () => {
  it('starts empty', () => {
    expect(createStats()).toEqual({
      version: 1,
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0],
    });
  });

  it('counts a win, the guesses it took, and the streak', () => {
    const stats = recordResult(createStats(), won(1944, 3));

    expect(stats.played).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
    expect(stats.distribution).toEqual([0, 0, 1, 0, 0, 0]);
  });

  it('records a win in six guesses in the last bucket', () => {
    expect(recordResult(createStats(), won(1944, 6)).distribution).toEqual([0, 0, 0, 0, 0, 1]);
  });

  it('counts a loss as played without a win', () => {
    const stats = recordResult(createStats(), lost(1944));

    expect(stats.played).toBe(1);
    expect(stats.wins).toBe(0);
    expect(stats.distribution).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('extends the streak on consecutive days', () => {
    const stats = [won(1944), won(1945), won(1946)].reduce(recordResult, createStats());

    expect(stats.currentStreak).toBe(3);
    expect(stats.maxStreak).toBe(3);
  });

  it('ends the streak on a loss', () => {
    const stats = [won(1944), won(1945), lost(1946)].reduce(recordResult, createStats());

    expect(stats.currentStreak).toBe(0);
    expect(stats.maxStreak).toBe(2);
  });

  it('ends the streak when a day is missed', () => {
    const stats = [won(1944), won(1946)].reduce(recordResult, createStats());

    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
  });

  it('remembers the best streak after a later one is broken', () => {
    const results = [won(1944), won(1945), won(1946), lost(1947), won(1948), won(1949)];
    const stats = results.reduce(recordResult, createStats());

    expect(stats.currentStreak).toBe(2);
    expect(stats.maxStreak).toBe(3);
  });

  it('ignores a puzzle it has already counted', () => {
    const stats = [won(1944, 3), won(1944, 3)].reduce(recordResult, createStats());

    expect(stats.played).toBe(1);
    expect(stats.currentStreak).toBe(1);
    expect(stats.distribution).toEqual([0, 0, 1, 0, 0, 0]);
  });

  it('ignores a replay of the most recent puzzle even after a gap', () => {
    const stats = [won(1944), won(1946), lost(1946)].reduce(recordResult, createStats());

    expect(stats.played).toBe(2);
    expect(stats.currentStreak).toBe(1);
  });
});

describe('win percentage', () => {
  it('is zero before anything is played', () => {
    expect(winPercent(createStats())).toBe(0);
  });

  it('rounds to a whole number', () => {
    const stats: ReturnType<typeof createStats> = { ...createStats(), played: 3, wins: 1 };

    expect(winPercent(stats)).toBe(33);
  });

  it('is a hundred when every game was won', () => {
    const stats = recordResult(createStats(), won(1944));

    expect(winPercent(stats)).toBe(100);
  });
});

describe('stats in storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('has nothing recorded to begin with', () => {
    expect(loadStats(window.localStorage)).toEqual(createStats());
  });

  it('round-trips', () => {
    const stats = recordResult(createStats(), won(1944, 4));

    saveStats(window.localStorage, stats);

    expect(loadStats(window.localStorage)).toEqual(stats);
  });

  it('records a daily once however often it is reported', () => {
    const report: DailyResult = { puzzle: 1944, status: 'WIN', guesses: 3 };

    recordDailyResult(window.localStorage, report);
    recordDailyResult(window.localStorage, report);

    expect(loadStats(window.localStorage).played).toBe(1);
  });

  it('starts over when the entry is junk, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.localStorage.setItem(STATS_KEY, 'not json');

    expect(loadStats(window.localStorage)).toEqual(createStats());
    expect(warn.mock.calls[0]?.[0]).toContain(STATS_KEY);
  });

  it('starts over when the entry is the wrong shape, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.localStorage.setItem(
      STATS_KEY,
      JSON.stringify({ ...createStats(), distribution: [0, 0] }),
    );

    expect(loadStats(window.localStorage)).toEqual(createStats());
    expect(warn.mock.calls[0]?.[0]).toContain(STATS_KEY);
  });

  it('starts over when the entry was written by an earlier version, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.localStorage.setItem(STATS_KEY, JSON.stringify({ ...createStats(), version: 0 }));

    expect(loadStats(window.localStorage)).toEqual(createStats());
    expect(warn.mock.calls[0]?.[0]).toContain(STATS_KEY);
  });

  it('treats missing storage as nothing recorded', () => {
    expect(loadStats(undefined)).toEqual(createStats());
    expect(() => {
      saveStats(undefined, createStats());
    }).not.toThrow();
  });
});
