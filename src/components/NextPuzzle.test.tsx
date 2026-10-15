import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import NextPuzzle from './NextPuzzle';

const NOON = new Date(2026, 9, 15, 12, 0, 0);
const MIDNIGHT = new Date(2026, 9, 16, 0, 0, 0);

const renderAt = (resetAt: Date = MIDNIGHT) => {
  vi.useFakeTimers();
  vi.setSystemTime(NOON);
  render(<NextPuzzle resetAt={resetAt} />);
};

describe('NextPuzzle', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('says how long is left', () => {
    renderAt();

    expect(screen.getByText(/next puzzle in/i)).toHaveTextContent('12h 0m');
  });

  it('counts down as the clock moves', () => {
    renderAt();

    act(() => {
      vi.advanceTimersByTime(60 * 60_000);
    });

    expect(screen.getByText(/next puzzle in/i)).toHaveTextContent('11h 0m');
  });

  it('has nothing to say about a reset that has already passed', () => {
    renderAt(new Date(2026, 9, 15, 11, 0, 0));

    expect(screen.getByText(/next puzzle in/i)).toHaveTextContent('less than a minute');
  });
});
