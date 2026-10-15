import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Stats as StatsData } from '../game/stats';
import { statsToggle, statValue } from '../test/board';
import Stats from './Stats';

const STATS: StatsData = {
  version: 1,
  played: 4,
  wins: 3,
  currentStreak: 2,
  maxStreak: 2,
  distribution: [1, 2, 0, 0, 0, 0],
};

const BLANK: StatsData = {
  version: 1,
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: [0, 0, 0, 0, 0, 0],
};

const renderStats = (stats: StatsData = STATS) => {
  const onOpenChange = vi.fn();
  render(<Stats stats={stats} onOpenChange={onOpenChange} />);
  return { user: userEvent.setup(), onOpenChange };
};

const dialog = () => screen.getByRole('dialog');
const closeButton = () => screen.getByRole('button', { name: 'Close' });

describe('Stats', () => {
  it('stays off screen until it is asked for', () => {
    renderStats();

    expect(statsToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a modal when the button is clicked', async () => {
    const { user } = renderStats();

    await user.click(statsToggle());

    expect(statsToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(dialog()).toHaveAttribute('open');
    expect(within(dialog()).getByText('Played')).toBeInTheDocument();
  });

  it('tells the app when it opens and closes', async () => {
    const { user, onOpenChange } = renderStats();

    await user.click(statsToggle());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await user.click(closeButton());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('closes from its own button', async () => {
    const { user } = renderStats();

    await user.click(statsToggle());
    await user.click(closeButton());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(statsToggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the tally', async () => {
    const { user } = renderStats();

    await user.click(statsToggle());

    expect(statValue('Played')).toBe('4');
    expect(statValue('Win %')).toBe('75');
    expect(statValue('Current streak')).toBe('2');
    expect(statValue('Max streak')).toBe('2');
  });

  it('lists every guess count, including the ones never used', async () => {
    const { user } = renderStats();

    await user.click(statsToggle());

    expect(within(dialog()).getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByRole('listitem', { name: /solved in 1 guess: 1/i })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /solved in 2 guesses: 2/i })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /solved in 6 guesses: 0/i })).toBeInTheDocument();
  });

  it('survives a blank slate', async () => {
    const { user } = renderStats(BLANK);

    await user.click(statsToggle());

    expect(statValue('Played')).toBe('0');
    expect(statValue('Win %')).toBe('0');
  });
});
