import { describe, expect, it } from 'vitest';

import { formatRemaining, nextResetAt } from './schedule';

const at = (day: number, hour: number, minute: number, second = 0): Date =>
  new Date(2026, 9, day, hour, minute, second);

describe('when the next puzzle arrives', () => {
  it('is the coming midnight', () => {
    const reset = nextResetAt(at(15, 12, 30));

    expect(reset.getDate()).toBe(16);
    expect(reset.getHours()).toBe(0);
    expect(reset.getMinutes()).toBe(0);
    expect(reset.getSeconds()).toBe(0);
  });

  it('is tomorrow even from the first moment of the day', () => {
    expect(nextResetAt(at(15, 0, 0, 0)).getDate()).toBe(16);
  });

  it('rolls the month over', () => {
    const reset = nextResetAt(new Date(2026, 9, 31, 23, 59, 59));

    expect(reset.getMonth()).toBe(10);
    expect(reset.getDate()).toBe(1);
  });

  it('rolls the year over', () => {
    const reset = nextResetAt(new Date(2026, 11, 31, 8, 0));

    expect(reset.getFullYear()).toBe(2027);
    expect(reset.getMonth()).toBe(0);
    expect(reset.getDate()).toBe(1);
  });
});

describe('the time left on the clock', () => {
  it('counts hours and minutes', () => {
    expect(formatRemaining(7 * 3_600_000 + 12 * 60_000)).toBe('7h 12m');
  });

  it('leaves the hours off under an hour', () => {
    expect(formatRemaining(12 * 60_000 + 30_000)).toBe('12m');
  });

  it('says less than a minute rather than counting down to zero', () => {
    expect(formatRemaining(20_000)).toBe('less than a minute');
    expect(formatRemaining(0)).toBe('less than a minute');
  });

  it('copes with a moment that has already passed', () => {
    expect(formatRemaining(-5_000)).toBe('less than a minute');
  });
});
