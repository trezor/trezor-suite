# Writer brief — perf-issues/scheduling documents

Repo: `/Users/jiri.cermak/dev/satoshilabs/trezor/trezor-suite`, branch `issues/perf-complexity`,
HEAD `77d47ea064`. Nothing is filed on GitHub; these are local drafts a human reviews before any
issue is opened.

## The skill you are writing against

Read it in full first: `skills/performance-scheduling/SKILL.md`. Its two sections:

1. **"Break a long task up and yield to the main thread"** — a task over 50 ms is a long task and
   everything past 50 ms is its blocking period. Splitting is not enough; the loop must hand control
   back between batches and the yield must be UNCONDITIONAL (never gated on `isInputPending()`).
   `scheduler.yield()` resumes at the **front** of the queue; Safari lacks it, so web needs a
   `setTimeout(resolve, 0)` fallback behind one `yieldToMain` helper; `suite-desktop` is Chromium and
   always has the real thing. Bare `setTimeout(0)` is the fallback, not the goal — it appends to the
   **back** of the queue and after five nested timeouts the browser clamps to a 5 ms floor. For a
   React **render** rather than a loop, the lever is `startTransition` / `useDeferredValue`.
2. **"Schedule non-essential work in an idle callback"** — analytics, telemetry, prefetch and cache
   warming go in `requestIdleCallback`, **always** with a `timeout`. Not Baseline (no Safari), so web
   needs a `setTimeout` fallback. React Native has neither API; its lever is
   `InteractionManager.runAfterInteractions`, unused in this repo so far.

## Repo ground truth (verified — do not re-derive)

- **Zero** call sites of `requestIdleCallback`, `cancelIdleCallback`, `scheduler.yield`,
  `yieldToMain`, `scheduler-polyfill`, `InteractionManager` in product code.
  `startTransition`/`useDeferredValue` exist only in `packages/analytics-docs` (a standalone docs
  app, **not** Suite).
- `scheduler-polyfill` is **not** a dependency anywhere in the repo.
- **`InteractionManager` is a deprecated stub on this repo's React Native — the skill is wrong.**
  `skills/performance-scheduling/SKILL.md` calls `InteractionManager.runAfterInteractions` React
  Native's "nearest equivalent" to `requestIdleCallback`. Verified at HEAD: the installed
  `node_modules/react-native` (0.86.0; `suite-native/app/package.json:145` pins `0.85.3`) exports
  `InteractionManagerStub` from `Libraries/Interaction/InteractionManager.js`. Every member is
  `@deprecated`; `runAfterInteractions` is a bare `setImmediate` returning `{ then, cancel }`;
  `createInteractionHandle()` returns `-1`; `clearInteractionHandle` only asserts; `setDeadline` is
  literally `// Do nothing.`. **It does not wait for interactions or animations to finish.**
  So for suite-native, the honest levers are:
    - re-ordering work so it is not on the gating path at all (usually the real win),
    - `startTransition` / `useDeferredValue` for renders (React 18+ works on RN),
    - `setImmediate` / `setTimeout(0)` to break a task, with the caveat that both append to the back
      of the queue — Hermes has no `scheduler.yield`.
      If a document proposes `runAfterInteractions`, it must say it resolves to `setImmediate` today and
      must not claim animation-awareness it does not have. Prefer the re-ordering argument and say
      plainly when the scheduling primitive is near-cosmetic. Flag in Notes that
      `skills/performance-scheduling/SKILL.md` needs this correction.
- Agreed home for the shared helpers, so every document in this set agrees:
  `packages/utils/src/yieldToMain.ts` and `packages/utils/src/runWhenIdle.ts`, exported from
  `@trezor/utils` (one-function-per-file, `export * from './name'` in `index.ts`, colocated
  `.test.ts`). `yieldToMain` = `scheduler.yield()` when present, else `setTimeout(resolve, 0)` — no
  polyfill dependency added. `runWhenIdle` = `requestIdleCallback` with a **required** `timeout`,
  else `setTimeout`. **Native code must not use `runWhenIdle`** — the RN lever is
  `InteractionManager.runAfterInteractions`.
  Do not re-specify the helpers in full; say "introduced by whichever of these issues lands first"
  and show the call site. `@trezor/utils` is published, so adding them is a published-API addition.

## Correction to the skill: `InteractionManager` is a deprecated stub

