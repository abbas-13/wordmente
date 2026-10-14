import { KEYBOARD_ROWS, MAX_GUESSES, WORD_LENGTH } from './game/constants';

/**
 * Milestone 1 placeholder.
 *
 * The rule engine, word data, tests and CI are in place; this only renders the
 * shell so the project builds and runs. The interactive board and keyboard are
 * milestone 2.
 */
export default function App() {
  return (
    <main className="app">
      <header className="app__header">
        <h1>Wordmente</h1>
        <p className="app__subtitle">Milestone 1 — rule engine in place, board coming next.</p>
      </header>

      {/* Static placeholder — milestone 2 swaps this for an interactive grid
          with proper role="grid"/"row"/"gridcell" semantics. */}
      <div className="board">
        {Array.from({ length: MAX_GUESSES }, (_, row) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and never reordered
          <div className="board__row" key={row}>
            {Array.from({ length: WORD_LENGTH }, (_, column) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: tiles are positional and never reordered
              <div className="tile" key={column} data-state="empty" />
            ))}
          </div>
        ))}
      </div>

      <div className="keyboard" aria-hidden="true">
        {KEYBOARD_ROWS.map((row) => (
          <div className="keyboard__row" key={row}>
            {[...row].map((letter) => (
              <span className="key" key={letter}>
                {letter}
              </span>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
