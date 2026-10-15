import type { KeyboardState } from '../game/types';
import styles from './Key.module.css';

interface KeyProps {
  /** The value reported when pressed: a lower-case letter, or an action like 'Enter'. */
  value: string;
  /** The state this key was folded into; untouched keys stay unknown. */
  state?: KeyboardState;
  /** Action keys are wider than letter keys. */
  wide?: boolean;
  disabled?: boolean;
  onKey: (value: string) => void;
}

/** How the action keys draw themselves where there is no room for a word. */
const GLYPHS: Record<string, string> = {
  Enter: '\u21b5',
  Backspace: '\u232b',
};

/**
 * Action keys short enough to spell out once the keys are wide. Backspace is not
 * one of them: eight letters cannot fit a 1.5-key at a legible size, so it keeps
 * its symbol rather than overflowing the key.
 */
const SPELLED_OUT = new Set(['Enter']);

/** Single letters are shown upper case; action keys show their word. */
const labelFor = (value: string): string => (value.length === 1 ? value.toUpperCase() : value);

const Key = ({ value, state = 'unknown', wide = false, disabled = false, onKey }: KeyProps) => {
  const glyph = wide ? GLYPHS[value] : undefined;

  const className = [
    styles.key,
    wide && styles.wide,
    SPELLED_OUT.has(value) && styles['spelled-out'],
  ]
    .filter(Boolean)
    .join(' ');

  const contents = glyph ? (
    <>
      {SPELLED_OUT.has(value) && <span className={styles.word}>{labelFor(value)}</span>}
      <span className={styles.glyph} aria-hidden="true">
        {glyph}
      </span>
    </>
  ) : (
    labelFor(value)
  );

  return (
    <button
      type="button"
      className={className}
      data-key={value}
      data-state={state}
      // Which of the two labels shows depends on the width, so the name is pinned here.
      aria-label={glyph ? value : undefined}
      disabled={disabled}
      onClick={() => onKey(value)}
    >
      {contents}
    </button>
  );
};

export default Key;
