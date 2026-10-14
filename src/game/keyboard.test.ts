import { describe, expect, it } from 'vitest';
import { isValidGuess } from './dictionary';
import { computeKeyboardState } from './keyboard';
import { ordinal } from './ordinal';

describe('computeKeyboardState', () => {
  it('maps letters to their evaluation', () => {
    expect(
      computeKeyboardState(['crane'], [['absent', 'present', 'correct', 'absent', 'absent']]),
    ).toEqual({ c: 'absent', r: 'present', a: 'correct', n: 'absent', e: 'absent' });
  });

  it('never downgrades a key: correct beats a later absent', () => {
    const state = computeKeyboardState(
      ['crane', 'trust'],
      [
        ['correct', 'present', 'absent', 'absent', 'absent'],
        ['absent', 'absent', 'absent', 'absent', 'absent'],
      ],
    );
    // 'r' was present in row 1 and absent in row 2 -> stays present
    // 'c' was correct in row 1 -> stays correct even though row 2 says nothing about it
    expect(state.c).toBe('correct');
    expect(state.r).toBe('present');
  });

  it('ignores rows without evaluations', () => {
    expect(computeKeyboardState(['crane'], [])).toEqual({});
  });
});

describe('ordinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [111, '111th'],
  ])('%i -> %s', (value, expected) => {
    expect(ordinal(value)).toBe(expected);
  });
});

describe('isValidGuess', () => {
  const dictionary = new Set(['crane', 'bleak', 'speed']);

  it('accepts a dictionary word', () => {
    expect(isValidGuess('crane', 'zzzzz', dictionary)).toBe(true);
  });

  it('accepts the solution even when it is not in the dictionary', () => {
    expect(isValidGuess('spelt', 'spelt', dictionary)).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isValidGuess('zzzzz', 'spelt', dictionary)).toBe(false);
    expect(isValidGuess('', 'spelt', dictionary)).toBe(false);
  });
});
