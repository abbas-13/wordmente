/**
 * Test setup.
 *
 * Registers the jest-dom matchers so component tests can assert on accessible
 * roles, text content and ARIA state directly, and clears any stored game state
 * before each test so one test's board cannot leak into the next.
 */
import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

beforeEach(() => {
  window.localStorage.clear();
});
