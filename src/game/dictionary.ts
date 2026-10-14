/**
 * Guess validation against the bundled dictionary.
 *
 * A guess is accepted when it is in the dictionary, or when it happens to be the
 * solution itself — the second clause is why an unusual answer is never rejected
 * as "not in word list".
 */
export function isValidGuess(
  guess: string,
  solution: string,
  dictionary: ReadonlySet<string> | readonly string[],
): boolean {
  if (guess === solution) return true;
  if (guess.length === 0) return false;
  return 'has' in dictionary ? dictionary.has(guess) : dictionary.includes(guess);
}
