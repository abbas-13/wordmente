import { describe, expect, it } from 'vitest';

import { describeOutcome } from './outcome';

describe('describeOutcome', () => {
  it('says nothing while the game is in progress', () => {
    expect(
      describeOutcome({ status: 'IN_PROGRESS', guesses: ['slate'], solution: 'crane' }),
    ).toBeUndefined();
  });

  it('reports a win with the number of guesses used', () => {
    expect(
      describeOutcome({ status: 'WIN', guesses: ['slate', 'crane'], solution: 'crane' }),
    ).toEqual({ title: 'Solved', detail: 'In 2 of 6' });
  });

  it('reports a win on the first guess', () => {
    expect(describeOutcome({ status: 'WIN', guesses: ['crane'], solution: 'crane' })).toEqual({
      title: 'Solved',
      detail: 'In 1 of 6',
    });
  });

  it('reveals the solution once the guesses run out', () => {
    expect(
      describeOutcome({
        status: 'FAIL',
        guesses: ['slate', 'abide', 'crate', 'bleak', 'elder', 'fable'],
        solution: 'crane',
      }),
    ).toEqual({ title: 'Out of guesses', detail: 'The word was CRANE' });
  });
});
