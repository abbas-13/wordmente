import { useEffect, useRef, useState } from 'react';

import { MAX_GUESSES } from '../game/constants';
import type { Stats as StatsData } from '../game/stats';
import { winPercent } from '../game/stats';
import styles from './Stats.module.css';

/** The guess counts, in the order the distribution stores them. */
const GUESS_NUMBERS = Array.from({ length: MAX_GUESSES }, (_, index) => index + 1);

const HEADING_ID = 'stats-heading';

interface StatsProps {
  stats: StatsData;
  /** Told whenever the dialog opens or closes, so the app can hold back the board's keys. */
  onOpenChange?: (isOpen: boolean) => void;
}

/**
 * The tally, in a modal opened from the header button.
 *
 * A native <dialog> rather than a hand-built overlay: the browser already does
 * the focus trapping, the top layer, the backdrop and Escape, and getting those
 * right by hand is where hand-rolled modals go wrong.
 */
const Stats = ({ stats, onOpenChange }: StatsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const best = Math.max(...stats.distribution, 1);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    dialogRef.current?.showModal();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    // Escape closes a native modal without React hearing about it, so the state
    // follows the element rather than the other way round.
    const handleClose = (): void => {
      setIsOpen(false);
      onOpenChange?.(false);
    };
    dialog.addEventListener('close', handleClose);

    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [isOpen, onOpenChange]);

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen(true);
          onOpenChange?.(true);
        }}
      >
        Statistics
      </button>

      {isOpen && (
        <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={HEADING_ID}>
          <h2 id={HEADING_ID} className={styles.heading}>
            Statistics
          </h2>

          <dl className={styles.tally}>
            <dt>Played</dt>
            <dd>{stats.played}</dd>
            <dt>Win %</dt>
            <dd>{winPercent(stats)}</dd>
            <dt>Current streak</dt>
            <dd>{stats.currentStreak}</dd>
            <dt>Max streak</dt>
            <dd>{stats.maxStreak}</dd>
          </dl>

          <h3 className={styles.subheading}>Guess distribution</h3>
          <ol className={styles.distribution}>
            {GUESS_NUMBERS.map((guessNumber) => {
              const count = stats.distribution[guessNumber - 1] ?? 0;
              const noun = guessNumber === 1 ? 'guess' : 'guesses';

              return (
                <li
                  key={`guesses-${guessNumber}`}
                  className={styles.row}
                  aria-label={`Solved in ${guessNumber} ${noun}: ${count}`}
                >
                  <span className={styles.label}>{guessNumber}</span>
                  <span className={styles.bar} style={{ width: `${(count / best) * 100}%` }} />
                  <span className={styles.count}>{count}</span>
                </li>
              );
            })}
          </ol>

          <button
            type="button"
            className={styles.close}
            onClick={() => {
              dialogRef.current?.close();
            }}
          >
            Close
          </button>
        </dialog>
      )}
    </>
  );
};

export default Stats;
