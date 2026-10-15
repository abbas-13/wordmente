import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from './state';
import { createGameState } from './state';
import {
  DAILY_KEY,
  HARD_MODE_KEY,
  loadHardMode,
  readDaily,
  saveDaily,
  saveHardMode,
  toDailySave,
} from './storage';
import type { Evaluation } from './types';

const TODAY = { puzzle: 1944, solution: 'crane' };

const ROW: Evaluation[] = ['absent', 'absent', 'correct', 'absent', 'correct'];

/** A daily board, empty unless the test fills it in. */
const board = (overrides: Partial<GameState> = {}): GameState => ({
  ...createGameState({
    solution: TODAY.solution,
    dictionary: new Set(['slate', 'crane']),
    mode: 'daily',
  }),
  ...overrides,
});

const silenceWarnings = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

const stored = (value: unknown): void => {
  window.localStorage.setItem(DAILY_KEY, JSON.stringify(value));
};

/** A storage that refuses every write, as a full or locked-down browser would. */
const refusingStorage = (): Storage =>
  ({
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  }) as unknown as Storage;

describe('the daily board in storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('round-trips a board in progress', () => {
    const state = board({ guesses: ['slate'], evaluations: [ROW] });

    saveDaily(window.localStorage, toDailySave(state, TODAY.puzzle));

    const restored = readDaily(window.localStorage, TODAY);
    expect(restored?.puzzle).toBe(TODAY.puzzle);
    expect(restored?.solution).toBe('crane');
    expect(restored?.guesses).toEqual(['slate']);
    expect(restored?.evaluations).toEqual([ROW]);
    expect(restored?.status).toBe('IN_PROGRESS');
  });

  it('writes nothing that is only true mid-reveal', () => {
    const state = board({ isRevealing: true, current: 'cr' });

    saveDaily(window.localStorage, toDailySave(state, TODAY.puzzle));

    expect(JSON.parse(window.localStorage.getItem(DAILY_KEY) ?? '{}')).toEqual({
      version: 1,
      puzzle: TODAY.puzzle,
      solution: 'crane',
      guesses: [],
      evaluations: [],
      status: 'IN_PROGRESS',
    });
  });

  it('round-trips a finished game', () => {
    const state = board({
      guesses: ['slate', 'crane'],
      evaluations: [ROW, ['correct', 'correct', 'correct', 'correct', 'correct']],
      status: 'WIN',
    });

    saveDaily(window.localStorage, toDailySave(state, TODAY.puzzle));

    expect(readDaily(window.localStorage, TODAY)?.status).toBe('WIN');
  });

  it('has nothing to read before the first guess', () => {
    expect(readDaily(window.localStorage, TODAY)).toBeUndefined();
  });

  it('ignores a board saved for another puzzle', () => {
    saveDaily(window.localStorage, toDailySave(board(), TODAY.puzzle - 1));

    expect(readDaily(window.localStorage, TODAY)).toBeUndefined();
  });

  it('discards a board whose solution no longer matches, and says so', () => {
    const warn = silenceWarnings();
    saveDaily(window.localStorage, toDailySave(board({ solution: 'other' }), TODAY.puzzle));

    expect(readDaily(window.localStorage, TODAY)).toBeUndefined();
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0]?.[0]).toContain(DAILY_KEY);
  });

  it('discards an unreadable entry, and says so', () => {
    const warn = silenceWarnings();
    window.localStorage.setItem(DAILY_KEY, 'not json at all');

    expect(readDaily(window.localStorage, TODAY)).toBeUndefined();
    expect(warn.mock.calls[0]?.[0]).toContain(DAILY_KEY);
  });

  it('discards an entry whose rows do not match the guesses, and says so', () => {
    const warn = silenceWarnings();
    stored({ ...toDailySave(board({ guesses: ['slate'] }), TODAY.puzzle), evaluations: [] });

    expect(readDaily(window.localStorage, TODAY)).toBeUndefined();
    expect(warn.mock.calls[0]?.[0]).toContain(DAILY_KEY);
  });

  it('discards an entry that is the wrong shape, and says so', () => {
    const warn = silenceWarnings();
    stored({
      version: 1,
      puzzle: TODAY.puzzle,
      solution: 'crane',
      guesses: ['slate'],
      evaluations: 'nope',
      status: 'IN_PROGRESS',
    });

    expect(readDaily(window.localStorage, TODAY)).toBeUndefined();
    expect(warn.mock.calls[0]?.[0]).toContain(DAILY_KEY);
  });

  it('discards an entry written by an earlier version, and says so', () => {
    const warn = silenceWarnings();
    stored({ ...toDailySave(board(), TODAY.puzzle), version: 0 });

    expect(readDaily(window.localStorage, TODAY)).toBeUndefined();
    expect(warn.mock.calls[0]?.[0]).toContain(DAILY_KEY);
  });

  it('does not throw when storage refuses a write, and says so', () => {
    const warn = silenceWarnings();

    expect(() => {
      saveDaily(refusingStorage(), toDailySave(board(), TODAY.puzzle));
    }).not.toThrow();
    expect(warn.mock.calls[0]?.[0]).toContain(DAILY_KEY);
  });

  it('treats missing storage as "nothing saved"', () => {
    expect(readDaily(undefined, TODAY)).toBeUndefined();
    expect(() => {
      saveDaily(undefined, toDailySave(board(), TODAY.puzzle));
    }).not.toThrow();
  });
});

describe('the hard mode preference in storage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is off when nothing was saved', () => {
    expect(loadHardMode(window.localStorage)).toBe(false);
  });

  it('round-trips both values', () => {
    saveHardMode(window.localStorage, true);
    expect(loadHardMode(window.localStorage)).toBe(true);

    saveHardMode(window.localStorage, false);
    expect(loadHardMode(window.localStorage)).toBe(false);
  });

  it('falls back to off when the entry is junk, and says so', () => {
    const warn = silenceWarnings();
    window.localStorage.setItem(HARD_MODE_KEY, 'yes please');

    expect(loadHardMode(window.localStorage)).toBe(false);
    expect(warn.mock.calls[0]?.[0]).toContain(HARD_MODE_KEY);
  });

  it('is off when storage is missing', () => {
    expect(loadHardMode(undefined)).toBe(false);
  });
});