**Verified directly in the installed source, not inferred.** `suite-native/app/package.json:145` and
the repo root pin `react-native@0.85.3` (`yarn.lock` resolves `react-native@npm:0.85.3`); the
hoisted `node_modules/react-native` is `0.86.0`. In that installed copy,
`node_modules/react-native/Libraries/Interaction/InteractionManager.js` exports
`InteractionManagerStub` — **every member is `@deprecated`**, and:

- `runAfterInteractions(task)` is a bare `setImmediate(...)` wrapped in a promise with a `cancel()`
  that calls `clearImmediate`. It does **not** wait for touches or animations to finish.
- `createInteractionHandle()` returns `-1`, `clearInteractionHandle()` only asserts, `addListener()`
  returns a no-op `remove()`, and `setDeadline()` is literally `// Do nothing.`

So `skills/performance-scheduling/SKILL.md` is out of date where it calls
`InteractionManager.runAfterInteractions` React Native's "nearest equivalent" to
`requestIdleCallback`. On this RN version it is `setImmediate` with a nicer name: it defers to the
next tick, which still breaks up a long task, but it gives **no** interaction- or frame-awareness
and no deadline.

**What this means for native documents:**

- Do not present `InteractionManager` as an idle scheduler. If you propose it, say plainly that on
  the pinned RN it is `setImmediate`, and that the win is the re-ordering/deferral, not any
  interaction awareness.
- Prefer the levers that genuinely work on Hermes: re-ordering the work, `setImmediate`/
  `setTimeout(0)` as an explicit yield in a chunked loop (Hermes has no `scheduler.yield`), and
  `startTransition` / `useDeferredValue` for renders.
- Say so in Notes, and note that the skill itself needs a follow-up correction. That feedback into
  `SKILL.md` is a wanted outcome of this sweep, not a distraction.

## House style — read before writing any `After` hunk

`skills/basic-syntax/SKILL.md`, `skills/comments/SKILL.md`, `skills/naming/SKILL.md`. Match the
surrounding file's idiom, comment density and naming. Do not add comments the repo would not write.

## Document structure — copy exactly

Model: https://github.com/trezor/trezor-suite/issues/31137

````
# <Title — one line, states the defect not the fix, specific enough to read alone>

<Lead: name the skill section in italics, e.g. Extracted from the
`skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main
thread"_. Then one or two sentences on why this call site in particular.>

## Where

<Markdown link(s) of the form
[`path/from/repo/root.ts:NN`](https://github.com/trezor/trezor-suite/blob/develop/path/from/repo/root.ts#LNN)
then prose: what the code does and where the defect is.>

## Before

```ts
<VERBATIM excerpt. Copy exactly — no reformatting, no unmarked elision.>
````

## After

```ts
<Proposed replacement against the real surrounding types, same indentation base as the file.>
```

## Why it matters

<What the user is doing when this runs, what n is and why it is unbounded, what is held and for how
long in order-of-magnitude terms, what changes after the fix.>

## Notes

<Bulleted honest engineering detail: ordering/re-entrancy risk, cancellation, which tests break,
that the After has not been compiled, published-package impact, platform differences, why this batch
size or timeout, what you deliberately did not change, and where a reviewer should push back.>

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>

```

## Rules

- Every `file:line` you cite must be verified by reading that exact line **now**. Re-read before
  writing it down. A wrong anchor makes the document worthless.
- The `Before` block is verbatim. Never paraphrase it.
- **No measurements.** No "this takes 300 ms". The 50 ms figure is the long-task spec's, not an
  observation. If an already-filed issue measured a comparable defect you may cite it by number and
  say it is that issue's measurement, not this one's.
- **Be honest about weakness.** If the fix has a real ordering risk, or `n` is smaller than it looks,
  or the win is speculative, say so plainly in Notes. A reviewer must be able to reject the issue on
  the strength of your own notes — the reference issue does exactly this ("Honest sizing, low not
  medium").
- Where the fix changes something the user could notice (something appears later than before), say
  what the user sees and what guarantees it still runs (the idle timeout, the fallback).
- Do not pad. A tight document beats a long one.

## Work order for each document

1. Read the raw finding block in the named `_scan/` file.
2. Read the source file(s) **end to end** — not just the anchor line.
3. Re-verify every line number you intend to cite.
4. Read the house-style skills if you have not already.
5. Write the document with the Write tool at the exact path given.
```
