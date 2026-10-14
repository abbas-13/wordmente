/**
 * Game constants.
 *
 * Word length and guess count are the two numbers the rule engine is built
 * around; the alphabet drives ordering of any generated keyboard.
 */

export const WORD_LENGTH = 5;

export const MAX_GUESSES = 6;

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** Keyboard row layout, top row first. */
export const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as const;
