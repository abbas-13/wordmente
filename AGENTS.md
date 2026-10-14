# Agent rules — absolute

These rules override framework defaults, your own preferences, and any pattern
you happen to find in the codebase. Where a rule cannot be followed for a
specific case, **stop and ask** — do not work around it silently and do not
"improve" it.

**When you are unsure, ask before acting — not after.** Uncertainty is not limited
to rule conflicts. Confirm first whenever:

- **Ownership is unclear** — a process, port, file or branch you did not create
  and cannot attribute with certainty.
- **Scope is ambiguous** — "the changes", "all the files", "commit it". Say what
  you believe is included and get that confirmed, rather than choosing the
  reading that is most convenient to you.
- **You would be guessing at intent**, including when the request seems to have an
  obvious purpose behind it.
- **The action is destructive or awkward to reverse** — deletes, history writes,
  unrequested permission or mode changes, anything touching a running
  environment.
- **A file falls outside the stated task**, even when the change looks obviously
  correct.

Reporting an assumption *afterwards* is not confirmation. Being transparent about
a decision you have already made is not the same as having asked.

One deliberate limit, so that the questions stay worth answering: **when you can
verify cheaply, verify instead of asking.** A test, a probe or a read-only check
that settles the question beats a question the owner has to answer. Asking is for
what you genuinely cannot determine yourself — not a substitute for
investigating, and not a reason to stop working.

This file is committed and shared: it is the single source of truth for every
agent, whatever tool runs it.

---

## 1. Never commit without confirmation

Do not run `git commit`, `git push`, or any other command that writes to history.
Do not run `git reset --hard`, `git checkout -- .`, `git rebase`, or anything else
that discards work.

Make the changes, leave them in the working tree, and tell the owner **what to
review in their editor**. They confirm; then you commit.

Check the working tree before and after anything git-related. Uncommitted work is
easy to destroy and impossible to recover.

---

## 2. Specify the behaviour in tests before writing the component

For every component, module or endpoint, in this order:

1. **Plan what it should do.** Work out its expected behaviour before writing any
   of it — inputs, outputs, edge cases, failure cases, and what a caller observes.
2. **Write the tests that express that behaviour.** The tests are the
   specification. Write them as if the component already worked correctly: they
   should pass unchanged once the implementation is right.
3. **Then write the implementation** so those tests pass.

The direction of adaptation is one-way: **the code is written to satisfy the
tests, never the tests to accommodate the code.** That is the whole point of
writing them first — a test authored from the requirement, before any
implementation exists, cannot have been shaped to fit the implementation.

When a test then fails, the implementation is wrong until proven otherwise; see
rule 9. Tweaking a test to reach green defeats the purpose of having written it
first.

A component is not finished until it has a test that would fail if its behaviour
changed. A reusable UI component also needs a story in the project's component
explorer, if one is configured.

---

## 3. Braces on every statement block, without exception

```ts
// yes
if (ready) {
  start();
}

for (const item of items) {
  handle(item);
}

// no
if (ready) start();
for (const item of items) handle(item);
```

One statement or ten, braces always, body on its own line. Same for `else`,
`for`, `while`, `do` and `case`.

**A block here is the statement body of a control-flow construct** — the one place
braces are syntactically optional, which is exactly why the rule has to demand
them. It does **not** mean a function body.

```ts
const double = (x: number) => x * 2; // concise body — an expression, not a block
const apply = (x: number) => {
  // block body — a block, so this rule applies
  log(x);
  return double(x);
};
```

- A **concise body** has no braces to add. Adding them is not formatting but a
  behaviour change: the expression becomes a statement and the return is lost.
  `(x) => x * 2` returns `6`; `(x) => { x * 2; }` returns `undefined`. An arrow
  whose job is to return an expression therefore stays brace-free — that is rule
  4's territory, not this rule's.
- A **block body** is a block, so this rule applies to it. But if it exists only
  to `return` a single expression, drop the braces and the `return` rather than
  keeping a one-line block.

If the linter can rewrite this, let it — but scope the fix to that single rule so
no unrelated unsafe fix is applied in the same pass.

---

## 4. Arrow functions, unless the other form is specifically needed

```ts
// yes
export const formatCount = (value: number): string => value.toLocaleString();

const load = async (id: string): Promise<User> => {
  // ...
};

// no
export function formatCount(value: number): string {
  /* ... */
}
const load = function (id: string) {
  /* ... */
};
```

The exceptions, each of which must be genuinely required:

- **Class methods.** They bind `this`. Converting them breaks inheritance,
  frameworks that call methods on an instance, and anything relying on the
  prototype.
- **Generators.** Arrows cannot be generators.
- **Anything needing its own `this` or `arguments`.** If you think you need this,
  raise it first.
