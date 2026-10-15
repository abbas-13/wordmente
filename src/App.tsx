import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import Board from './components/Board';
import GameControls from './components/GameControls';
import Keyboard from './components/Keyboard';
import NextPuzzle from './components/NextPuzzle';
import Result from './components/Result';
import Stats from './components/Stats';
import Toast from './components/Toast';
import allowedGuesses from './data/allowed-guesses.json';
import answers from './data/answers.json';
import { isHardModeLocked } from './game/hardMode';
import { computeKeyboardState } from './game/keyboard';
import { describeOutcome } from './game/outcome';
import { dailyAnswer, puzzleNumberForDate, randomAnswer } from './game/puzzle';
import { nextResetAt } from './game/schedule';
import type { GameSetup, GameState } from './game/state';
import { createGameState, gameReducer } from './game/state';
import { loadStats, recordDailyResult } from './game/stats';
import {
  DAILY_KEY,
  getStorage,
  HARD_MODE_KEY,
  loadHardMode,
  readDaily,
  saveDaily,
  saveHardMode,
  toDailySave,
} from './game/storage';
import type { GameMode } from './game/types';
import { useGameInput } from './hooks/useGameInput';
import { useRevealTimer } from './hooks/useRevealTimer';
import { useToday } from './hooks/useToday';

const dictionary = new Set<string>(allowedGuesses);

interface DailyStart {
  /** An injected setup stands in for a real daily game, so nothing is read or written. */
  setup?: GameSetup;
  storage?: Storage;
  puzzle: number;
  solution: string;
  hardMode: boolean;
}

/**
 * Today's daily board: the saved game when there is one for this puzzle, otherwise a new board.
 */
const startDailyGame = ({ setup, storage, puzzle, solution, hardMode }: DailyStart): GameState => {
  if (setup) {
    return createGameState(setup);
  }

  const fresh = createGameState({ solution, dictionary, mode: 'daily', hardMode });
  const saved = readDaily(storage, { puzzle, solution });
  if (!saved) {
    return fresh;
  }

  return {
    ...fresh,
    guesses: saved.guesses,
    evaluations: saved.evaluations,
    status: saved.status,
  };
};

interface AppProps {
  /** Overrides the daily puzzle; tests inject a known solution. */
  setup?: GameSetup;
}

