import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import allowedGuesses from './data/allowed-guesses.json';
import answers from './data/answers.json';
import { dailyAnswer, puzzleNumberForDate } from './game/puzzle';
import { scoreGuess } from './game/scoring';
import { loadStats } from './game/stats';
import { saveDaily, saveHardMode } from './game/storage';
import {
  ALL_CORRECT,
  hardModeSwitch,
  isInputLocked,
  lettersAt,
  renderApp,
  statesAt,
  statsToggle,
  statValue,
  WRONG_GUESSES,
  waitForInput,
} from './test/board';

/** The real daily puzzle: these specs exercise the app's own wiring, not an injected setup. */
const today = new Date();
const solution = dailyAnswer(answers, today);
const puzzle = puzzleNumberForDate(today);

/** A completed daily board, as it would have been left by the game that played it. */
const finishedBoard = (status: 'WIN' | 'FAIL') => {
  const guesses = status === 'WIN' ? [solution] : WRONG_GUESSES;
  return {
    version: 1,
    puzzle,
    solution,
    guesses,
    evaluations: guesses.map((guess) => scoreGuess(guess, solution)),
    status,
  };
};

/** A scored row proves the guess landed, whether or not it ended the game. */
const waitForScoredRow = (index: number): Promise<void> =>
  waitFor(() => {
    expect(statesAt(index).every((state) => state !== 'empty' && state !== 'typing')).toBe(true);
  });

describe('the daily board across reloads', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('comes back with the guesses that were already played', async () => {
    const first = render(<App />);
    const user = userEvent.setup();
    await user.keyboard(`${allowedGuesses[0]}{Enter}`);
    await waitForInput();
    const played = statesAt(0);
    const folded = screen.getByRole('button', { name: 'A' }).dataset.state;
    first.unmount();

    render(<App />);

    expect(lettersAt(0)).toEqual([...allowedGuesses[0]]);
    expect(statesAt(0)).toEqual(played);
    expect(screen.getByRole('button', { name: 'A' }).dataset.state).toBe(folded);
  });

  it('comes back to a daily that was already finished', () => {
    saveDaily(window.localStorage, {
      version: 1,
      puzzle,
      solution,
      guesses: [solution],
      evaluations: [ALL_CORRECT],
      status: 'WIN',
    });

    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('Solved');
    expect(lettersAt(0)).toEqual([...solution]);
  });

  it('starts fresh when the saved board belongs to another day', () => {
    saveDaily(window.localStorage, {
      version: 1,
      puzzle: puzzle - 1,
      solution: 'crane',
      guesses: ['crane'],
      evaluations: [ALL_CORRECT],
      status: 'WIN',
    });

    render(<App />);

    expect(lettersAt(0)).toEqual(['', '', '', '', '']);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('comes back with the hard mode switch set', () => {
    saveHardMode(window.localStorage, true);

    render(<App />);

    expect(hardModeSwitch()).toBeChecked();
  });

  it('does not keep a practice board', async () => {
    const first = render(<App />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Practice' }));
    await user.keyboard(`${allowedGuesses[0]}{Enter}`);
    await waitForInput();
    first.unmount();

    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Practice' }));

    expect(lettersAt(0)).toEqual(['', '', '', '', '']);
  });

  it('rolls the daily over when the day changes under it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const { user } = renderApp();
    await user.keyboard('slate{Enter}');
    await waitForInput();
    const before = screen.getByText(/^Puzzle #\d+$/).textContent;

    vi.setSystemTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(lettersAt(0)).toEqual(['', '', '', '', '']);
    expect(screen.getByText(/^Puzzle #\d+$/).textContent).not.toBe(before);
  });
});

describe('the statistics', () => {
  it('count a finished daily', async () => {
    saveDaily(window.localStorage, finishedBoard('WIN'));
    render(<App />);
    const user = userEvent.setup();

    await user.click(statsToggle());

    expect(statValue('Played')).toBe('1');
    expect(statValue('Win %')).toBe('100');
    expect(statValue('Current streak')).toBe('1');
  });

  it('count a lost daily as played but not won', async () => {
    saveDaily(window.localStorage, finishedBoard('FAIL'));
    render(<App />);
    const user = userEvent.setup();

    await user.click(statsToggle());

    expect(statValue('Played')).toBe('1');
    expect(statValue('Win %')).toBe('0');
    expect(statValue('Current streak')).toBe('0');
  });

  it('count the same daily once, however many reloads it takes', () => {
    saveDaily(window.localStorage, finishedBoard('WIN'));

    render(<App />).unmount();
    render(<App />);

    expect(loadStats(window.localStorage).played).toBe(1);
  });

  it('leave practice games out', async () => {
    render(<App />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Practice' }));

    // The practice word is drawn at random, so the round can end before six
    // guesses: stop as soon as the game is over, either way.
    for (const [index, word] of WRONG_GUESSES.entries()) {
      if (isInputLocked()) {
        break;
      }
      await user.keyboard(`${word}{Enter}`);
      await waitForScoredRow(index);
    }

    expect(loadStats(window.localStorage).played).toBe(0);
  }, 20000);
});
