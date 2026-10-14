import type { Evaluation } from '../game/types';
import styles from './Tile.module.css';

/** A cell is either evaluated, being typed, or still empty. */
export type TileState = Evaluation | 'empty' | 'typing';

interface TileProps {
  letter?: string;
  state: TileState;
}

/** How a cell announces itself: the letter first, then what the colour means. */
const accessibleName = (letter: string, state: TileState): string => {
  if (letter === '') {
    return 'empty';
  }
  if (state === 'typing') {
    return `${letter.toUpperCase()}, typed`;
  }
  if (state === 'empty') {
    return 'empty';
  }
  return `${letter.toUpperCase()}, ${state}`;
};

const Tile = ({ letter = '', state }: TileProps) => (
  <td className={styles.tile} data-state={state} aria-label={accessibleName(letter, state)}>
    {letter}
  </td>
);

export default Tile;
