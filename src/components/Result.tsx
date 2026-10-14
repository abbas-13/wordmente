import type { Outcome } from '../game/outcome';
import styles from './Result.module.css';

interface ResultProps {
  outcome: Outcome;
}

/**
 * End-of-game message.
 *
 * It shares the `status` role with the toast by never being on screen at the
 * same time: a finished game accepts no input, so no rejection can follow.
 */
const Result = ({ outcome }: ResultProps) => (
  <div className={styles.result} role="status">
    <p className={styles.title}>{outcome.title}</p>
    <p className={styles.detail}>{outcome.detail}</p>
  </div>
);

export default Result;
