import { useCallback, useReducer, useState } from "react";

import Board from "./components/Board";
import GameControls from "./components/GameControls";
import Keyboard from "./components/Keyboard";
import Result from "./components/Result";
import Toast from "./components/Toast";
import allowedGuesses from "./data/allowed-guesses.json";
import answers from "./data/answers.json";
import { computeKeyboardState } from "./game/keyboard";
import { describeOutcome } from "./game/outcome";
import { dailyAnswer, puzzleNumberForDate, randomAnswer } from "./game/puzzle";
import type { GameSetup, GameState } from "./game/state";
import { createGameState, gameReducer } from "./game/state";
import type { GameMode } from "./game/types";
import { useGameInput } from "./hooks/useGameInput";
import { useRevealTimer } from "./hooks/useRevealTimer";

const dictionary = new Set<string>(allowedGuesses);

const setUpDailyGame = (): GameSetup => ({
  solution: dailyAnswer(answers, new Date()),
  dictionary,
  mode: "daily",
});

const setUpPracticeGame = (): GameState =>
  createGameState({
    solution: randomAnswer(answers),
    dictionary,
    mode: "practice",
  });

interface AppProps {
  /** Overrides the daily puzzle; tests inject a known solution. */
  setup?: GameSetup;
}

const App = ({ setup }: AppProps = {}) => {
  /**
   * One board per mode, with switching only deciding which is on screen.
   *
   * Keeping them apart is what makes an accidental reset impossible: nothing
   * except "New word" ever discards a board, so leaving and returning to the
   * daily puzzle cannot be used to clear a bad guess.
   */
  const [activeMode, setActiveMode] = useState<GameMode>("daily");
  const [daily, dispatchDaily] = useReducer(
    gameReducer,
    setup ?? setUpDailyGame(),
    createGameState,
  );
  const [practice, dispatchPractice] = useReducer(
    gameReducer,
    undefined,
    setUpPracticeGame,
  );

  const state = activeMode === "daily" ? daily : practice;
  const dispatch = activeMode === "daily" ? dispatchDaily : dispatchPractice;

  const isPlaying = state.status === "IN_PROGRESS" && !state.isRevealing;
  const outcome = describeOutcome(state);

  const handleLetter = useCallback(
    (letter: string) => {
      dispatch({ type: "ADD_LETTER", letter });
    },
    [dispatch],
  );
  const handleEnter = useCallback(() => {
    dispatch({ type: "SUBMIT_GUESS" });
  }, [dispatch]);
  const handleBackspace = useCallback(() => {
    dispatch({ type: "DELETE_LETTER" });
  }, [dispatch]);
  const handleSelect = useCallback((mode: GameMode) => {
    setActiveMode(mode);
  }, []);
  const handleNewWord = useCallback(() => {
    dispatchPractice({
      type: "START_GAME",
      mode: "practice",
      solution: randomAnswer(answers),
    });
  }, []);
  const handleSetHardMode = useCallback((hardMode: boolean) => {
    // One preference for the whole app, so both boards are set to the same value.
    dispatchDaily({ type: "SET_HARD_MODE", hardMode });
    dispatchPractice({ type: "SET_HARD_MODE", hardMode });
  }, []);

  const handleKey = useCallback(
    (value: string) => {
      if (value === "Enter") {
        handleEnter();
        return;
      }
      if (value === "Backspace") {
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

  return (
    <main className="app">
      <header className="app__header">
        <h1>Wordmente</h1>
        <p className="app__puzzle">
          {state.mode === "daily"
            ? `Puzzle #${puzzleNumberForDate(new Date())}`
            : "Practice round"}
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

      {outcome ? (
        <Result outcome={outcome} />
      ) : (
        <Toast message={state.message} />
      )}

      <Keyboard
        keyStates={computeKeyboardState(state.guesses, state.evaluations)}
        onKey={handleKey}
        disabled={!isPlaying}
      />
    </main>
  );
};

export default App;
