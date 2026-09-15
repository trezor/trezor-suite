---
name: performance-react-hooks
description: React render performance for Trezor Suite — memoization under React Compiler, referentially stable hook dependencies, minimal dependency arrays, and telling a wasted memo from a render loop. Use when adding useMemo, useCallback or memo, when writing a dependency array, or when a component re-renders or refetches more than it should.
---

# React Hooks Performance

Values that change identity on every render, and the memos, effects and requests that fire because of it.
Check a re-render claim before and after: [`DebugView`](../../suite-native/atoms/src/DebugView.tsx) plus
the dev-utils rerender-count toggle on mobile, the React DevTools Profiler on web. Jest never runs the
compiler on either platform — `packages/suite` and `suite-native` both transform with `@swc/jest`, which
executes no babel plugin and does not enable `jsc.transform.reactCompiler` — so a render-count assertion
in a unit test says nothing about production anywhere. On web, A/B a profile by emptying
`REACT_COMPILER_PATHS` ([`reactCompiler.ts`](../../packages/suite-build/reactCompiler.ts)) on the same
working tree; a branch-vs-`develop` comparison measures every unrelated change too.

## Check whether the file you are touching is compiled before adding or removing a memo

On web and desktop, auto-memoization is enabled directory by directory and the list grows wave by wave.
[`REACT_COMPILER_PATHS`](../../packages/suite-build/reactCompiler.ts) is the source of truth; read it
when in doubt and treat the list below as a summary that can lag it by a commit.

- **Mobile (`suite-native`) is compiled whole-app.** `experiments.reactCompiler: true` in
  [`app.config.ts`](../../suite-native/app/app.config.ts) auto-memoizes every component and hook in its
  bundle, including the `suite-common/*` and `packages/*` sources it pulls in — so those already have to
  satisfy the compiled rules whichever web wave they are in.
- **Web and desktop are compiled tree by tree. Compiled today: `suite-common/` and
  `packages/suite/src/{views,components,hooks}/`** (waves 1a and 1b). The rest of
  `packages/suite/src` — `actions`, `reducers`, `selectors`, `support`, `utils` and the other
  non-UI directories — plus `suite/*`, `packages/components`, `packages/product-components`,
  `packages/react-utils`, `packages/icons`, `packages/suite-web` and `packages/suite-desktop-ui`
  still ship uncompiled, so manual memoization stays its only runtime mechanism there. The
  compiler's lint rules below apply everywhere regardless.
- **In a compiled tree, stop adding manual memoization — and don't mass-delete what is already there.**
  The compiler prunes the memo blocks it can prove redundant; a sweep of the ~600 existing
  `useMemo`/`useCallback` sites is a large unreviewable diff for a modest win. A hand-written memo whose
  equivalence the compiler cannot prove fails `react-hooks/preserve-manual-memoization`.
- **A bail-out is worse than a missing memo** — it silently drops auto-memoization for the whole
  function. `react-hook-form`'s `useForm().watch()` causes one; use `useWatch()`.
- **The compiler's lint rules apply everywhere, and most of them now fail locally.**
  [`reactConfig.mjs`](../../packages/eslint/src/reactConfig.mjs) keeps seven at `error` unconditionally
  — `config`, `gating`, `incompatible-library`, `preserve-manual-memoization`, `purity`,
  `set-state-in-render`, `unsupported-syntax` — next to `rules-of-hooks` and `exhaustive-deps`. Three
  are still off unless `ESLINT_RUN_EXPENSIVE_CHECKS=true`, which CI sets and your local `yarn lint:js`
  does not: `immutability`, `globals`, `error-boundaries`. The same flag gates
  `reportUnusedDisableDirectives` ([`index.mjs:53`](../../packages/eslint/src/index.mjs)), so a
  suppression that has stopped being necessary is still reported only on CI; reproduce a green-locally,
  red-on-CI run with `ESLINT_RUN_EXPENSIVE_CHECKS=true yarn lint:js`. Severity is not the whole story
  either: `yarn g:eslint` carries `--max-warnings 0`, so a rule left at the plugin's default `warn`
  (`incompatible-library`, `unsupported-syntax`, `exhaustive-deps` all are, before this repo's
  overrides) fails a lint run exactly like an `error`.
- **Green lint is not a correctness gate for the compiler rollout.** None of these rules — nor jest —
  can see the failure mode in the next section. `yarn react-compiler:check` is the gate that does:
  it compiles every enabled tree and fails on a render-time `react-hook-form` read
  ([`reactCompilerFrozenReads.ts`](../../packages/suite-build/reactCompilerFrozenReads.ts), run by
  the `other-checks` CI job). Run it locally before pushing anything that reads a form.

