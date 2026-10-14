import { describe, expect, it } from 'vitest';

import {
  dailyAnswer,
  dateForPuzzleIndex,
  GAME_EPOCH,
  puzzleIndexForDate,
  puzzleNumberForDate,
  randomAnswer,
} from './puzzle';

const answers = ['cigar', 'rebut', 'sissy', 'humph', 'awake', 'blush', 'focal', 'evade'];

describe('puzzle calendar', () => {
  it('numbers day one as 0', () => {
    expect(puzzleIndexForDate(GAME_EPOCH)).toBe(0);
  });

  it('advances one index per calendar day', () => {
    const next = new Date(GAME_EPOCH);
    next.setDate(next.getDate() + 1);
    expect(puzzleIndexForDate(next)).toBe(1);
  });

  it('is unaffected by the time of day', () => {
    const morning = new Date(2021, 5, 20, 0, 30);
    const evening = new Date(2021, 5, 20, 23, 30);
    expect(puzzleIndexForDate(morning)).toBe(puzzleIndexForDate(evening));
  });

  it('round-trips index and date', () => {
    expect(puzzleIndexForDate(dateForPuzzleIndex(42))).toBe(42);
  });

  it('counts puzzles from one for display', () => {
    expect(puzzleNumberForDate(GAME_EPOCH)).toBe(1);
    const second = new Date(GAME_EPOCH);
    second.setDate(second.getDate() + 1);
    expect(puzzleNumberForDate(second)).toBe(2);
  });
});

describe('dailyAnswer', () => {
  it('is deterministic for a given date', () => {
    const date = new Date(2026, 0, 1);
    expect(dailyAnswer(answers, date)).toBe(dailyAnswer(answers, date));
  });

  it('walks the list as days advance', () => {
    const first = dailyAnswer(answers, GAME_EPOCH);
    const second = dailyAnswer(answers, new Date(2021, 5, 20));
    expect(first).toBe(answers[0]);
    expect(second).toBe(answers[1]);
  });

  it('wraps around the list', () => {
    const wrapped = new Date(GAME_EPOCH);
    wrapped.setDate(wrapped.getDate() + answers.length);
    expect(dailyAnswer(answers, wrapped)).toBe(answers[0]);
  });

  it('handles dates before the epoch', () => {
    const before = new Date(2021, 5, 18);
    expect(answers).toContain(dailyAnswer(answers, before));
  });

  it('throws on an empty answer list', () => {
    expect(() => dailyAnswer([], GAME_EPOCH)).toThrow(/empty/);
  });
});

describe('randomAnswer', () => {
  it('picks from the list using the injected randomness', () => {
    expect(randomAnswer(answers, () => 0)).toBe(answers[0]);
    expect(randomAnswer(answers, () => 0.999)).toBe(answers[answers.length - 1]);
  });
});
