import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useGameInput } from './useGameInput';

const setup = (enabled = true) => {
  const spies = { onLetter: vi.fn(), onEnter: vi.fn(), onBackspace: vi.fn() };
  const view = renderHook(
    (props: { enabled: boolean }) => useGameInput({ ...spies, enabled: props.enabled }),
    { initialProps: { enabled } },
  );
  return { ...spies, ...view };
};

describe('useGameInput', () => {
  it('reports a letter in lower case', async () => {
    const user = userEvent.setup();
    const { onLetter } = setup();
    await user.keyboard('a');
    expect(onLetter).toHaveBeenCalledWith('a');
  });

  it('reports a shifted letter in lower case', async () => {
    const user = userEvent.setup();
    const { onLetter } = setup();
    await user.keyboard('{Shift>}A{/Shift}');
    expect(onLetter).toHaveBeenCalledWith('a');
  });

  it('reports Enter', async () => {
    const user = userEvent.setup();
    const { onEnter, onLetter } = setup();
    await user.keyboard('{Enter}');
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onLetter).not.toHaveBeenCalled();
  });

  it('reports Backspace', async () => {
    const user = userEvent.setup();
    const { onBackspace } = setup();
    await user.keyboard('{Backspace}');
    expect(onBackspace).toHaveBeenCalledTimes(1);
  });

  it('ignores keys that are not letters or the two actions', async () => {
    const user = userEvent.setup();
    const { onLetter, onEnter, onBackspace } = setup();
    await user.keyboard('1');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{Escape}');
    await user.keyboard(' ');
    expect(onLetter).not.toHaveBeenCalled();
    expect(onEnter).not.toHaveBeenCalled();
    expect(onBackspace).not.toHaveBeenCalled();
  });

  it('ignores a letter typed with a modifier held', async () => {
    const user = userEvent.setup();
    const { onLetter } = setup();
    await user.keyboard('{Meta>}r{/Meta}');
    await user.keyboard('{Control>}a{/Control}');
    await user.keyboard('{Alt>}x{/Alt}');
    expect(onLetter).not.toHaveBeenCalled();
  });

  it('reports nothing while it is disabled', async () => {
    const user = userEvent.setup();
    const { onLetter, onEnter } = setup(false);
    await user.keyboard('a');
    await user.keyboard('{Enter}');
    expect(onLetter).not.toHaveBeenCalled();
    expect(onEnter).not.toHaveBeenCalled();
  });

  it('stops reporting once the enabled flag turns off', async () => {
    const user = userEvent.setup();
    const { onLetter, rerender } = setup(true);
    await user.keyboard('a');
    expect(onLetter).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    await user.keyboard('b');
    expect(onLetter).toHaveBeenCalledTimes(1);
  });

  it('removes its listener when it unmounts', async () => {
    const user = userEvent.setup();
    const { onLetter, unmount } = setup();
    unmount();
    await user.keyboard('a');
    expect(onLetter).not.toHaveBeenCalled();
  });
});