## Compiled paths: three review rules no linter enforces

The compiler's proven failure mode in this repo is code it compiles _successfully_, not code it bails
on. `useForm()` returns a `useRef` payload, so `watch`, `getValues` and anything closing over them keep
one identity for the component's whole life. The compiler then emits `if ($[0] !== getValues) { … }`,
that test is false after the first render, and the value read inside the block freezes permanently.
Lint cannot see it, `@swc/jest` cannot see it, and the send-form E2E specs fill a field once and never
assert a second change.

- **A render-body `watch()`, `getValues()` or `getDefaultValue()` call in a compiled path is a blocker.**
  Subscribe with `useWatch()` instead and keep imperative reads inside event handlers and effects. This
  overrides the `getValues()` suggestion under "Never add a new `eslint-disable` for `exhaustive-deps`"
  below whenever the file is compiled.
- **A new `eslint-disable` for `react-hooks/exhaustive-deps` or `react-hooks/rules-of-hooks` also opts
  code out of compilation.** Those two rule names are `babel-plugin-react-compiler`'s
  `DEFAULT_ESLINT_SUPPRESSIONS`, and the repo passes no `eslintSuppressionRules` override. A
  `// eslint-disable-next-line` inside a component drops that whole component (measured: two components
  in one file, 2 → 1 `_c()` calls); a file-top `/* eslint-disable */` for either rule drops the whole
  file (2 → 0). Nothing reports it — `panicThreshold` stays at its `'none'` default. Suppressing any
  other rule name has no effect on compilation.
- **`'use no memo'` is the escape hatch, not `REACT_COMPILER_PATHS`.** As the first statement of a file
  or of a function body it opts exactly that scope out (both measured), sits in the file the next reader
  is already looking at, survives moves and renames, and greps as a debt list; a carve-out in the path
  list silently widens to cover code nobody audited.
  [`useSendFormFields.ts`](../../packages/suite/src/hooks/wallet/useSendFormFields.ts) carries one, with
  the reason written next to it.

## Relocate render-body work before memoizing it, and memoize only what pays