- **Anything deliberately relying on hoisting.**
- **Generic arrows in `.tsx`** need a trailing comma — `<T,>(…)` — or the compiler
  parses the `<` as JSX.

A linter rule can catch anonymous function _expressions_, but it will not catch a
`function` declaration. This rule is on you, not on the linter.

---

## 5. Use the library's built-in feature before writing a workaround

Before writing a helper, check whether the package you are already using provides
it. Reimplementing something the dependency already ships is a defect: it drifts,
it is not tested by upstream, and it is what dependency upgrades will miss.

Typical cases:

- class-name composition, when the styling library already ships a merge helper
- request state, caching or retries, when the query library already ships it
- data shape validation, when the schema library is already in use
- date, number and plural formatting, when the platform or an existing utility
  already handles it
- debounce, throttle and timers, when an existing hook does
- accessibility primitives (dialogs, menus, tabs), when the component library
  already wraps them
- form validation, when the form library is already wired to a schema resolver

Only hand-roll when the built-in genuinely does not fit. When you do, say why in a
comment so the next reader does not "simplify" it back.

---

## 6. Never write tests or comments that reference stale things

No comment and no test may describe a past defect, a previous implementation, or a
change that has already been made. Comments describe what the code does **now**
and why. Tests describe **required behaviour**.

```ts
// no
// Closes a gap that existed before this was wired up
// Regression note: if either is demoted to a devDependency the CLI dies
// Verified against commits a1b2c3d..e4f5g6h
it("still works after the fix", () => {
  /* ... */
});

// yes
// The client is constructed with an adapter because the driver requires one
it("rejects a refresh token whose family was revoked", () => {
  /* ... */
});
```

Hard-coded commit SHAs, incident narratives, and "was broken / now fixed"
phrasing all rot and mislead. Delete them on sight.

---

## 7. Fail loudly, never silently

Prefer failing loudly with clear error logs over failing silently with hidden
fallbacks. A silent fallback turns a bug into a mystery. If you are tempted to
swallow an error, log it with enough context to act on and rethrow, or fail the
operation.

---

## 8. When a unit test fails, ask which side is wrong

Always and first ask yourself when a unit test fails: **is this exposing a real
bug in the production code — or is the test itself flawed?** Do not assume the
test is wrong because it is inconvenient.

---

## 9. Find the root cause before changing anything

When a test fails, determine the root cause before changing anything. The
production code is wrong until proven otherwise.

**Never weaken an assertion, broaden a matcher, or add a skip/xfail to make a
test pass.** If the test is genuinely wrong, explain what it was testing
incorrectly and why the new assertion is more accurate — then change it.

---

## 10. No code file over 300 lines

No code file may exceed 300 lines. Before a file crosses this limit, stop and
refactor it into modules. **Do not write the file and plan to split later — split
first, then continue.**

This does not apply to documentation, configuration, or generated files.

---

## 11. Only modify files the task requires

Only modify files directly required by the current task. If a change would touch
files outside the stated scope — including refactors, cleanup, or "improvements" —
**list the files and the reason, then wait for approval.**

Never rename, move, or delete any file without explicit instruction.

---

## 12. Read-only by default against external systems

All calls to external APIs and remote services must be **read-only** unless the
user explicitly requests a write operation.

For any write operation, execute a dry-run first and present the expected outcome.
**Never execute destructive operations** (`DELETE`, `DROP`, overwrite, force-push)
without showing the exact command and getting confirmation.

---

## 13. Plan by scope before coding

Choose a planning level based on the scope of the change:

| Scope                              | Plan                                                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **1–2 files changed**              | No written plan. State your approach in one sentence and proceed.                                                                 |
| **3+ files changed**               | Write a brief plan listing each file and the change. Get approval before starting.                                                |
| **Architectural or cross-cutting** | Write a full plan with sequenced steps, risks, and a rollback approach. Get approval. Implement in stages, validating after each. |

When in doubt, over-plan. A wasted paragraph costs less than a wasted refactor.

---

## 14. Use web search only when it improves correctness

Use web search only when it materially improves correctness — up-to-date APIs,
recent advisories, release notes. Prefer official documentation and primary
sources. Record source dates when they are relevant.

---

## 15. Smallest safe change

Make the smallest safe change that solves the issue. Preserve existing style and
conventions. Prefer patch-style edits — small, reviewable diffs — over full-file
rewrites.

After making changes, run the project's standard checks when feasible: format,
lint, typecheck, test, build. Never report work as complete on the strength of a
command you did not run. If something could not be verified, say so explicitly and
explain why.

---

## 16. Never print secrets

Never print secrets (tokens, private keys, credentials) to terminal output. Do not
ask the user to paste secrets.

