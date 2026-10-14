import { describe, expect, it } from 'vitest';
import type { GameState } from './state';
import { createGameState, currentRowIndex, gameReducer } from './state';

const DICTIONARY = new Set([
  'abide',
  'array',
  'bleak',
  'cable',
  'cease',
  'clove',
  'crane',
  'crate',
  'rebut',
  'slate',
  'speed',
]);

const start = (overrides: Partial<Parameters<typeof createGameState>[0]> = {}): GameState =>
  createGameState({ solution: 'crane', dictionary: DICTIONARY, ...overrides });

const type = (state: GameState, word: string): GameState =>
  [...word].reduce<GameState>(
    (acc, letter) => gameReducer(acc, { type: 'ADD_LETTER', letter }),
    state,
  );

const submit = (state: GameState): GameState => gameReducer(state, { type: 'SUBMIT_GUESS' });

const revealComplete = (state: GameState): GameState =>
  gameReducer(state, { type: 'REVEAL_COMPLETE' });

/** Type a word and submit it, then finish the reveal — the normal play loop. */
const play = (state: GameState, word: string): GameState =>
  revealComplete(submit(type(state, word)));

describe('createGameState', () => {
  it('starts an empty daily game in progress', () => {
    const state = start();
    expect(state.guesses).toEqual([]);
    expect(state.evaluations).toEqual([]);
    expect(state.current).toBe('');
    expect(state.status).toBe('IN_PROGRESS');
    expect(state.hardMode).toBe(false);
    expect(state.isRevealing).toBe(false);
    expect(state.message).toBeUndefined();
    expect(state.mode).toBe('daily');
  });

  it('honours hard mode and mode passed in', () => {
    expect(start({ hardMode: true }).hardMode).toBe(true);
    expect(start({ mode: 'practice' }).mode).toBe('practice');
  });
});

describe('typing letters', () => {
  it('appends letters in lower case', () => {
    expect(type(start(), 'CRANE').current).toBe('crane');
  });

  it('ignores anything that is not a single letter', () => {
    const state = start();
    expect(gameReducer(state, { type: 'ADD_LETTER', letter: '1' })).toBe(state);
    expect(gameReducer(state, { type: 'ADD_LETTER', letter: '!' })).toBe(state);
    expect(gameReducer(state, { type: 'ADD_LETTER', letter: 'ab' })).toBe(state);
  });

  it('stops accepting letters once the row is full', () => {
    expect(type(start(), 'cranee').current).toBe('crane');
  });

  it('deletes the last letter', () => {
    expect(gameReducer(type(start(), 'cra'), { type: 'DELETE_LETTER' }).current).toBe('cr');
  });

  it('does nothing when there is nothing to delete', () => {
    const state = start();
    expect(gameReducer(state, { type: 'DELETE_LETTER' })).toBe(state);
  });

  it('keeps a rejected row on screen so it can be corrected', () => {
    const rejected = submit(type(start(), 'zzzzz'));
    expect(rejected.current).toBe('zzzzz');
  });

  it('clears a previous message on the next edit', () => {
    const rejected = submit(type(start(), 'zzzzz'));
    expect(rejected.message).toBe('Not in word list');
    // The row is full after a rejection, so the next edit is a deletion.
    expect(gameReducer(rejected, { type: 'DELETE_LETTER' }).message).toBeUndefined();
  });
});

describe('submitting a guess', () => {
  it('rejects a short word without submitting the row', () => {
    const state = submit(type(start(), 'cran'));
    expect(state.message).toBe('Not enough letters');
    expect(state.guesses).toEqual([]);
    expect(state.current).toBe('cran');
  });

  it('rejects a word that is not in the dictionary', () => {
    const state = submit(type(start(), 'zzzzz'));
    expect(state.message).toBe('Not in word list');
    expect(state.guesses).toEqual([]);
  });

  it('accepts the solution even when it is not in the dictionary', () => {
    const state = start({ solution: 'spelt' });
    expect(play(state, 'spelt').status).toBe('WIN');
  });

  it('records the guess and its evaluations, then clears the row', () => {
    const state = submit(type(start(), 'slate'));
    expect(state.guesses).toEqual(['slate']);
    expect(state.evaluations).toEqual([['absent', 'absent', 'correct', 'absent', 'correct']]);
    expect(state.current).toBe('');
    expect(state.message).toBeUndefined();
  });

  it('marks the row as revealing until the reveal completes', () => {
    const submitted = submit(type(start(), 'slate'));
    expect(submitted.isRevealing).toBe(true);
    expect(play(start(), 'slate').isRevealing).toBe(false);
  });

  it('ignores further input while the row is revealing', () => {
    const submitted = submit(type(start(), 'slate'));
    expect(gameReducer(submitted, { type: 'ADD_LETTER', letter: 'c' })).toBe(submitted);
    expect(submit(submitted)).toBe(submitted);
  });
});

