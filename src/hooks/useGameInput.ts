import { useEffect } from 'react';

interface GameInputOptions {
  onLetter: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  /** When false no listener is attached: the game is revealing, or already over. */
  enabled: boolean;
}

const LETTER = /^[a-z]$/i;

/**
 * Report physical keystrokes as game input.
 *
 * `Enter` and `Backspace` suppress their default action: otherwise a focused
 * on-screen key would also fire its own click, dispatching the same action
 * twice. Modifier combinations are left alone so browser and OS shortcuts keep
 * working.
 */
export const useGameInput = ({
  onLetter,
  onEnter,
  onBackspace,
  enabled,
}: GameInputOptions): void => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        onEnter();
        return;
      }
      if (event.key === 'Backspace') {
        event.preventDefault();
        onBackspace();
        return;
      }
      if (LETTER.test(event.key)) {
        onLetter(event.key.toLowerCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onLetter, onEnter, onBackspace]);
};