Avoid commands that might expose secrets — dumping environment variables broadly,
`cat ~/.ssh/*`, and the like. Prefer existing authenticated CLIs, and redact
sensitive strings in anything you display.

---

## 17. Protect user edits

**Guardrail.** Never delete files or modify user-edited regions without explicit
approval.

If a change touches user-edited regions or is destructive (delete, rename, move),
present a targeted diff and **wait for explicit approval before applying those
specific hunks or actions**.

Treat any region whose most recent change was not made by an agent as
user-edited.

---

## 18. Keep sensitive material out of the repository

The following must never be mentioned in commits, comments, or written into files
that are not ignored by version control:

- API keys, tokens, passwords, or any credentials
- Database connection strings with passwords
- Cloud provider access keys or secret keys
- Private encryption keys or certificates
- OAuth secrets or token signing keys
- Production IP addresses or internal URLs
- Customer data or personally identifiable information
- Proprietary algorithms or trade secrets
- Security vulnerability details
- Detailed firewall or security group configurations

These must never be mentioned anywhere outside the project unless explicitly
stated or confirmed by the owner.

---

## 19. Isolated testing: enumerate the failure modes first

If you must test a system in isolation, first write down all the ways it could
fail, then write the code.

---

## 20. What makes a test worth keeping

A test is worth keeping when **all** of these are true:

1. It proves an exact behaviour established by an approved requirement, bug,
   accessibility rule, worked example, or other independent source.
2. It detects a recognizable user-visible or caller-visible failure.
3. Its expected result is independent of the implementation.
4. It observes behaviour through a public interface or stable seam.
5. It survives internal refactors and changes to incidental copy or layout.
6. It uses the lowest stable seam that provides the needed confidence and does not
   duplicate nearby coverage.

Use the lowest stable seam that can prove the behaviour: pure rules in domain
tests, orchestration and authorization outcomes in application tests, interaction
contracts in component tests, and only critical user workflows in end-to-end
tests.

---

## 21. Port the existing lint ruleset, do not abandon it

When linting or formatting moves to a different tool, express **every** rule the
new tool supports rather than starting from its defaults.

If a rule cannot be expressed in the new tool, say so explicitly — record which
rule, what it enforced, and that nothing enforces it now. A silently dropped rule
is worse than a documented gap, because nobody knows it is gone.

Verify a rule exists before configuring it, and check the new tool's own
documentation for the exact name and options rather than assuming.

---

## 22. Documentation practices

Be concise, specific, and value dense. Write so that a developer new to the
codebase can understand your writing — do not assume your audience are experts in
the topic or area you are writing about.

---

## 23. Boundaries

- **Always do:** write new files to `docs/`, follow the style examples, run the
  project's markdown linter.
- **Ask first:** before modifying existing documents in a major way.
- **Never do:** modify application source code, edit config files, commit secrets.

---

## 24. Ask before opening any environment file

Never open an environment file without explicit confirmation. Ask first, name the
file and what you need from it, then **wait** — every time, in every project,
including ones whose layout you think you already know.

This covers environment files whatever they are called:

- `.env` and every variant — `.env.local`, `.env.development`, `.env.production`
- committed templates — `.env.example`, `.env.sample`
- secrets kept under other names — `*.pem`, `*.key`, `credentials.json`,
  `appsettings*.json`, `secrets.yaml`, `.npmrc`, cloud credential files

"Opening" means every route to the contents: `cat`, `less`, `grep`, `sed`, `awk`,
`head`, `tail`, `source`, a `dotenv` call, a file-read tool, or extracting a
single value into a shell variable. Pulling one value into a variable still
counts — the value enters your context and can resurface in output, a summary, or
a later message. No route is a loophole.

**A request to work on configuration is not permission to read the file.** Being
asked to debug a connection string, fix a deployment, run a migration, verify a
setup, or "check the env" does not authorise opening anything. This rule governs
*reading*; rule 16 governs *printing*. Reading comes first, so this is the earlier
place to stop.

Steps that do not open the file need no confirmation — checking that it exists,
whether version control tracks or ignores it, or how large it is. Anything that
reads the contents, even one line or one key, needs confirmation first.

When a value is genuinely required, ask the owner for that specific value, or ask
them to run the command themselves. Do not go looking for it in files you were not
given.

---

## 25. Stop only the processes you started

The machine is not yours. There are two tiers.

**Processes you started — you may stop them, but you must say so.** No
confirmation is needed, provided you are *certain* they are yours: you launched
them in this session and can trace them back to your own command. When you stop
one, report it in your next message — what it was, its port or PID — and state
that it is now stopped. A silent cleanup is not allowed; the owner needs to know
what changed on their machine.

**Everything else — confirm first.** Anything you did not start, cannot attribute
with certainty, or inherited from an earlier session needs explicit confirmation
for that specific process.

