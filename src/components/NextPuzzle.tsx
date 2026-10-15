import { useEffect, useState } from 'react';

import { formatRemaining } from '../game/schedule';
import styles from './NextPuzzle.module.css';

/** How often the countdown refreshes. Nothing finer than a minute is shown. */
const TICK_MS = 30_000;

interface NextPuzzleProps {
  /** The moment the next daily becomes playable. */
  resetAt: Date;
}

/**
 * How long until tomorrow's word.
 *
 * Deliberately not inside the result's live region: a countdown that announces
 * itself every half minute would talk over everything else a screen reader is
 * reading.
 */
const NextPuzzle = ({ resetAt }: NextPuzzleProps) => {
  const [remaining, setRemaining] = useState(() => resetAt.getTime() - Date.now());

  useEffect(() => {
    const tick = (): void => {
      setRemaining(resetAt.getTime() - Date.now());
    };

    tick();
    const interval = window.setInterval(tick, TICK_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [resetAt]);

  const resetsAt = resetAt.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className={styles.next}>
      <p className={styles.countdown}>
        Next puzzle in <strong>{formatRemaining(remaining)}</strong>
      </p>
    </div>
  );
};

export default NextPuzzle;
