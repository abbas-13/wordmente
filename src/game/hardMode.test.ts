import { describe, expect, it } from 'vitest';

import { validateHardMode } from './hardMode';
import type { Evaluation } from './types';

const evaluations = (...values: Evaluation[]): Evaluation[] => values;

describe('validateHardMode', () => {
  it('accepts anything when there is no previous guess', () => {
    expect(validateHardMode('crane', undefined, undefined)).toEqual({ validGuess: true });
  });

  it('requires a revealed letter to be replayed in the same position', () => {
    // previous: crate with c correct, r absent, a present, t absent, e correct
    const previous = evaluations('correct', 'absent', 'present', 'absent', 'correct');
    const result = validateHardMode('beach', 'crate', previous);
    expect(result.validGuess).toBe(false);
    expect(result.errorMessage).toBe('1st letter must be C');
  });

  it('requires revealed letters to be reused', () => {
    // 'clove' satisfies both revealed positions (c...e) but never contains the
    // 'a' that the previous row revealed, so the letter-count rule fires.
    const previous = evaluations('correct', 'absent', 'present', 'absent', 'correct');
    const result = validateHardMode('clove', 'crate', previous);
    expect(result.validGuess).toBe(false);
    expect(result.errorMessage).toBe('Guess must contain A');
  });

  it('accepts a guess that satisfies both rules', () => {
    const previous = evaluations('correct', 'absent', 'present', 'absent', 'correct');
    expect(validateHardMode('cease', 'crate', previous)).toEqual({ validGuess: true });
  });

  it('counts repeated revealed letters', () => {
    // previous: alele with l present twice and e correct twice
    const previous = evaluations('present', 'present', 'correct', 'present', 'correct');
    const result = validateHardMode('eagle', 'alele', previous);
    expect(result.validGuess).toBe(false);
  });
});
