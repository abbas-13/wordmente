import type { GameMode } from '../game/types';
import styles from './GameControls.module.css';

interface GameControlsProps {
  mode: GameMode;
  /** Start a board for the given mode; practice draws a fresh word. */
  onStart: (mode: GameMode) => void;
}

const GameControls = ({ mode, onStart }: GameControlsProps) => (
  <div className={styles.controls}>
    <button
      type="button"
      className={styles.mode}
      aria-pressed={mode === 'daily'}
      onClick={() => onStart('daily')}
    >
      Daily
    </button>
    <button
      type="button"
      className={styles.mode}
      aria-pressed={mode === 'practice'}
      onClick={() => onStart('practice')}
    >
      Practice
    </button>
    {mode === 'practice' && (
      <button type="button" className={styles.mode} onClick={() => onStart('practice')}>
        New word
      </button>
    )}
  </div>
);

export default GameControls;
