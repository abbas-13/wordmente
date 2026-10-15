import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { HIGH_CONTRAST_KEY, loadHighContrast, saveHighContrast } from './game/storage';
import { GAME } from './test/board';

const contrastSwitch = () => screen.getByRole('checkbox', { name: /high contrast/i });

describe('the high contrast preference', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is off to begin with', () => {
    expect(loadHighContrast(window.localStorage)).toBe(false);
  });

  it('round-trips through storage', () => {
    saveHighContrast(window.localStorage, true);
    expect(loadHighContrast(window.localStorage)).toBe(true);

    saveHighContrast(window.localStorage, false);
    expect(loadHighContrast(window.localStorage)).toBe(false);
  });

  it('falls back to off when the entry is junk, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.localStorage.setItem(HIGH_CONTRAST_KEY, 'maybe');

    expect(loadHighContrast(window.localStorage)).toBe(false);
    expect(warn.mock.calls[0]?.[0]).toContain(HIGH_CONTRAST_KEY);
  });

  it('is off when storage cannot be reached at all', () => {
    expect(loadHighContrast(undefined)).toBe(false);
  });
});

describe('the high contrast switch', () => {
  it('starts off when nothing was stored', () => {
    render(<App setup={GAME} />);

    expect(contrastSwitch()).not.toBeChecked();
    expect(document.documentElement).not.toHaveAttribute('data-contrast');
  });

  it('marks the document, so the palette can follow it', async () => {
    render(<App setup={GAME} />);
    const user = userEvent.setup();

    await user.click(contrastSwitch());

    expect(contrastSwitch()).toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-contrast', 'high');
  });

  it('takes the mark off again when switched back', async () => {
    render(<App setup={GAME} />);
    const user = userEvent.setup();

    await user.click(contrastSwitch());
    await user.click(contrastSwitch());

    expect(contrastSwitch()).not.toBeChecked();
    expect(document.documentElement).not.toHaveAttribute('data-contrast');
  });

  it('is already on after a reload, and leaves nothing behind when it unmounts', () => {
    saveHighContrast(window.localStorage, true);

    const app = render(<App />);
    expect(document.documentElement).toHaveAttribute('data-contrast', 'high');

    app.unmount();
    expect(document.documentElement).not.toHaveAttribute('data-contrast');
  });
});
