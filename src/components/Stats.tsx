import { useState } from 'react';

import { MAX_GUESSES } from '../game/constants';
import type { Stats as StatsData } from '../game/stats';
import { winPercent } from '../game/stats';
import styles from './Stats.module.css';

/** The guess counts, in the order the distribution stores them. */
const GUESS_NUMBERS = Array.from({ length: MAX_GUESSES }, (_, index) => index + 1);

interface StatsProps {
  stats: StatsData;
}

/**
 * The tally, folded away behind a toggle.
 *
 * It stays closed until asked for so finishing a game does not move the page
 * under a player who is still reading the board.
 */
const Stats = ({ stats }: StatsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const best = Math.max(...stats.distribution, 1);

  return (
    <div className={styles.stats}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        Statistics
      </button>

      {isOpen && (
        <section className={styles.panel} aria-label="Statistics">
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

          <h2 className={styles.heading}>Guess distribution</h2>
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
        </section>
      )}
    </div>
  );
};

export default Stats;
