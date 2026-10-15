/**
 * Test setup.
 *
 * Registers the jest-dom matchers so component tests can assert on accessible
 * roles, text content and ARIA state directly, and clears any stored game state
 * before each test so one test's board cannot leak into the next.
 *
 * jsdom 30 does not implement the modal parts of <dialog> — showModal is absent
 * outright — so a spec would throw before it could assert anything. The shim
 * below covers exactly the two methods the app calls. It is not a modal: it says
 * nothing about focus trapping, inertness or ::backdrop, which only a real
 * browser can show.
 */
import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

const dialogPrototype = window.HTMLDialogElement.prototype;

if (typeof dialogPrototype.showModal !== 'function') {
  dialogPrototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };

  dialogPrototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

beforeEach(() => {
  window.localStorage.clear();
});
