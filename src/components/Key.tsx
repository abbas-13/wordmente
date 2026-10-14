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

/** Single letters are shown upper case; action keys show their word. */
const labelFor = (value: string): string => (value.length === 1 ? value.toUpperCase() : value);

const Key = ({ value, state = 'unknown', wide = false, disabled = false, onKey }: KeyProps) => (
  <button
    type="button"
    className={wide ? `${styles.key} ${styles.wide}` : styles.key}
    data-key={value}
    data-state={state}
    disabled={disabled}
    onClick={() => onKey(value)}
  >
    {labelFor(value)}
  </button>
);

export default Key;
