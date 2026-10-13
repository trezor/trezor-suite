# @suite-native/performance-metrics

Screen performance instrumentation for Detox E2E runs. It wraps
[`react-native-lighthouse`](https://github.com/indeedeng/react-native-lighthouse) and writes one
line per measured screen to the device log, which is the only app-to-test channel Detox gives us.

## Public API

```ts
const PERFORMANCE_LOG_PREFIX = '__TREZOR_PERF__';

type PerformanceScreen = 'home' | 'accounts' | 'account-detail' | 'send' | 'receive';

type PerformanceSample = {
    screen: PerformanceScreen;
    ttffMs: number | null; // Time to first frame.
    ttiMs: number | null; // Time to interactive.
    fidMs: number | null; // First input delay, only set once a touch reached the measuring view.
    score: number | null; // Lighthouse-style 0-100 score.
    timestamp: number; // Date.now() when the sample was reported.
};

const useScreenPerformance: (
    screen: PerformanceScreen,
    isReady?: boolean,
) => {
    markInteractive: () => void;
    panHandlers: Partial<GestureResponderHandlers>;
};

const ScreenPerformanceRoot: (props: {
    panHandlers: Partial<GestureResponderHandlers>;
    children: ReactNode;
}) => JSX.Element;
```

The emitted line is the prefix, one space, and one line of `JSON.stringify(sample)`:

```
__TREZOR_PERF__ {"screen":"home","ttffMs":123.4,"ttiMs":456.7,"fidMs":12.3,"score":87,"timestamp":1750000000000}
```

A metric the library could not produce is `null` — never omitted and never `0`.

## Instrumenting a new screen

A screen adds at most two things: the hook call and the wrapper. Readiness lives in the hook, not
in the screen, so that a production build pays for none of it.

1. Add the screen id to `PerformanceScreen` in `src/types.ts`.
2. Teach `useIsScreenReady` in `src/useScreenPerformance.e2e.ts` what "ready for interaction" means
   for it — the data the user came for, not the mount. If that state lives in the store, subscribe
   to it there. If it is component state the screen already holds, pass it as `isReady` instead.
3. Call the hook **before any early return**, so the measurement starts at the screen's real mount
   and not when its content happens to be ready. When you pass `isReady`, call the hook right after
   the value it derives from.
4. Wrap what the screen renders in `ScreenPerformanceRoot` so the first touch can be measured.

```tsx
export const SendOutputsScreen = () => {
    const sendForm = useSendForm(accountKey, tokenContract);
    const { panHandlers } = useScreenPerformance('send', !!sendForm);

    return (
        <ScreenPerformanceRoot panHandlers={panHandlers}>
            <Screen>{/* ... */}</Screen>
        </ScreenPerformanceRoot>
    );
};
```

`markInteractive` stays on the returned object for a screen whose readiness is neither store state
nor a render-time boolean. A screen that never becomes ready and is never touched reports nothing
at all — the library starts its report timer inside `markInteractive()`.

## What is instrumented today

| Screen id        | Component                                          | Ready when                             | Readiness owner |
| ---------------- | -------------------------------------------------- | -------------------------------------- | --------------- |
| `home`           | `module-home` `HomeScreen`                         | discovery is no longer running         | the hook        |
| `accounts`       | `module-accounts-management` `AccountsScreen`      | the device has an account row to tap   | the hook        |
| `account-detail` | `module-accounts-management` `AccountDetailScreen` | the account resolved (loader replaced) | `isReady`       |
| `send`           | `module-send` `SendOutputsScreen`                  | the send form exists                   | `isReady`       |
| `receive`        | `module-receive` `ReceiveFreshAddressScreen`       | the fresh address is available         | the hook        |

## Gating

Nothing here runs, and nothing here ships, outside a Detox test build.

- **Bundle.** `useScreenPerformance` and `ScreenPerformanceRoot` each have a `.e2e` twin
  (`useScreenPerformance.e2e.ts`, `ScreenPerformanceRoot.e2e.tsx`). Metro only prefers those files
  when `RN_SRC_EXT=e2e.ts,e2e.tsx` is set, which happens exclusively in the E2E app builds
  (`suite-native/app/.env.test`, `template-suite-native-prepare-test-app-android.yml`,
  `test-suite-native-e2e-ios.yml`). Every other build resolves the plain files, which mention
  neither `react-native-lighthouse` nor any readiness selector, so none of that enters Metro's
  dependency graph. The plain `ScreenPerformanceRoot` renders its children untouched, so the
  measuring view does not exist in the view hierarchy either.
- **Runtime.** `logPerformanceSample` additionally checks `isDetoxTestBuild()`
  (`EXPO_PUBLIC_IS_DETOX_BUILD`) before writing anything, so an E2E bundle launched outside a Detox
  run stays silent.

The non-E2E hook ignores both of its arguments and returns one shared handle — a no-op
`markInteractive` and an empty `panHandlers` — so instrumented screens never re-render or re-run an
effect because of this package.

## Caveats

- **FID is mostly `null` under Detox.** The library measures it through a bubble-phase
  `PanResponder`, so a tap that a `Touchable` or `ScrollView` claims first never reaches the
  measuring view. What it does record is a `queueMicrotask` round trip, which says little about a
  synthetic tap.
- **The report is emitted `FID_TIMEOUT_MS` after the screen becomes ready** (or immediately on a
  first touch), and the library clears that timer on unmount. A screen left before the timeout
  elapses reports nothing, which is why the timeout is 1 s rather than the library's 5 s default.
- **A touch before the screen becomes ready ends the measurement early.** The library reports on
  the first input whether or not TTI was marked, so such a sample carries `ttiMs: null`.
- **`receive` readiness reads `accountKey` from the route params.** Entered from the account detail
  screen, which is how the E2E flow reaches it, the param is always there. A deep link that
  identifies the account by network symbol, type and index instead would never mark the screen
  interactive, and the sample would carry `ttiMs: null`.

How the samples are collected into a report, the per-screen budgets and the variance sources are
documented in `suite-native/app/e2e/README.md` and `docs/tests/`.
