import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useToday } from './useToday';

const at = (day: number, hour: number, minute: number, second = 0): Date =>
  new Date(2026, 9, day, hour, minute, second);

const goTo = (date: Date): void => {
  act(() => {
    vi.setSystemTime(date);
    document.dispatchEvent(new Event('visibilitychange'));
  });
};

describe('useToday', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts on the current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(15, 12, 0));

    const { result } = renderHook(() => useToday());

    expect(result.current.getDate()).toBe(15);
    expect(result.current.getMonth()).toBe(9);
  });

  it('moves on when the day rolls over while the tab is open', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(15, 23, 59, 30));

    const { result } = renderHook(() => useToday());
    act(() => {
      vi.advanceTimersByTime(32_000);
    });

    expect(result.current.getDate()).toBe(16);
  });

  it('re-checks when the tab becomes visible again', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(15, 12, 0));

    const { result } = renderHook(() => useToday());
    goTo(at(16, 9, 0));

    expect(result.current.getDate()).toBe(16);
  });

  it('leaves the date alone when the tab is refocused on the same day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(15, 12, 0));

    const { result } = renderHook(() => useToday());
    const before = result.current;
    goTo(at(15, 18, 0));

    expect(result.current).toBe(before);
  });
});
