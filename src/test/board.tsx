/**
 * Shared fixtures and board queries for the App specs.
 *
 * Kept here so each spec file stays a readable description of behaviour rather
 * than a wall of DOM plumbing.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import App from '../App';
import type { GameSetup } from '../game/state';
import type { Evaluation } from '../game/types';

export const GAME: GameSetup = {
  solution: 'crane',
  dictionary: new Set(['slate', 'abide', 'crate', 'bleak', 'elder', 'fable', 'clove']),
};

/** Six valid words that are none of them the solution. */
export const WRONG_GUESSES = ['slate', 'abide', 'crate', 'bleak', 'elder', 'fable'];

export const ALL_CORRECT: Evaluation[] = ['correct', 'correct', 'correct', 'correct', 'correct'];

export const renderApp = (setup: GameSetup = GAME) => {
  render(<App setup={setup} />);
  return { user: userEvent.setup() };
};

export const rowAt = (index: number): HTMLElement =>
  screen.getAllByRole('row')[index] as HTMLElement;

export const cellsAt = (index: number): HTMLElement[] => [
  ...rowAt(index).querySelectorAll<HTMLElement>('td'),
];

export const lettersAt = (index: number): string[] =>
  cellsAt(index).map((cell) => cell.textContent ?? '');

export const statesAt = (index: number): string[] =>
  cellsAt(index).map((cell) => cell.dataset.state ?? '');

/** Input is locked while a row reveals, so wait for the keyboard to come back. */
export const waitForInput = (): Promise<void> =>
  waitFor(() => {
    expect(screen.getByRole('button', { name: 'Q' })).toBeEnabled();
  });

export const hardModeSwitch = (): HTMLElement =>
  screen.getByRole('checkbox', { name: /hard mode/i });
