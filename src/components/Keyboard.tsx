import { KEYBOARD_ROWS } from '../game/constants';
import type { KeyboardState } from '../game/types';
import Key from './Key';
import styles from './Keyboard.module.css';

interface KeyboardProps {
  /** Folded state per letter, as produced by `computeKeyboardState`. */
  keyStates: Record<string, KeyboardState>;
  onKey: (value: string) => void;
  /** Set while a reveal is running, so the board's state cannot be raced. */
  disabled?: boolean;
}

const ENTER = 'Enter';
const BACKSPACE = 'Backspace';
const BOTTOM_ROW = KEYBOARD_ROWS.length - 1;

const Keyboard = ({ keyStates, onKey, disabled = false }: KeyboardProps) => (
  <div className={styles.keyboard}>
    {KEYBOARD_ROWS.map((row, rowIndex) => {
      const isBottomRow = rowIndex === BOTTOM_ROW;

      return (
        <div className={styles.row} data-row={rowIndex} key={row}>
          {isBottomRow && <Key value={ENTER} wide disabled={disabled} onKey={onKey} />}
          {[...row].map((letter) => (
            <Key
              key={letter}
              value={letter}
              state={keyStates[letter]}
              disabled={disabled}
              onKey={onKey}
            />
          ))}
          {isBottomRow && <Key value={BACKSPACE} wide disabled={disabled} onKey={onKey} />}
        </div>
      );
    })}
  </div>
);

export default Keyboard;