describe('game status', () => {
  it('wins when the guess matches the solution', () => {
    expect(play(start(), 'crane').status).toBe('WIN');
  });

  it('loses after six guesses without a win', () => {
    let state = start();
    for (const word of ['abide', 'bleak', 'clove', 'cease', 'array', 'speed']) {
      state = play(state, word);
    }
    expect(state.guesses).toHaveLength(6);
    expect(state.status).toBe('FAIL');
  });

  it('stays in progress while guesses remain', () => {
    expect(play(start(), 'abide').status).toBe('IN_PROGRESS');
  });

  it('ignores input once the game is finished', () => {
    const won = play(start(), 'crane');
    expect(gameReducer(won, { type: 'ADD_LETTER', letter: 'c' })).toBe(won);
    expect(gameReducer(won, { type: 'DELETE_LETTER' })).toBe(won);
    expect(submit(type(won, 'abide'))).toBe(won);
  });
});

describe('hard mode', () => {
  it('allows a guess that ignores revealed letters when hard mode is off', () => {
    const state = play(start(), 'rebut');
    expect(play(state, 'cable').guesses).toEqual(['rebut', 'cable']);
  });

  it('requires a revealed letter to be replayed in position', () => {
    const state = play(start({ hardMode: true }), 'crate');
    const rejected = submit(type(state, 'clove'));
    expect(rejected.message).toBe('2nd letter must be R');
    expect(rejected.guesses).toEqual(['crate']);
  });

  it('requires revealed letters to be present in the guess', () => {
    const state = play(start({ hardMode: true }), 'rebut');
    const rejected = submit(type(state, 'cable'));
    expect(rejected.message).toBe('Guess must contain R');
    expect(rejected.guesses).toEqual(['rebut']);
  });

  it('accepts a hard-mode-conforming guess', () => {
    const state = play(start({ hardMode: true }), 'rebut');
    // 'crate' carries both revealed letters (r and e) and breaks no position rule
    expect(play(state, 'crate').guesses).toEqual(['rebut', 'crate']);
  });

  it('toggles', () => {
    const state = start();
    expect(gameReducer(state, { type: 'TOGGLE_HARD_MODE' }).hardMode).toBe(true);
    expect(
      gameReducer(gameReducer(state, { type: 'TOGGLE_HARD_MODE' }), { type: 'TOGGLE_HARD_MODE' })
        .hardMode,
    ).toBe(false);
  });
});

describe('starting a game', () => {
  it('switches mode and solution, clearing the board but keeping hard mode', () => {
    const played = play(start({ hardMode: true }), 'abide');
    const next = gameReducer(played, {
      type: 'START_GAME',
      mode: 'practice',
      solution: 'elder',
    });

    expect(next.mode).toBe('practice');
    expect(next.solution).toBe('elder');
    expect(next.guesses).toEqual([]);
    expect(next.evaluations).toEqual([]);
    expect(next.current).toBe('');
    expect(next.status).toBe('IN_PROGRESS');
    expect(next.isRevealing).toBe(false);
    expect(next.message).toBeUndefined();
    expect(next.hardMode).toBe(true);
  });

  it('keeps the dictionary', () => {
    const next = gameReducer(start(), { type: 'START_GAME', mode: 'practice', solution: 'elder' });
    expect(next.dictionary).toBe(DICTIONARY);
  });

  it('starts a fresh game after one has finished', () => {
    const won = play(start(), 'crane');
    const next = gameReducer(won, { type: 'START_GAME', mode: 'daily', solution: 'crane' });
    expect(next.status).toBe('IN_PROGRESS');
    expect(next.guesses).toEqual([]);
  });
});

describe('currentRowIndex', () => {
  it('follows the number of submitted guesses', () => {
    expect(currentRowIndex(start())).toBe(0);
    expect(currentRowIndex(play(start(), 'abide'))).toBe(1);
    expect(currentRowIndex(play(play(start(), 'abide'), 'bleak'))).toBe(2);
  });
});