const App = ({ setup }: AppProps = {}) => {
  /** Resolved once: reaching for storage can throw outright where it is blocked. */
  const [storage] = useState(getStorage);
  const today = useToday();
  const puzzle = puzzleNumberForDate(today);
  const solution = dailyAnswer(answers, today);
  // Stable for as long as the day is, so the countdown is not restarted by a re-render.
  const resetAt = useMemo(() => nextResetAt(today), [today]);
  const [startingHardMode] = useState(() =>
    setup ? (setup.hardMode ?? false) : loadHardMode(storage),
  );
  const [stats, setStats] = useState(() => loadStats(storage));
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  /**
   * One board per mode, with switching only deciding which is on screen.
   *
   * Keeping them apart is what makes an accidental reset impossible: nothing
   * except "New word" ever discards a board, so leaving and returning to the
   * daily puzzle cannot be used to clear a bad guess.
   */
  const [activeMode, setActiveMode] = useState<GameMode>('daily');
  const [daily, dispatchDaily] = useReducer(gameReducer, undefined, () =>
    startDailyGame({ setup, storage, puzzle, solution, hardMode: startingHardMode }),
  );
  const [practice, dispatchPractice] = useReducer(gameReducer, undefined, () =>
    createGameState({
      solution: randomAnswer(answers),
      dictionary,
      mode: 'practice',
      hardMode: startingHardMode,
    }),
  );

  const state = activeMode === 'daily' ? daily : practice;
  const dispatch = activeMode === 'daily' ? dispatchDaily : dispatchPractice;

  const isPlaying = state.status === 'IN_PROGRESS' && !state.isRevealing;
  const outcome = describeOutcome(state);
  const { guesses, evaluations, status, hardMode } = daily;
  const guessCount = guesses.length;
  // The preference is shared, so either board holding a guess in play locks it.
  const hardModeLocked = isHardModeLocked(daily) || isHardModeLocked(practice);
  // A practice round is not what tomorrow waits on, so only the daily counts down.
  const waitingForTomorrow = activeMode === 'daily' && status !== 'IN_PROGRESS';

  const handleLetter = useCallback(
    (letter: string) => {
      dispatch({ type: 'ADD_LETTER', letter });
    },
    [dispatch],
  );
  const handleEnter = useCallback(() => {
    dispatch({ type: 'SUBMIT_GUESS' });
  }, [dispatch]);
  const handleBackspace = useCallback(() => {
    dispatch({ type: 'DELETE_LETTER' });
  }, [dispatch]);
  const handleSelect = useCallback((mode: GameMode) => {
    setActiveMode(mode);
  }, []);
  const handleNewWord = useCallback(() => {
    dispatchPractice({ type: 'START_GAME', mode: 'practice', solution: randomAnswer(answers) });
  }, []);
  const handleSetHardMode = useCallback((next: boolean) => {
    // One preference for the whole app, so both boards are set to the same value.
    dispatchDaily({ type: 'SET_HARD_MODE', hardMode: next });
    dispatchPractice({ type: 'SET_HARD_MODE', hardMode: next });
  }, []);

  const handleKey = useCallback(
    (value: string) => {
      if (value === 'Enter') {
        handleEnter();
        return;
      }
      if (value === 'Backspace') {
        handleBackspace();
        return;
      }
      handleLetter(value);
    },
    [handleEnter, handleBackspace, handleLetter],
  );

  useGameInput({
    onLetter: handleLetter,
    onEnter: handleEnter,
    onBackspace: handleBackspace,
    // The listener is on the window, so it would keep feeding the board behind
    // an open modal unless the dialog's state is accounted for here.
    enabled: isPlaying && !isStatsOpen,
  });

  useRevealTimer(daily.isRevealing, dispatchDaily);
  useRevealTimer(practice.isRevealing, dispatchPractice);

  useEffect(() => {
    if (setup || !storage) {
      return;
    }
    saveDaily(storage, toDailySave({ solution, guesses, evaluations, status }, puzzle));
  }, [setup, storage, puzzle, solution, guesses, evaluations, status]);

  useEffect(() => {
    if (setup || !storage) {
      return;
    }
    saveHardMode(storage, hardMode);
  }, [setup, storage, hardMode]);

  useEffect(() => {
    if (setup || !storage || status === 'IN_PROGRESS') {
      return;
    }
    // Recording is idempotent, so restoring a finished board cannot count it twice.
    setStats(recordDailyResult(storage, { puzzle, status, guesses: guessCount }));
  }, [setup, storage, puzzle, status, guessCount]);

  /**
   * Follow along when another tab changes the saved game.
   *
   * The browser fires this only in the *other* tabs, which is exactly what is
   * needed: a tab whose picture is stale adopts the newer board instead of
   * overwriting it with what it had.
   */
  useEffect(() => {
    if (setup || !storage) {
      return;
    }

    const handleStorage = (event: StorageEvent): void => {
      if (event.key === DAILY_KEY) {
        const saved = readDaily(storage, { puzzle, solution });
        if (saved) {
          dispatchDaily({
            type: 'RESTORE_GAME',
            board: {
              solution: saved.solution,
              guesses: saved.guesses,
              evaluations: saved.evaluations,
              status: saved.status,
            },
          });
        }
        return;
      }

      if (event.key === HARD_MODE_KEY) {
        const preference = loadHardMode(storage);
        dispatchDaily({ type: 'SET_HARD_MODE', hardMode: preference });
        dispatchPractice({ type: 'SET_HARD_MODE', hardMode: preference });
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [setup, storage, puzzle, solution]);

  const startedPuzzle = useRef(puzzle);
  useEffect(() => {
    if (startedPuzzle.current === puzzle) {
      return;
    }
    startedPuzzle.current = puzzle;
    dispatchDaily({ type: 'START_GAME', mode: 'daily', solution });
  }, [puzzle, solution]);

  return (
    <main className="app">
      <header className="app__header">
        <h1>Wordmente</h1>
        <p className="app__puzzle">
          {state.mode === 'daily' ? `Puzzle #${puzzle}` : 'Practice round'}
        </p>
        <div className="app__stats">
          <Stats stats={stats} onOpenChange={setIsStatsOpen} />
        </div>
      </header>

      <GameControls
        mode={state.mode}
        hardMode={state.hardMode}
        hardModeLocked={hardModeLocked}
        onSelect={handleSelect}
        onNewWord={handleNewWord}
        onSetHardMode={handleSetHardMode}
      />

      {outcome ? <Result outcome={outcome} /> : <Toast message={state.message} />}

      {waitingForTomorrow && <NextPuzzle resetAt={resetAt} />}

      <Board
        guesses={state.guesses}
        evaluations={state.evaluations}
        current={state.current}
        isInvalid={state.message !== undefined}
      />

      <Keyboard
        keyStates={computeKeyboardState(state.guesses, state.evaluations)}
        onKey={handleKey}
        disabled={!isPlaying}
      />
    </main>
  );
};

export default App;
