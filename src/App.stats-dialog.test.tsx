import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from './App';
import { GAME, lettersAt, statsToggle } from './test/board';

describe('the statistics dialog', () => {
  it('opens over the board', async () => {
    render(<App setup={GAME} />);
    const user = userEvent.setup();

    await user.click(statsToggle());

    expect(screen.getByRole('dialog')).toHaveAttribute('open');
  });

  it('holds the board while it is open, and lets go when it closes', async () => {
    render(<App setup={GAME} />);
    const user = userEvent.setup();
    await user.click(statsToggle());

    // The keyboard listener is on the window, so without this the letters would
    // land on the board behind the dialog.
    await user.keyboard('slate');
    expect(lettersAt(0)).toEqual(['', '', '', '', '']);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.keyboard('slate');
    expect(lettersAt(0)).toEqual(['s', 'l', 'a', 't', 'e']);
  });
});