**An interfering process from the same project is a legitimate thing to ask
about.** If something already running gets in the way of work on this project — a
dev server holding the port a check needs, a watcher rewriting files mid-build, a
database client holding a lock — you may ask to stop it. Ask; do not act. Name
each process, say what it appears to be, and state the concrete interference: the
port, the error, the lock. Then wait.

Ask for the smallest set that unblocks you, stop only what was approved, and
report each one afterwards exactly as you would your own. **A no is final for that
process** — find another way, or stop and say what is blocked. **Approval is never
standing**: it covers the processes you named, once, and the next conflict needs
its own confirmation.

**Certainty is the whole test, so be strict about it.** "It looks like the kind of
process I would have left behind" is not certainty. If you cannot point at the
command that started it, it is not yours. This is exactly where a rule like this
goes wrong in practice: a process sitting on the port you need is far more likely
to be the owner's dev server than your own leftover.

**If the owner has come to rely on something you launched** — they are using it,
or they asked you to leave it running — it is theirs now, whatever started it.

This covers every route to stopping something:

- `kill`, `kill -9`, `pkill`, `killall`, and `… | xargs kill`
- `docker stop`, `docker kill`, `docker rm -f`, `docker compose stop`, `… down`
- `brew services stop`, `launchctl unload`, `launchctl bootout`, `systemctl stop`
- `shutdown`, `reboot`, and any equivalent GUI action or `osascript` quit
- any background-job or task-runner facility you are given: stopping a job is
  stopping a process, and follows the same two tiers

**A port being in use is not authorisation to free it.** Name the port, the
process and what it appears to be. If it is provably yours, stop it and say so. If
it is not — or you are not certain — ask, and describe the conflict concretely.
When the process belongs to this project, that request is reasonable and may be
granted. When it belongs to something else on the machine, expect the answer to be
no, and plan for that instead of pushing.

**Prefer commands that finish on their own.** Reach for a one-shot check — a build
that exits, a test run, a lint pass — before a long-running server, so there is
nothing to clean up at all.

Reading process state is always fine and needs no confirmation: `ps`, `lsof`,
`pgrep`, `docker ps`, port listeners, uptime. Investigate as much as you like —
the line is at *changing* what is running, not at looking.

If a process is harming the machine or the work — filling the disk, spinning at
full CPU, blocking every command — and it is not yours, report it with the
evidence and let the owner decide. Urgency is not an exception to this rule; it is
exactly the situation where asking matters most.

---

## 26. Stay inside the workspace

Treat the session workspace as the boundary of what you may read and write.
Everything outside it belongs to the owner, to their other applications, or to the
operating system, and reaching into it is not a decision that is yours to make.

**Never search or traverse outside the workspace.** No `find`, `grep -r`, `ls -R`
or glob rooted at `$HOME`, `/Applications`, `~/Library`, `/`, or any other system
root. A recursive search is the worst offender, because it enters directories you
never intended to touch:

```bash
find "$HOME" -maxdepth 4 -name some-binary   # no — walks the whole home directory
ls "$PWD/.azure/bin/some-binary"             # yes — one known location
```

**Never read into another application's bundle or data container** —
`/Applications/*.app`, `~/Library/Containers/*`, `~/Library/Group Containers/*`,
`~/.config/<other-app>`, or another tool's private cache.

**Locate tools through `PATH` and known install prefixes**, in this order:
`command -v`, then the workspace itself (`$PWD/node_modules/.bin`,
`$PWD/.azure/bin`), then the home tool directories (`~/.azure/bin`,
`~/.docker/bin`), then package-manager prefixes. One `ls` against a known location
beats a filesystem-wide search. If none of those finds it, **ask** — do not go
looking.

**"Read-only" is not a defence.** Enumerating filenames still exposes private
data, and on macOS and Windows, reading a protected location raises a consent
prompt attributed to the *parent application* — the editor or terminal hosting
you. The owner then sees their own editor requesting access to their music
library, their cloud storage or their documents, with nothing connecting the
prompt to the action that caused it. They cannot consent to what they cannot
attribute.

The locations that trigger this are entirely ordinary, which is exactly why the
rule is absolute: `~/Desktop`, `~/Documents`, `~/Downloads`, `~/Music`, iCloud
Drive, OneDrive and the other `~/Library/CloudStorage` providers, photos, and
every other application's container.

**A workspace nested inside a protected folder is fine.** The owner opened that
folder deliberately, so working inside it is consented. The boundary is the
workspace itself — do not step outward from it.

**If a task genuinely needs a path outside the workspace**, name that exact path
and ask first: which file, what you need from it, and why a copy inside the
workspace will not do. Then wait. An approved path is approved once, for that
path — it is not licence to look around nearby.
