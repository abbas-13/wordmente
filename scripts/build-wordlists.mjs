#!/usr/bin/env node
/**
 * Regenerates the bundled word data:
 *
 *   src/data/allowed-guesses.json  — the validation dictionary
 *   src/data/answers.json          — the curated pool of daily solutions
 *
 * Provenance:
 *   The dictionary is extracted from NYT's shipped Wordle bundle. The game
 *   fetches its solution per date from an API, so only the validation list is
 *   present in the bundle — which is why the answer pool is curated here by
 *   intersecting that dictionary with an English word-frequency list.
 *
 * Usage:
 *   node scripts/build-wordlists.mjs /path/to/wordle.bundle.js
 *
 * The bundle path may also come from $WORDLE_BUNDLE.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Anchor for the embedded dictionary: the list starts with these two words. */
const DICTIONARY_ANCHOR = '["aahed","aalii"';

/** How many answers to keep, at most. */
const MAX_ANSWERS = 2300;

/** Frequency sources, tried in order. First one that responds wins. */
const FREQUENCY_SOURCES = [
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt',
  'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english.txt',
];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolve(root, 'src/data');

/** Extract the embedded five-letter dictionary from a minified bundle. */
const extractDictionary = (bundleSource) => {
  const start = bundleSource.indexOf(DICTIONARY_ANCHOR);
  if (start === -1) {
    throw new Error(`dictionary anchor not found (${DICTIONARY_ANCHOR}) — wrong bundle?`);
  }
  const end = bundleSource.indexOf(']', start);
  if (end === -1) {
    throw new Error('unterminated dictionary array in bundle');
  }
  const words = JSON.parse(bundleSource.slice(start, end + 1));
  if (!Array.isArray(words) || words.length === 0) {
    throw new Error('parsed dictionary is empty');
  }
  return words;
};

/** Fetch a frequency list and return its words, most frequent first. */
const fetchFrequencyWords = async () => {
  const errors = [];
  for (const url of FREQUENCY_SOURCES) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();
      // Both sources are "word count" lines, or a bare word per line.
      const words = text
        .split('\n')
        .map((line) => line.trim().split(/\s+/)[0] ?? '')
        .filter(Boolean);
      if (words.length > 1000) {
        return { url, words };
      }
      errors.push(`${url}: only ${words.length} words`);
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }
  throw new Error(`no frequency list available:\n  ${errors.join('\n  ')}`);
};

/**
 * Deterministic shuffle.
 *
 * Without this the answer pool stays in alphabetical order, so the daily word
 * would run aargh, abbey, abbot, abide... The seed keeps it stable across builds
 * and machines, so everyone still gets the same word on the same day.
 */
const shuffleDeterministically = (values) => {
  const shuffled = [...values];
  let state = 0x9e3779b9 | 0;
  const nextRandom = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom() * (i + 1));
    const a = shuffled[i];
    const b = shuffled[j];
    shuffled[i] = b;
    shuffled[j] = a;
  }
  return shuffled;
};

/** Curate the answer pool: common five-letter words that exist in the dictionary. */
const curateAnswers = (frequencyWords, allowed) => {
  const allowedSet = new Set(allowed);
  const answers = [];
  const seen = new Set();
  for (const word of frequencyWords) {
    if (answers.length >= MAX_ANSWERS) {
      break;
    }
    const candidate = word.toLowerCase();
    if (candidate.length !== 5 || !/^[a-z]+$/.test(candidate)) {
      continue;
    }
    if (!allowedSet.has(candidate) || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    answers.push(candidate);
  }
  return shuffleDeterministically(answers);
};

const main = async () => {
  const bundlePath = process.argv[2] ?? process.env.WORDLE_BUNDLE;
  if (!bundlePath) {
    throw new Error('usage: node scripts/build-wordlists.mjs /path/to/wordle.bundle.js');
  }

  const bundleSource = await readFile(bundlePath, 'utf8');
  const allowed = extractDictionary(bundleSource).map((word) => String(word).toLowerCase());
  if (new Set(allowed).size !== allowed.length) {
    console.warn('note: dictionary contained duplicates');
  }

  const { url, words } = await fetchFrequencyWords();
  const answers = curateAnswers(words, allowed);

  await mkdir(dataDir, { recursive: true });
  await writeFile(
    resolve(dataDir, 'allowed-guesses.json'),
    `${JSON.stringify(allowed, null, 0)}\n`,
  );
  await writeFile(resolve(dataDir, 'answers.json'), `${JSON.stringify(answers, null, 0)}\n`);

  console.log(`bundle        ${bundlePath}`);
  console.log(`frequency     ${url}`);
  console.log(`allowed       ${allowed.length} words -> src/data/allowed-guesses.json`);
  console.log(`answers       ${answers.length} words -> src/data/answers.json`);
  console.log(
    `sums to 5?    ${allowed.every((w) => w.length === 5) ? 'all dictionary words' : 'NO'}`,
  );
  console.log(`first answers ${answers.slice(0, 12).join(' ')}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
