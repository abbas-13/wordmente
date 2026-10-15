import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import App from './App';
import { GAME, statsToggle, waitForInput } from './test/board';

/**
 * axe over the rendered app, in the states a player actually passes through.
 *
 * It cannot see colour contrast — that needs a layout engine, which jsdom has not
 * got — so this covers structure: roles, names, labels, landmarks. Contrast is
 * covered by the palette, by hand.
 */
const violations = async (container: HTMLElement): Promise<string[]> => {
  const results = await axe(container);

  return results.violations.map(
    (violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`,
  );
};

describe('accessibility', () => {
  it('has no violations on a fresh board', async () => {
    const { container } = render(<App setup={GAME} />);

    expect(await violations(container)).toEqual([]);
  });

  it('has no violations on a rejected guess', async () => {
    const { container } = render(<App setup={GAME} />);
    const user = userEvent.setup();

    await user.keyboard('zzzzz{Enter}');

    expect(await violations(container)).toEqual([]);
  });

  it('has no violations once the daily is done', async () => {
    const { container } = render(<App setup={GAME} />);
    const user = userEvent.setup();
    await user.keyboard('slate{Enter}');
    await waitForInput();
    await user.keyboard('crane{Enter}');

    expect(await violations(container)).toEqual([]);
  });

  it('has no violations with the statistics open', async () => {
    const { container } = render(<App setup={GAME} />);
    const user = userEvent.setup();

    await user.click(statsToggle());

    expect(await violations(container)).toEqual([]);
  });
});
