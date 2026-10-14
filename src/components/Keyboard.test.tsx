import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { KeyboardState } from '../game/types';
import Keyboard from './Keyboard';

const renderKeyboard = (props: Partial<Parameters<typeof Keyboard>[0]> = {}) => {
  const onKey = vi.fn();
  const view = render(<Keyboard keyStates={{}} onKey={onKey} {...props} />);
  return { onKey, container: view.container };
};

const rowsOf = (container: HTMLElement): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>('[data-row]'),
];

const valuesOf = (row: HTMLElement): string[] =>
  [...row.querySelectorAll<HTMLElement>('button')].map((key) => key.dataset.key ?? '');

describe('Keyboard', () => {
  it('renders every letter exactly once', () => {
    const { container } = renderKeyboard();
    const letters = valuesOf(rowsOf(container)[0] as HTMLElement)
      .concat(valuesOf(rowsOf(container)[1] as HTMLElement))
      .concat(valuesOf(rowsOf(container)[2] as HTMLElement))
      .filter((value) => value.length === 1);

    expect(letters).toHaveLength(26);
    expect(new Set(letters).size).toBe(26);
  });

  it('lays the letters out in three rows', () => {
    const { container } = renderKeyboard();
    const rows = rowsOf(container);
    expect(rows).toHaveLength(3);
    expect(valuesOf(rows[0] as HTMLElement)).toEqual([...'qwertyuiop']);
    expect(valuesOf(rows[1] as HTMLElement)).toEqual([...'asdfghjkl']);
    expect(valuesOf(rows[2] as HTMLElement)).toEqual(['Enter', ...'zxcvbnm', 'Backspace']);
  });

  it('reports a letter key in lower case when clicked', async () => {
    const user = userEvent.setup();
    const { onKey } = renderKeyboard();
    await user.click(screen.getByRole('button', { name: 'Q' }));
    expect(onKey).toHaveBeenCalledWith('q');
  });

  it('reports the action keys by name when clicked', async () => {
    const user = userEvent.setup();
    const { onKey } = renderKeyboard();
    await user.click(screen.getByRole('button', { name: 'Enter' }));
    await user.click(screen.getByRole('button', { name: 'Backspace' }));
    expect(onKey).toHaveBeenNthCalledWith(1, 'Enter');
    expect(onKey).toHaveBeenNthCalledWith(2, 'Backspace');
  });

  it('shows each key the state it was folded into', () => {
    const keyStates: Record<string, KeyboardState> = { a: 'correct', b: 'present', c: 'absent' };
    renderKeyboard({ keyStates });

    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('data-state', 'correct');
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('data-state', 'present');
    expect(screen.getByRole('button', { name: 'C' })).toHaveAttribute('data-state', 'absent');
  });

  it('leaves letters that have not been tried unknown', () => {
    renderKeyboard({ keyStates: { a: 'correct' } });
    expect(screen.getByRole('button', { name: 'Z' })).toHaveAttribute('data-state', 'unknown');
    expect(screen.getByRole('button', { name: 'Enter' })).toHaveAttribute('data-state', 'unknown');
  });

  it('labels its keys in upper case for assistive technology', () => {
    renderKeyboard();
    expect(screen.getByRole('button', { name: 'A' })).toHaveTextContent('A');
    expect(screen.getByRole('button', { name: 'Enter' })).toHaveTextContent('Enter');
  });

  it('reports nothing while it is disabled', async () => {
    const user = userEvent.setup();
    const { onKey } = renderKeyboard({ disabled: true });
    await user.click(screen.getByRole('button', { name: 'Q' }));
    expect(onKey).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Q' })).toBeDisabled();
  });
});