A bare `.find` / `.filter` / `.sort` over `accounts`, `account.tokens`, `transactions` or
`availableVaults` in a component body re-runs on every render, and moving it is the preferred fix: an
existing memoized selector, a named hook (`useEnabledNetworkOptions`), or a child component. Build new
selectors with `createWeakMapSelector`
([selectorsUtils.ts](../../suite-common/redux-utils/src/selectorsUtils.ts)). What stays in the component earns a `useMemo`
only if the work is genuinely expensive over a real list, or a downstream component or hook needs the
result's identity to be stable — O(1) arithmetic and formatting belong in a plain util. Redundant memos
get flagged about as often as missing ones:
([#25937](https://github.com/trezor/trezor-suite/pull/25937#discussion_r2939547571),
[#22136](https://github.com/trezor/trezor-suite/pull/22136#discussion_r2401589060)).

## Keep hook dependencies referentially stable

`?? []`, `{}`, a default parameter, an inline arrow and every `.filter()` result produce a new reference
per render, so each memo, callback and effect below them re-runs. `exhaustive-deps` stays silent because
the dependency _is_ listed, and two shapes are provably invisible to it: one derived from a call
expression (`const filtered = items.filter(...)`), and one that crosses the hook boundary
(`useThing({ list: maybe ?? [] })` feeding a `useMemo` inside `useThing`). Fix with a module-level
constant, or `returnStableArrayIfEmpty`
([selectorsUtils.ts](../../suite-common/redux-utils/src/selectorsUtils.ts), 115 call sites) in a selector.

```tsx
// bad - useAccounts.ts:9 - ethereum, solana, ripple, stellar and tron have no `addresses`, so both
// defaults are a fresh array and the useMemo that lists them never hits
const { unused = [], used = [] } = addresses ?? {};

// good - one reference for the life of the module
const EMPTY_ADDRESSES: readonly AccountAddress[] = [];

const { unused = EMPTY_ADDRESSES, used = EMPTY_ADDRESSES } = addresses ?? {};
```

[#29054](https://github.com/trezor/trezor-suite/pull/29054#discussion_r3466751441),
[#24493](https://github.com/trezor/trezor-suite/pull/24493#discussion_r2720871227)

## Minimal required dependencies

Narrower than the containing object, never wider than the closure: `accountKey`, not `account`;
`payload.amount`, not `payload` ([#23523](https://github.com/trezor/trezor-suite/pull/23523#discussion_r2576737518)).

## Distinguish a wasted memo from a render loop

The failure modes are nothing alike, and only one of them is a loop:

- An unstable dependency on `useMemo` or `useCallback` recomputes every render. Memoization is gone, the
  render count stays bounded. Wasteful, terminates — and it is this repo's actual recurring pain.
- The same dependency on a `useEffect` that fires a request refires it every render. The render count
  still doesn't grow, so this looks like the mild case, and it is the worst one: the request count is
  unbounded, and if the response writes to state the next render fires the next request. That cycle is
  paced by network latency rather than by React, so it never trips "Maximum update depth exceeded" —
  that guard only counts synchronous nested updates. It fails silently against the backend instead of
  loudly in dev.
- The same dependency on a `useEffect` that stores a fresh reference is a synchronous cycle: render mints
  a new array, the effect runs, `setState` renders again, "Maximum update depth exceeded" on about the
  fiftieth nested update. Storing a primitive from it (`setState(claimable.length)`) terminates, because
  React bails out on `Object.is` — an unstable dependency is necessary but not sufficient.

```tsx
// silent and unbounded - `account` is a new object after every blockchain update, so this refetches
// every transaction again, and the fetch writes back to the account. Shipped in the Ethereum staking
// dashboard from 2024-08 until #23523 narrowed it 15 months later.
useEffect(() => {
    dispatch(fetchAllTransactionsForAccountThunk({ accountKey, noLoading: true }));
}, [account, accountKey, dispatch]);

// loud and immediate - a fresh array each render, stored by the effect that re-renders to mint the next
const claimable = rewards.filter(reward => reward.isClaimable);

useEffect(() => setClaimableRewards(claimable), [claimable]);

// good - AdaStakingDashboard.tsx:52 - the effect depends on stable primitives only
useEffect(() => {
    dispatch(fetchAllTransactionsForAccountThunk({ accountKey, noLoading: true }));
}, [accountKey, dispatch]);

// good - derived state is not state; there is no effect left to cycle
const claimable = useMemo(() => rewards.filter(reward => reward.isClaimable), [rewards]);
```

State that can be computed from what you already have is not state; derive it during render and there is
no cycle to have. When an effect really must fetch, depend on the identifier and not the record —
`accountKey`, never `account`. `react-hooks/set-state-in-effect` is **off** here, so nothing warns you
about the third case, and nothing warns you about the second one at all.

## Never add a new `eslint-disable` for `exhaustive-deps`

"Please, let's never use this comment. It leads to bugs and mem leaks." The failure mode is a lying
dependency array on a memo whose callback reads through a ref. It now has a second cost:
`react-hooks/exhaustive-deps` is one of the React Compiler's `DEFAULT_ESLINT_SUPPRESSIONS`, so the
disable comment silently removes the enclosing function — or, at file scope, the whole file — from
compilation. Restructure instead: subscribe with `useWatch()`, convert the memo to `useState` +
`useEffect`, or hold the value in a ref — but check which one. Reading imperatively with `getValues()`
used to be the first suggestion here; in a compiled path it is the frozen-read bug above, so keep it to
event handlers and effects. When the value is genuinely read through a stable callback and the linter
therefore cannot see it, keep the dependency listed and reference it with a `void` statement so the rule
stays live rather than suppressed — `useTradingBuyFormDefaultValues.ts:45` does exactly that with
`void coins;`, and carries no `eslint-disable` at all.
[`useFreshRef`](../../packages/react-utils/src/hooks/useFreshRef.ts) assigns during render, so `.current`
is always the newest value; it is the only correct choice when the ref is read in render or inside a
`useMemo`. [`useCurrentRef`](../../packages/react-utils/src/hooks/useCurrentRef.ts) assigns in an effect,
so during render `.current` still holds the last committed value. Neither tracks the previous value — for
that, assign a plain `useRef` at the end of the effect. And confirm the dependency is genuinely unstable
at its declaration first: a `useCallback(…, [])` handler is already stable and belongs in the array
([#26319](https://github.com/trezor/trezor-suite/pull/26319#discussion_r3137461927),
[#27384](https://github.com/trezor/trezor-suite/pull/27384#discussion_r3193474335)).

## Related skills

- [Components](../components/SKILL.md) — hook order, pass the narrow prop, and don’t optimise until you
  can point at the cost.
- [Redux](../redux/SKILL.md) — one `useSelector` per value. The `useSelector` exported by
  `@suite-common/redux-utils`

- [Asymptotic complexity](../performance-complexity/SKILL.md) — indexing, sorting and reducing over
  collections that grow.
- [DOM and CSS](../performance-dom/SKILL.md) — forced layout, observers, compositor-only animation.
- [Long and non-essential tasks](../performance-scheduling/SKILL.md) — yielding long tasks, deferring
  background work.
