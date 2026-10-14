import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Evaluation } from '../game/types';
import Board from './Board';

/**
 * The board is a table, not `role="grid"`.
 *
 * The ARIA grid pattern promises an interactive widget with focus management;
 * the board is a read-only view of state whose input comes from the keyboard
 * handler, so a table exposes the right thing to assistive technology: rows and
 * named cells.
 */
const renderBoard = (props: Partial<Parameters<typeof Board>[0]> = {}) =>
  render(<Board guesses={[]} evaluations={[]} current="" {...props} />);

const cellsOf = (row: HTMLElement): HTMLElement[] => [...row.querySelectorAll<HTMLElement>('td')];

const statesOf = (row: HTMLElement): string[] =>
  cellsOf(row).map((cell) => cell.dataset.state ?? '');

const lettersOf = (row: HTMLElement): string[] =>
  cellsOf(row).map((cell) => cell.textContent ?? '');

const absent: Evaluation[] = ['absent', 'absent', 'absent', 'absent', 'absent'];

describe('Board', () => {
  it('renders six rows of five cells', () => {
    renderBoard();
    expect(screen.getAllByRole('row')).toHaveLength(6);
    expect(screen.getAllByRole('cell')).toHaveLength(30);
  });

  it('labels the board for assistive technology', () => {
    renderBoard();
    expect(screen.getByRole('table', { name: 'Game board' })).toBeInTheDocument();
  });

  it('starts with every cell empty', () => {
    renderBoard();
    for (const row of screen.getAllByRole('row')) {
      expect(statesOf(row)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
      expect(lettersOf(row).join('')).toBe('');
    }
  });

  it('shows submitted guesses with their evaluations', () => {
    renderBoard({
      guesses: ['slate'],
      evaluations: [['absent', 'absent', 'correct', 'absent', 'correct']],
    });
    const first = screen.getAllByRole('row')[0] as HTMLElement;
    expect(lettersOf(first)).toEqual(['s', 'l', 'a', 't', 'e']);
    expect(statesOf(first)).toEqual(['absent', 'absent', 'correct', 'absent', 'correct']);
  });

  it('fills rows from the top down', () => {
    renderBoard({ guesses: ['abide', 'bleak'], evaluations: [absent, absent] });
    const rows = screen.getAllByRole('row');
    expect(lettersOf(rows[0] as HTMLElement)[0]).toBe('a');
    expect(lettersOf(rows[1] as HTMLElement)[0]).toBe('b');
    expect(statesOf(rows[2] as HTMLElement)).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
  });

  it('shows the row being typed, leaving unevaluated cells empty', () => {
    renderBoard({ guesses: ['abide'], evaluations: [absent], current: 'cr' });
    const active = screen.getAllByRole('row')[1] as HTMLElement;
    expect(lettersOf(active)).toEqual(['c', 'r', '', '', '']);
    expect(statesOf(active)).toEqual(['typing', 'typing', 'empty', 'empty', 'empty']);
  });

  it('names each cell for assistive technology', () => {
    renderBoard({
      guesses: ['slate'],
      evaluations: [['absent', 'correct', 'present', 'absent', 'absent']],
      current: 'cr',
    });
    expect(screen.getByRole('cell', { name: 'S, absent' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'L, correct' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'A, present' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'C, typed' })).toBeInTheDocument();
    expect(screen.getAllByRole('cell', { name: 'empty' })).toHaveLength(23);
  });

  it('marks the row being typed as invalid only when asked', () => {
    renderBoard({ guesses: ['abide'], evaluations: [absent], current: 'zzzzz', isInvalid: true });
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveAttribute('data-invalid', 'true');
    expect(rows[0]).not.toHaveAttribute('data-invalid');
  });

  it('leaves rows unmarked when the guess is not invalid', () => {
    renderBoard({ guesses: ['abide'], evaluations: [absent], current: 'zzzzz' });
    for (const row of screen.getAllByRole('row')) {
      expect(row).not.toHaveAttribute('data-invalid');
    }
  });
});
