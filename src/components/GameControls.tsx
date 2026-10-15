import type { GameMode } from '../game/types';
import styles from './GameControls.module.css';

interface GameControlsProps {
  mode: GameMode;
  hardMode: boolean;
  /** True once a guess is in play with hard mode on, so the setting cannot be undone. */
  hardModeLocked: boolean;
  highContrast: boolean;
  /** Switch which board is on screen. Neither board is reset. */
  onSelect: (mode: GameMode) => void;
  /** Draw a fresh practice word; the only thing that discards a board. */
  onNewWord: () => void;
  onSetHardMode: (hardMode: boolean) => void;
  onSetHighContrast: (highContrast: boolean) => void;
}

const GameControls = ({
  mode,
  hardMode,
  hardModeLocked,
  highContrast,
  onSelect,
  onNewWord,
  onSetHardMode,
  onSetHighContrast,
}: GameControlsProps) => (
  <div className={styles.controls}>
    <button
      type="button"
      className={styles.mode}
      aria-pressed={mode === 'daily'}
      onClick={() => onSelect('daily')}
    >
      Daily
    </button>
    <button
      type="button"
      className={styles.mode}
      aria-pressed={mode === 'practice'}
      onClick={() => onSelect('practice')}
    >
      Practice
    </button>
    {mode === 'practice' && (
      <button type="button" className={styles.mode} onClick={onNewWord}>
        New word
      </button>
    )}

    <label className={styles.toggle}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={hardMode}
        disabled={hardModeLocked}
        onChange={(event) => onSetHardMode(event.target.checked)}
      />
      Hard mode
    </label>

    <label className={styles.toggle}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={highContrast}
        onChange={(event) => onSetHighContrast(event.target.checked)}
      />
      High contrast
    </label>

    {hardModeLocked && <p className={styles.hint}>Hard mode stays on once a guess is in play</p>}
  </div>
);

export default GameControls;
