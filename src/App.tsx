import { useCallback, useEffect, useReducer } from 'react';

import Board from './components/Board';
import Keyboard from './components/Keyboard';
import allowedGuesses from './data/allowed-guesses.json';
import answers from './data/answers.json';
import { computeKeyboardState } from './game/keyboard';
import { dailyAnswer } from './game/puzzle';
import type { GameSetup } from './game/state';
import { createGameState, gameReducer } from './game/state';
import { useGameInput } from './hooks/useGameInput';

/** How long input stays blocked after a guess. Keep in step with the tile flip in CSS. */
const REVEAL_DURATION_MS = 400;

const dictionary = new Set<string>(allowedGuesses);

const setUpDailyGame = (): GameSetup => ({
  solution: dailyAnswer(answers, new Date()),
  dictionary,
});

interface AppProps {
  /** Overrides the daily puzzle; tests inject a known solution. */
  setup?: GameSetup;
}

const App = ({ setup }: AppProps = {}) => {
  const [state, dispatch] = useReducer(gameReducer, setup ?? setUpDailyGame(), createGameState);

  const isPlaying = state.status === 'IN_PROGRESS' && !state.isRevealing;

  const handleLetter = useCallback((letter: string) => {
    dispatch({ type: 'ADD_LETTER', letter });
  }, []);
  const handleEnter = useCallback(() => {
    dispatch({ type: 'SUBMIT_GUESS' });
  }, []);
  const handleBackspace = useCallback(() => {
    dispatch({ type: 'DELETE_LETTER' });
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
      </header>

      <Board
        guesses={state.guesses}
        evaluations={state.evaluations}
        current={state.current}
        isInvalid={state.message !== undefined}
      />

      <p className="app__status" role="status">
        {state.message || null}
      </p>

      <Keyboard
        keyStates={computeKeyboardState(state.guesses, state.evaluations)}
        onKey={handleKey}
        disabled={!isPlaying}
      />
    </main>
  );
};

export default App;
