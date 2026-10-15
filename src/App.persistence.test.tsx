import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import allowedGuesses from './data/allowed-guesses.json';
import answers from './data/answers.json';
import { dailyAnswer, puzzleNumberForDate } from './game/puzzle';
import { saveDaily, saveHardMode } from './game/storage';
import {
  ALL_CORRECT,
  hardModeSwitch,
  lettersAt,
  renderApp,
  statesAt,
  waitForInput,
} from './test/board';

/** The real daily puzzle: these specs exercise the app's own wiring, not an injected setup. */
const today = new Date();
const solution = dailyAnswer(answers, today);
const puzzle = puzzleNumberForDate(today);

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
