import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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

const renderStats = (stats: StatsData = STATS) => {
  render(<Stats stats={stats} />);
  return { user: userEvent.setup() };
};

describe('Stats', () => {
  it('stays closed until it is asked for', () => {
    renderStats();

    expect(statsToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Played')).not.toBeInTheDocument();
  });

  it('shows the tally when opened', async () => {
    const { user } = renderStats();

    await user.click(statsToggle());

    expect(statsToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(statValue('Played')).toBe('4');
    expect(statValue('Win %')).toBe('75');
    expect(statValue('Current streak')).toBe('2');
    expect(statValue('Max streak')).toBe('2');
  });

  it('closes again when asked', async () => {
    const { user } = renderStats();

    await user.click(statsToggle());
    await user.click(statsToggle());

    expect(screen.queryByText('Played')).not.toBeInTheDocument();
  });

  it('lists every guess count, including the ones never used', async () => {
    const { user } = renderStats();

    await user.click(statsToggle());

    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByRole('listitem', { name: /solved in 1 guess: 1/i })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /solved in 2 guesses: 2/i })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /solved in 6 guesses: 0/i })).toBeInTheDocument();
  });

  it('survives a blank slate', async () => {
    const { user } = renderStats({
      version: 1,
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0],
    });

    await user.click(statsToggle());

    expect(statValue('Played')).toBe('0');
    expect(statValue('Win %')).toBe('0');
  });
});
