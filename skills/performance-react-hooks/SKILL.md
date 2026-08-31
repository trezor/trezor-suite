---
name: performance-react-hooks
description: React render performance for Trezor Suite — memoization under React Compiler, referentially stable hook dependencies, minimal dependency arrays, and telling a wasted memo from a render loop. Use when adding useMemo, useCallback or memo, when writing a dependency array, or when a component re-renders or refetches more than it should.
---

# React Hooks Performance

Values that change identity on every render, and the memos, effects and requests that fire because of it.
Check a re-render claim before and after: [`DebugView`](../../suite-native/atoms/src/DebugView.tsx) plus
the dev-utils rerender-count toggle on mobile, the React DevTools Profiler on web. React Compiler doesn't
run in native jest (`@swc/jest`), so render-count assertions there say nothing about production.

## Check which app you are in before adding or removing a memo

- **Mobile (`suite-native`) is compiled.** `experiments.reactCompiler: true` in
  [`app.config.ts`](../../suite-native/app/app.config.ts) auto-memoizes every component and hook, so
  don't add new manual memoization. A bail-out is worse than a missing memo — it silently drops
  auto-memoization for the whole component; `react-hook-form`'s `watch()` causes one, use `useWatch()`.
- **Web and desktop (`packages/suite`) are not compiled.** Manual memoization is the only mechanism at
  runtime. `suite-common/*` and `packages/components` ship to both, so memoize for the web consumer.
- **The compiler's lint rules apply everywhere, but only on CI.**
  [`reactConfig.mjs`](../../packages/eslint/src/reactConfig.mjs) switches off ten of them —
  `preserve-manual-memoization`, `immutability`, `purity`, `incompatible-library`, `globals`,
  `error-boundaries`, `set-state-in-render`, `unsupported-syntax`, `config`, `gating` — unless
  `ESLINT_RUN_EXPENSIVE_CHECKS=true`, which CI sets and your local `yarn lint:js` does not. The same flag
  gates `reportUnusedDisableDirectives` ([`index.mjs:52`](../../packages/eslint/src/index.mjs)), so a
  suppression that has stopped being necessary is also only reported on CI. Reproduce a green-locally,
  red-on-CI run with `ESLINT_RUN_EXPENSIVE_CHECKS=true yarn lint:js`. `rules-of-hooks` and
  `exhaustive-deps` are `error` everywhere, always.

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
dependency array on a memo whose callback reads through a ref. Restructure instead: read imperatively
(`getValues()`), convert the memo to `useState` + `useEffect`, or hold the value in a ref — but check
which one. When the value is genuinely read through a stable callback and the linter therefore cannot see
it, keep the dependency listed and reference it with a `void` statement so the rule stays live rather than
suppressed — `useTradingBuyFormDefaultValues.ts:45` does exactly that with `void coins;`, and carries no
`eslint-disable` at all.
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
  `@suite-common/redux-utils` has a `shallowEqual` default, which absorbs a fresh object of primitives
  one level deep; direct React Redux usage re-renders for the same selector on every dispatch.

- [Asymptotic complexity](../performance-complexity/SKILL.md) — indexing, sorting and reducing over
  collections that grow.
- [DOM and CSS](../performance-dom/SKILL.md) — forced layout, observers, compositor-only animation.
- [Long and non-essential tasks](../performance-scheduling/SKILL.md) — yielding long tasks, deferring
  background work.
