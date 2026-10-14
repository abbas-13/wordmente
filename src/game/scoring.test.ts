import { describe, expect, it } from 'vitest';

import { isWinningRow, scoreGuess } from './scoring';

describe('scoreGuess', () => {
  it('marks an exact match as all correct', () => {
    expect(scoreGuess('crane', 'crane')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('marks misplaced letters present and missing letters absent', () => {
    // crane vs bleak: c absent, r absent, a present, n absent, e present
    expect(scoreGuess('crane', 'bleak')).toEqual([
      'absent',
      'absent',
      'present',
      'absent',
      'present',
    ]);
  });

  it('gives exact matches priority over misplaced ones', () => {
    // level vs lever: l,e,v,e correct; final l absent
    expect(scoreGuess('level', 'lever')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'absent',
    ]);
  });

  it('only awards present as many times as the solution contains the letter', () => {
    // speed vs abide: two e's in the guess, one in the solution -> one present
    expect(scoreGuess('speed', 'abide')).toEqual([
      'absent',
      'absent',
      'present',
      'absent',
      'present',
    ]);
  });

  it('spends each solution letter only once when the guess repeats a letter', () => {
    // array vs radar: the second 'a' lands exactly (position 4), so the first
    // 'a' has to pair with radar's other 'a' -> three presents, one correct.
    expect(scoreGuess('array', 'radar')).toEqual([
      'present',
      'present',
      'present',
      'correct',
      'absent',
    ]);
  });
});

describe('isWinningRow', () => {
  it('is true only when every letter is correct', () => {
    expect(isWinningRow(['correct', 'correct'])).toBe(true);
    expect(isWinningRow(['correct', 'present'])).toBe(false);
    expect(isWinningRow([])).toBe(false);
  });
});
