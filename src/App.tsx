import { useCallback, useEffect, useReducer } from 'react';

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
import type { GameSetup } from './game/state';
import { createGameState, gameReducer } from './game/state';
import type { GameMode } from './game/types';
import { useGameInput } from './hooks/useGameInput';

/** How long input stays blocked after a guess. Keep in step with the tile flip in CSS. */
const REVEAL_DURATION_MS = 400;

const dictionary = new Set<string>(allowedGuesses);

/** Today's word, or a fresh draw for practice. */
const solutionFor = (mode: GameMode): string =>
  mode === 'daily' ? dailyAnswer(answers, new Date()) : randomAnswer(answers);

const setUpDailyGame = (): GameSetup => ({
  solution: solutionFor('daily'),
  dictionary,
  mode: 'daily',
});

interface AppProps {
  /** Overrides the daily puzzle; tests inject a known solution. */
  setup?: GameSetup;
}

const App = ({ setup }: AppProps = {}) => {
  const [state, dispatch] = useReducer(gameReducer, setup ?? setUpDailyGame(), createGameState);

  const isPlaying = state.status === 'IN_PROGRESS' && !state.isRevealing;
  const outcome = describeOutcome(state);

  const handleLetter = useCallback((letter: string) => {
    dispatch({ type: 'ADD_LETTER', letter });
  }, []);
  const handleEnter = useCallback(() => {
    dispatch({ type: 'SUBMIT_GUESS' });
  }, []);
  const handleBackspace = useCallback(() => {
    dispatch({ type: 'DELETE_LETTER' });
  }, []);
  const handleStart = useCallback((mode: GameMode) => {
    dispatch({ type: 'START_GAME', mode, solution: solutionFor(mode) });
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

  useEffect(() => {
    if (!state.isRevealing) {
      return;
    }
    const timeout = window.setTimeout(() => {
      dispatch({ type: 'REVEAL_COMPLETE' });
    }, REVEAL_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state.isRevealing]);

  return (
    <main className="app">
      <header className="app__header">
        <h1>Wordmente</h1>
        <p className="app__puzzle">
          {state.mode === 'daily' ? `Puzzle #${puzzleNumberForDate(new Date())}` : 'Practice round'}
        </p>
      </header>

      <GameControls mode={state.mode} onStart={handleStart} />

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
