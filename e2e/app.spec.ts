import { expect, test } from '@playwright/test';

/**
 * The viewport where the clipping showed up: the desktop app's preview pane.
 * Narrow and tall, like a phone rather than the wide window a browser suggests.
 */
const PHONE = { width: 352, height: 737 };

test('the whole keyboard fits on a phone-sized screen', async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto('/');

  const box = await page.getByRole('button', { name: 'Backspace' }).boundingBox();

  expect(box).not.toBeNull();
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(PHONE.height);
});

test('scoring a guess marks the row', async ({ page }) => {
  await page.goto('/');

  // The window listener is attached in an effect, which runs after the first
  // paint, so a keystroke sent the moment the page loads can arrive before
  // anything is listening and is simply lost. Clicking an on-screen key proves
  // the app is interactive; clearing it again leaves the board empty.
  await page.getByRole('button', { name: 'A', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'A, typed' })).toBeVisible();
  await page.getByRole('button', { name: 'Backspace' }).click();
  await expect(page.getByRole('cell', { name: 'A, typed' })).toBeHidden();

  await page.keyboard.type('aahed');
  await expect(page.getByRole('cell', { name: 'D, typed' })).toBeVisible();

  await page.keyboard.press('Enter');

  await expect(page.getByRole('row').first().getByRole('cell').first()).toHaveAttribute(
    'data-state',
    /^(correct|present|absent)$/,
  );
});

test('the statistics open as a modal dialog', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Statistics' }).click();

  const dialog = page.getByRole('dialog');

  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Played')).toBeVisible();
});

test('Escape closes the statistics', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Statistics' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).toBeHidden();
});
