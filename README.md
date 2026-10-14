# Wordmente

A from-scratch Wordle replica. Own word data, own daily puzzle, **no third-party
calls at runtime**.

## What this is

Wordle's mechanics, rebuilt and understood — not copied. The rule engine was
recovered by reading the shipped NYT bundle and then reimplementing the behaviour
in clean TypeScript (`src/game/`). See [Provenance](#provenance) for exactly what
came from where and the reasoning behind each decision.

## Stack

- **TypeScript + React + Vite** — the same shape as the original (React app, CSS
  Modules, pure logic module separate from the UI).
- **Vitest** for unit tests, **Biome** for lint/format, **GitHub Actions** for CI.

## Commands

```bash
npm install        # install dependencies
npm run dev        # local dev server
npm test           # run the unit tests
npm run lint       # lint + format check
npm run typecheck  # types only
npm run build      # production build into dist/
npm run words      # regenerate the word lists (see below)
```

## Word data

Two lists, both bundled, neither fetched at runtime:

| File | Size | Role |
|---|---|---|
| `src/data/allowed-guesses.json` | 14,928 words | Validation — a guess must be in here (or be the solution) |
| `src/data/answers.json` | curated | The pool the daily solution is drawn from |

`npm run words` regenerates both. It needs a copy of the shipped game bundle:

```bash
curl -o /tmp/wordle.js 'https://www.nytimes.com/games-assets/v2/wordle.<hash>.js'   # entry point
node scripts/build-wordlists.mjs /tmp/wordle.js
```

The script extracts the embedded dictionary, then curates the answer list by
intersecting it with an English word-frequency list, so answers are plausible
common words rather than obscure dictionary entries. The curated list is then
deterministically shuffled (fixed seed), so the daily word varies instead of
running alphabetically while staying identical on every machine.

## The daily puzzle

Derived from the date, not fetched:

```
index  = daysBetween(epoch, date)
answer = answers[index % answers.length]
```

`epoch` is configurable (`src/game/puzzle.ts`). Because the answer is a pure
function of the date, every player sees the same word on the same day with no
server involved. Practice mode picks a random answer instead.

## Provenance

- **Rule engine** — recovered from `450.*.js` in NYT's shipped bundle
  (module `95280`), which contains the scoring, keyboard-state, hard-mode,
  dictionary-validation, date-epoch and ordinal helpers as pure functions. Those
  behaviours are reimplemented here, with tests that encode them.
- **Validation dictionary** — extracted from that same bundle.
- **Answer list** — ours, curated by frequency ranking, so the clone does not
  depend on NYT's answer schedule.
- **No runtime dependency on any NYT endpoint.** Nothing is fetched while the
  game runs.

## Status

Milestone 1 — rule engine, word data, tests, lint, CI. The interactive board and
keyboard (milestone 2) are next.
