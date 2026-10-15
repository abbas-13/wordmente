import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';
import answers from './data/answers.json';
import { dailyAnswer, puzzleNumberForDate } from './game/puzzle';
import { scoreGuess } from './game/scoring';
import type { GameState } from './game/state';
import { createGameState, gameReducer } from './game/state';
import type { DailySave } from './game/storage';
import { DAILY_KEY, STATS_KEY, saveDaily } from './game/storage';
import type { Evaluation } from './game/types';
import { lettersAt } from './test/board';

const today = new Date();
const solution = dailyAnswer(answers, today);
const puzzle = puzzleNumberForDate(today);

/** A board with one guess on it, as the other tab would have written it. */
const boardFromAnotherTab = (guess: string): DailySave => ({
  version: 1,
  puzzle,
  solution,
  guesses: [guess],
  evaluations: [scoreGuess(guess, solution)],
  status: 'IN_PROGRESS',
});

/** What the browser does in the *other* tabs when storage changes in one of them. */
const announce = (key: string): void => {
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key }));
  });
};

describe('a board written by another tab', () => {
  it('is taken on rather than overwritten', () => {
    render(<App />);
    saveDaily(window.localStorage, boardFromAnotherTab('slate'));

    announce(DAILY_KEY);

    expect(lettersAt(0)).toEqual(['s', 'l', 'a', 't', 'e']);
  });

  it('is left alone when the change was to something else', () => {
    render(<App />);
    window.localStorage.setItem(STATS_KEY, '{}');

    announce(STATS_KEY);

    expect(lettersAt(0)).toEqual(['', '', '', '', '']);
  });
});

describe('the rule for adopting a board', () => {
  const ROW: Evaluation[] = ['absent', 'absent', 'correct', 'absent', 'correct'];

  const started: GameState = {
    ...createGameState({ solution: 'crane', dictionary: new Set(['slate']), mode: 'daily' }),
    current: 'cr',
    isRevealing: true,
    message: 'Not in word list',
  };

  const board: Pick<GameState, 'solution' | 'guesses' | 'evaluations' | 'status'> = {
    solution: 'crane',
    guesses: ['slate'],
    evaluations: [ROW],
    status: 'IN_PROGRESS',
  };

  it('takes the guesses, the evaluations and the status', () => {
    const next = gameReducer(started, { type: 'RESTORE_GAME', board });

    expect(next.guesses).toEqual(['slate']);
    expect(next.evaluations).toEqual([ROW]);
    expect(next.status).toBe('IN_PROGRESS');
  });

  it('drops the half-typed row, the reveal and any message', () => {
    const next = gameReducer(started, { type: 'RESTORE_GAME', board });

    expect(next.current).toBe('');
    expect(next.isRevealing).toBe(false);
    expect(next.message).toBeUndefined();
  });

  it('keeps this tab’s dictionary and hard mode preference', () => {
    const strict = gameReducer(started, { type: 'SET_HARD_MODE', hardMode: true });

    const next = gameReducer(strict, { type: 'RESTORE_GAME', board });

    expect(next.dictionary).toBe(strict.dictionary);
    expect(next.hardMode).toBe(true);
  });

  it('leaves the state untouched when that board is already on screen', () => {
    const current = gameReducer(started, { type: 'RESTORE_GAME', board });

    const again = gameReducer(current, { type: 'RESTORE_GAME', board });

    // Same object, not merely equal: two tabs would otherwise write at each other
    // for as long as they stayed open.
    expect(again).toBe(current);
  });
});
