/**
 * The daily puzzle is derived from the date, never fetched.
 *
 * `index = daysBetween(epoch, date)`, `answer = answers[index % answers.length]`
 *
 * The epoch is the only thing that has to be agreed on: every player computing
 * the same date gets the same word, with no server and no network call. Adjust
 * `GAME_EPOCH` to renumber the calendar.
 */

/** Day one of the puzzle calendar. Date-only; the time component is ignored. */
export const GAME_EPOCH = new Date(2021, 5, 19);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Midnight UTC of a date's calendar day, so DST and clock time cannot skew the index. */
const startOfDay = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

/** Puzzle number for a date. Day one is 0. */
export const puzzleIndexForDate = (date: Date, epoch: Date = GAME_EPOCH): number =>
  Math.floor((startOfDay(date) - startOfDay(epoch)) / MS_PER_DAY);

/** Calendar date of a puzzle number — the inverse of {@link puzzleIndexForDate}. */
export const dateForPuzzleIndex = (index: number, epoch: Date = GAME_EPOCH): Date => {
  const epochMidnight = startOfDay(epoch);
  return new Date(epochMidnight + index * MS_PER_DAY);
};

/** The solution for a given date. Deterministic, so it is identical for everyone. */
export const dailyAnswer = (
  answers: readonly string[],
  date: Date,
  epoch: Date = GAME_EPOCH,
): string => {
  if (answers.length === 0) {
    throw new Error('answer list is empty');
  }
  const index = puzzleIndexForDate(date, epoch);
  const wrapped = ((index % answers.length) + answers.length) % answers.length;
  return answers[wrapped] as string;
};

/** A random answer, for practice mode. */
export const randomAnswer = (
  answers: readonly string[],
  random: () => number = Math.random,
): string => {
  if (answers.length === 0) {
    throw new Error('answer list is empty');
  }
  return answers[Math.floor(random() * answers.length)] as string;
};
