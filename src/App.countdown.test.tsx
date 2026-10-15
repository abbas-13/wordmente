import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from './App';
import { GAME, waitForInput } from './test/board';

/** Play the injected daily out to a win, which is what ends the day's game. */
const winTheDaily = async () => {
  const user = userEvent.setup();
  await user.keyboard('slate{Enter}');
  await waitForInput();
  await user.keyboard('crane{Enter}');
};

describe('the countdown to the next puzzle', () => {
  it('appears once the daily is done', async () => {
    render(<App setup={GAME} />);

    await winTheDaily();

    expect(screen.getByText(/next puzzle in/i)).toBeInTheDocument();
  });

  it('stays out of the live region, so it cannot announce itself every tick', async () => {
    render(<App setup={GAME} />);

    await winTheDaily();

    expect(screen.getByRole('status')).not.toContainElement(screen.getByText(/next puzzle in/i));
  });

  it('is not shown while the daily is still being played', () => {
    render(<App setup={GAME} />);

    expect(screen.queryByText(/next puzzle in/i)).not.toBeInTheDocument();
  });
});
