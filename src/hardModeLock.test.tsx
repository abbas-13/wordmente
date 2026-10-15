import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from './App';
import { isHardModeLocked } from './game/hardMode';
import type { GameState } from './game/state';
import { createGameState } from './game/state';
import { GAME, hardModeSwitch, waitForInput } from './test/board';

/** A board with a solution and dictionary of its own, so the rule can be read in isolation. */
const board = (overrides: Partial<GameState> = {}): GameState => ({
  ...createGameState({
    solution: 'crane',
    dictionary: new Set(['slate', 'crane']),
    mode: 'daily',
  }),
  ...overrides,
});

describe('the hard mode lock', () => {
  it('is off while hard mode is off', () => {
    expect(isHardModeLocked(board())).toBe(false);
  });

  it('is off before the first guess', () => {
    expect(isHardModeLocked(board({ hardMode: true }))).toBe(false);
  });

  it('bites once a guess is in play', () => {
    expect(isHardModeLocked(board({ hardMode: true, guesses: ['slate'] }))).toBe(true);
  });

  it('releases once the game is over', () => {
    expect(isHardModeLocked(board({ hardMode: true, guesses: ['crane'], status: 'WIN' }))).toBe(
      false,
    );
    expect(isHardModeLocked(board({ hardMode: true, guesses: ['slate'], status: 'FAIL' }))).toBe(
      false,
    );
  });
});

describe('the hard mode switch in the app', () => {
  const renderApp = () => {
    render(<App setup={GAME} />);
    return { user: userEvent.setup() };
  };

  it('can be switched on before the first guess', async () => {
    const { user } = renderApp();

    await user.click(hardModeSwitch());

    expect(hardModeSwitch()).toBeChecked();
    expect(hardModeSwitch()).toBeEnabled();
  });

  it('cannot be switched off once a guess is in play', async () => {
    const { user } = renderApp();
    await user.click(hardModeSwitch());
    await user.keyboard('slate{Enter}');
    await waitForInput();

    expect(hardModeSwitch()).toBeChecked();
    expect(hardModeSwitch()).toBeDisabled();
  });

  it('frees the switch once the daily is done', async () => {
    const { user } = renderApp();
    await user.click(hardModeSwitch());
    await user.keyboard('slate{Enter}');
    await waitForInput();
    await user.keyboard('crane{Enter}');

    expect(screen.getByRole('status')).toHaveTextContent('Solved');
    expect(hardModeSwitch()).toBeEnabled();
  });
});
