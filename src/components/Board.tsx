import { MAX_GUESSES, WORD_LENGTH } from '../game/constants';
import type { Evaluation } from '../game/types';
import styles from './Board.module.css';
import type { TileState } from './Tile';
import Tile from './Tile';

interface BoardProps {
  /** Submitted guesses, oldest first. */
  guesses: string[];
  /** Evaluations aligned with `guesses`. */
  evaluations: Evaluation[][];
  /** Letters typed for the row in progress. */
  current: string;
  /** Marks the row in progress as rejected. */
  isInvalid?: boolean;
}

interface Cell {
  /** Stable identity for the cell's fixed grid position. */
  key: string;
  letter: string;
  state: TileState;
}

/** The board never reorders, so each grid position has a fixed identity. */
const ROW_KEYS = Array.from({ length: MAX_GUESSES }, (_, index) => `row-${index}`);
const COLUMN_KEYS = Array.from({ length: WORD_LENGTH }, (_, index) => `column-${index}`);

const emptyRow: Cell[] = COLUMN_KEYS.map((key) => ({ key, letter: '', state: 'empty' }));

const submittedRow = (guess: string, evaluations: Evaluation[]): Cell[] =>
  COLUMN_KEYS.map((key, column) => ({
    key,
    letter: guess[column] ?? '',
    state: evaluations[column] ?? 'empty',
  }));

const typingRow = (current: string): Cell[] =>
  COLUMN_KEYS.map((key, column) => {
    const letter = current[column] ?? '';
    return { key, letter, state: letter === '' ? 'empty' : 'typing' };
  });

/** Submitted rows show their evaluation, the active row is being typed, the rest are empty. */
const cellsForRow = (
  rowIndex: number,
  guesses: string[],
  evaluations: Evaluation[][],
  current: string,
  activeRow: number,
): Cell[] => {
  const guess = guesses[rowIndex];
  const rowEvaluations = evaluations[rowIndex];
  if (guess && rowEvaluations) {
    return submittedRow(guess, rowEvaluations);
  }
  if (rowIndex === activeRow) {
    return typingRow(current);
  }
  return emptyRow;
};

/** Only a submitted row of all-correct tiles can be the solved one. */
const isSolved = (guess: string | undefined, evaluations: Evaluation[] | undefined): boolean =>
  Boolean(guess && evaluations?.every((evaluation) => evaluation === 'correct'));

const Board = ({ guesses, evaluations, current, isInvalid = false }: BoardProps) => {
  const activeRow = guesses.length;

  return (
    <table className={styles.board} aria-label="Game board">
      <tbody>
        {ROW_KEYS.map((rowKey, rowIndex) => (
          <tr
            className={styles.row}
            key={rowKey}
            data-invalid={rowIndex === activeRow && isInvalid ? 'true' : undefined}
            data-win={isSolved(guesses[rowIndex], evaluations[rowIndex]) ? 'true' : undefined}
          >
            {cellsForRow(rowIndex, guesses, evaluations, current, activeRow).map((cell) => (
              <Tile key={cell.key} letter={cell.letter} state={cell.state} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Board;
