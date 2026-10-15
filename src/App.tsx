import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import Board from './components/Board';
import GameControls from './components/GameControls';
import Keyboard from './components/Keyboard';
import Result from './components/Result';
import Toast from './components/Toast';
import allowedGuesses from './data/allowed-guesses.json';
import answers from './data/answers.json';
import { computeKeyboardState } from './game/keyboard';
import { describeOutcome } from './game/outcome';
import { dailyAnswer, puzzleNumberForDate, randomAnswer } from './game/puzzle';
import type { GameSetup, GameState } from './game/state';
import { createGameState, gameReducer } from './game/state';
import {
  getStorage,
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
  const [startingHardMode] = useState(() =>
    setup ? (setup.hardMode ?? false) : loadHardMode(storage),
  );

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
    enabled: isPlaying,
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
      </header>

      <GameControls
        mode={state.mode}
        hardMode={state.hardMode}
        onSelect={handleSelect}
        onNewWord={handleNewWord}
        onSetHardMode={handleSetHardMode}
      />

      <Board
        guesses={state.guesses}
        evaluations={state.evaluations}
        current={state.current}
        isInvalid={state.message !== undefined}
      />

      {outcome ? <Result outcome={outcome} /> : <Toast message={state.message} />}

      <Keyboard
        keyStates={computeKeyboardState(state.guesses, state.evaluations)}
        onKey={handleKey}
        disabled={!isPlaying}
      />
    </main>
  );
};

export default App;
