import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from './App';
import allowedGuesses from './data/allowed-guesses.json';
import type { GameSetup } from './game/state';

const GAME: GameSetup = {
  solution: 'crane',
  dictionary: new Set(['slate', 'abide', 'crate', 'bleak', 'elder', 'fable']),
};

/** Six valid words that are none of them the solution. */
const WRONG_GUESSES = ['slate', 'abide', 'crate', 'bleak', 'elder', 'fable'];

const renderApp = (setup: GameSetup = GAME) => {
  render(<App setup={setup} />);
  return { user: userEvent.setup() };
};

const rowAt = (index: number): HTMLElement => screen.getAllByRole('row')[index] as HTMLElement;

const cellsAt = (index: number): HTMLElement[] => [
  ...rowAt(index).querySelectorAll<HTMLElement>('td'),
];

const lettersAt = (index: number): string[] => cellsAt(index).map((cell) => cell.textContent ?? '');

const statesAt = (index: number): string[] =>
  cellsAt(index).map((cell) => cell.dataset.state ?? '');

/** Input is locked while a row reveals, so wait for the keyboard to come back. */
const waitForInput = () =>
  waitFor(() => {
    expect(screen.getByRole('button', { name: 'Q' })).toBeEnabled();
  });

describe('App', () => {
  it('renders the board and the keyboard', () => {
    renderApp();
    expect(screen.getByRole('table', { name: 'Game board' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('fills the active row as the player types', async () => {
    const { user } = renderApp();
    await user.keyboard('cra');
    expect(lettersAt(0)).toEqual(['c', 'r', 'a', '', '']);
    expect(statesAt(0)).toEqual(['typing', 'typing', 'typing', 'empty', 'empty']);
  });

  it('removes the last letter on Backspace', async () => {
    const { user } = renderApp();
    await user.keyboard('cra{Backspace}');
    expect(lettersAt(0)).toEqual(['c', 'r', '', '', '']);
  });

  it('scores a submitted guess', async () => {
    const { user } = renderApp();
    await user.keyboard('slate{Enter}');
    expect(statesAt(0)).toEqual(['absent', 'absent', 'correct', 'absent', 'correct']);
    expect(lettersAt(0)).toEqual(['s', 'l', 'a', 't', 'e']);
  });

  it('rejects a word that is not in the dictionary and marks the row invalid', async () => {
    const { user } = renderApp();
    await user.keyboard('zzzzz{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Not in word list');
    expect(rowAt(0)).toHaveAttribute('data-invalid', 'true');
    expect(lettersAt(0)).toEqual(['z', 'z', 'z', 'z', 'z']);
  });

  it('clears the invalid mark once the player edits the row', async () => {
    const { user } = renderApp();
    await user.keyboard('zzzzz{Enter}');
    await user.keyboard('{Backspace}');
    expect(rowAt(0)).not.toHaveAttribute('data-invalid');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('folds submitted letters into the keyboard', async () => {
    const { user } = renderApp();
    await user.keyboard('slate{Enter}');
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('data-state', 'correct');
    expect(screen.getByRole('button', { name: 'S' })).toHaveAttribute('data-state', 'absent');
    expect(screen.getByRole('button', { name: 'R' })).toHaveAttribute('data-state', 'unknown');
  });

  it('submits only once when Enter is pressed while a key has focus', async () => {
    const { user } = renderApp();
    await user.keyboard('slate');
    (screen.getByRole('button', { name: 'Enter' }) as HTMLButtonElement).focus();
    await user.keyboard('{Enter}');

    expect(statesAt(0)).toEqual(['absent', 'absent', 'correct', 'absent', 'correct']);
    // A second dispatch would find an empty row and complain about its length.
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('ignores typing while the row is revealing, then accepts input again', async () => {
    const { user } = renderApp();
    await user.keyboard('slate{Enter}');

    await user.keyboard('c');
    expect(lettersAt(1)).toEqual(['', '', '', '', '']);
    expect(screen.getByRole('button', { name: 'Q' })).toBeDisabled();

    await waitForInput();

    await user.keyboard('c');
    expect(lettersAt(1)).toEqual(['c', '', '', '', '']);
  });

  it('accepts a guess from the bundled dictionary', async () => {
    render(<App />);
    const user = userEvent.setup();

    const [word] = allowedGuesses;
    await user.keyboard(`${word}{Enter}`);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(statesAt(0).every((state) => state !== 'empty')).toBe(true);
  });

  it('announces a win with the number of guesses used', async () => {
    const { user } = renderApp();
    await user.keyboard('slate{Enter}');
    await waitForInput();
    await user.keyboard('crane{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent('Solved');
    expect(screen.getByRole('status')).toHaveTextContent('In 2 of 6');
  });

  it('reveals the solution once the guesses run out', async () => {
    const { user } = renderApp();

    for (const [index, word] of WRONG_GUESSES.entries()) {
      await user.keyboard(`${word}{Enter}`);
      if (index < WRONG_GUESSES.length - 1) {
        await waitForInput();
      }
    }

    expect(screen.getByRole('status')).toHaveTextContent('Out of guesses');
    expect(screen.getByRole('status')).toHaveTextContent('The word was CRANE');
  }, 15000);

  it('shows which daily puzzle is being played', () => {
    renderApp();
    expect(screen.getByText(/^Puzzle #\d+$/)).toBeInTheDocument();
  });

  it('starts an empty practice game and drops the puzzle number', async () => {
    const { user } = renderApp();
    await user.keyboard('slate{Enter}');
    await user.click(screen.getByRole('button', { name: 'Practice' }));

    expect(screen.getByRole('button', { name: 'Practice' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(lettersAt(0)).toEqual(['', '', '', '', '']);
    expect(statesAt(0)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
    expect(screen.queryByText(/^Puzzle #\d+$/)).not.toBeInTheDocument();
  });

  it('offers a new word only in practice', async () => {
    const { user } = renderApp();
    expect(screen.queryByRole('button', { name: 'New word' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Practice' }));
    expect(screen.getByRole('button', { name: 'New word' })).toBeInTheDocument();
  });

  it('clears the board when a new practice word is drawn', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Practice' }));
    await user.keyboard(`${allowedGuesses[0]}{Enter}`);
    await waitForInput();
    expect(statesAt(0).some((state) => state !== 'empty')).toBe(true);

    await user.click(screen.getByRole('button', { name: 'New word' }));
    expect(lettersAt(0)).toEqual(['', '', '', '', '']);
    expect(statesAt(0)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
  });

  it('returns to the daily puzzle from practice', async () => {
    const { user } = renderApp();
    await user.click(screen.getByRole('button', { name: 'Practice' }));
    await user.keyboard(`${allowedGuesses[0]}{Enter}`);
    await waitForInput();
    await user.click(screen.getByRole('button', { name: 'Daily' }));

    expect(screen.getByText(/^Puzzle #\d+$/)).toBeInTheDocument();
    expect(lettersAt(0)).toEqual(['', '', '', '', '']);
  });
});
