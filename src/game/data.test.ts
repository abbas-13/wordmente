import { describe, expect, it } from 'vitest';

import allowedGuesses from '../data/allowed-guesses.json';
import answers from '../data/answers.json';
import { WORD_LENGTH } from './constants';
import { dailyAnswer } from './puzzle';

const allowedSet = new Set(allowedGuesses);

describe('bundled word data', () => {
  it('has a substantial validation dictionary', () => {
    expect(allowedGuesses.length).toBeGreaterThan(10_000);
  });

  it('contains only five-letter lowercase words', () => {
    const bad = allowedGuesses.filter(
      (word) => word.length !== WORD_LENGTH || !/^[a-z]+$/.test(word),
    );
    expect(bad).toEqual([]);
  });

  it('has no duplicates', () => {
    expect(allowedSet.size).toBe(allowedGuesses.length);
  });

  it('curates a usable answer pool', () => {
    expect(answers.length).toBeGreaterThan(500);
  });

  it('draws every answer from the validation dictionary', () => {
    // Answers must be accepted as guesses too, otherwise a player could be told
    // their own solution is "not in word list".
    const missing = answers.filter((word) => !allowedSet.has(word));
    expect(missing).toEqual([]);
  });

  it('produces an answer for today', () => {
    const today = dailyAnswer(answers, new Date());
    expect(answers).toContain(today);
  });
});
