# The token-definitions poll retries a failed definitions fetch every 60 seconds for the whole life of the app, with no backoff and no cap

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_, with a timeout-misuse component: the scheduler here is a self-rescheduling `setTimeout`. Token definitions are the textbook non-essential background fetch, and the thunk that fetches them re-arms itself at a flat 60 s regardless of whether the last attempt succeeded, failed, or failed for the two hours before that.

## Where

[`suite-common/token-definitions/src/tokenDefinitionsThunks.ts:102`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L102) — the re-arm inside `periodicCheckTokenDefinitionsThunk` ([`:90`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L90)).

The thunk clears the module-level handle ([`:85`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L85)), arms a fresh 60 s timer that re-dispatches itself, and only then awaits `initTokenDefinitionsThunk` ([`:106`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L106)). Two consequences follow from the ordering: the cadence is wall-clock rather than "60 s after the last run finished", so a run slower than 60 s overlaps the next one; and the delay is a literal, so the outcome of the run can never influence it.

What keeps a failed pair in the work list is the filter at [`:62`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L62): a definition type survives unless it has `data` or `isLoading`. The reducer's `rejected` case ([`tokenDefinitionsReducer.ts:50`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsReducer.ts#L50)) writes exactly `{ error: true, data: undefined, isLoading: false, … }`, which that filter admits. So every network/type pair whose fetch failed is retried on the next tick, and on every tick after that, forever — `error` is never read by the filter.

The thunk is shared: [`packages/suite/src/actions/suite/initAction.ts:98`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L98) (web, desktop), [`suite-native/app-init/src/appInitThunks.ts:90`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app-init/src/appInitThunks.ts#L90), [`suite-native/discovery/src/discoveryMiddleware.ts:92`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/discovery/src/discoveryMiddleware.ts#L92) on `changeNetworks`, and [`suite-native/module-accounts-import/src/accountsImportThunks.ts:87`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-import/src/accountsImportThunks.ts#L87) after an account import.

## Before

```ts
let tokenDefinitionsTimeout: TimerId | null = null;

type PeriodicCheckTokenDefinitionsThunkDeps = InitTokenDefinitionsThunkDeps;
type PeriodicCheckTokenDefinitionsThunkState = InitTokenDefinitionsThunkState;

export const periodicCheckTokenDefinitionsThunk = createThunk<
    void,
    void,
    {
        state: PeriodicCheckTokenDefinitionsThunkState;
        extra: PeriodicCheckTokenDefinitionsThunkDeps;
    }
>(`${TOKEN_DEFINITIONS_MODULE}/periodicCheckTokenDefinitionsThunk`, async (_, { dispatch }) => {
    if (tokenDefinitionsTimeout) {
        clearTimeout(tokenDefinitionsTimeout);
    }

    tokenDefinitionsTimeout = setTimeout(() => {
        dispatch(periodicCheckTokenDefinitionsThunk());
    }, 60_000);

    await dispatch(initTokenDefinitionsThunk());
});
```

## After

```ts
let tokenDefinitionsTimeout: TimerId | null = null;
let tokenDefinitionsFailedChecks = 0;

type PeriodicCheckTokenDefinitionsThunkDeps = InitTokenDefinitionsThunkDeps;
type PeriodicCheckTokenDefinitionsThunkState = InitTokenDefinitionsThunkState;

const hasFailedTokenDefinitions = (
    state: PeriodicCheckTokenDefinitionsThunkState,
    enabledNetworks: NetworkSymbol[],
) =>
    enabledNetworks.some(symbol => {
        const tokenDefinitions = selectNetworkTokenDefinitions(state, symbol);

        return getSupportedDefinitionTypes(symbol).some(type => tokenDefinitions?.[type]?.error);
    });

export const periodicCheckTokenDefinitionsThunk = createThunk<
    void,
    void,
    {
        state: PeriodicCheckTokenDefinitionsThunkState;
        extra: PeriodicCheckTokenDefinitionsThunkDeps;
    }
>(
    `${TOKEN_DEFINITIONS_MODULE}/periodicCheckTokenDefinitionsThunk`,
    async (_, { dispatch, getState, extra }) => {
        if (tokenDefinitionsTimeout) {
            clearTimeout(tokenDefinitionsTimeout);
        }

        await dispatch(initTokenDefinitionsThunk());

        const enabledNetworks = extra.services.getTokenDefinitionsEnabledNetworks();

        // A definitions endpoint that just failed is usually not going to succeed a minute later —
        // the connection is down — so back off instead of retrying at full rate until the app closes.
        tokenDefinitionsFailedChecks = hasFailedTokenDefinitions(getState(), enabledNetworks)
            ? tokenDefinitionsFailedChecks + 1
            : 0;

        const nextCheckDelay = Math.min(
            TOKEN_DEFINITIONS_CHECK_INTERVAL * 2 ** tokenDefinitionsFailedChecks,
            TOKEN_DEFINITIONS_MAX_CHECK_INTERVAL,
        );

        tokenDefinitionsTimeout = setTimeout(() => {
            dispatch(periodicCheckTokenDefinitionsThunk());
        }, nextCheckDelay);
    },
);
```

with the two intervals added to [`tokenDefinitionsConstants.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsConstants.ts):

```ts
export const TOKEN_DEFINITIONS_CHECK_INTERVAL = 60_000;
export const TOKEN_DEFINITIONS_MAX_CHECK_INTERVAL = 30 * 60_000;
```

The schedule becomes 60 s → 2 m → 4 m → 8 m → 16 m → 30 m, held at 30 m, and resets to 60 s the moment a tick leaves nothing in the error state. `NetworkSymbol`, `selectNetworkTokenDefinitions` and `getSupportedDefinitionTypes` are already imported in this file ([`:4`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L4), [`:7`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L7), [`:14`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L14)), so the only new imports are the two constants.

## Why it matters

The user is offline, behind a captive portal, on a corporate network that blocks `data.trezor.io`, or on a phone that has drifted out of signal — and Suite is open in a tab, or the desktop app is minimised, or the mobile app is in the foreground while they scroll a transaction list.

`n` is small and bounded: enabled networks that carry `coin-definitions` (14 in [`networksConfig.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-config/src/networksConfig.ts)) or `nft-definitions` (8), so at most 22 network/type pairs and in practice a handful. What is unbounded is the **repetition**: those pairs are re-attempted every 60 s for as long as the app stays open, which for a desktop install is days. Each tick fires one `fetch` per failed pair ([`tokenDefinitionsUtils.ts:118`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsUtils.ts#L118)), dispatches a `pending` and a `rejected` action per pair, and the `rejected` case writes a fresh definition object — so the `tokenDefinitions` slice gets a new identity once a minute, forever, waking every subscriber that reads it. On native that lands on the Hermes JS thread at whatever moment the timer happens to fire, and it keeps the radio busy on a device that has no connection to use it with.

**Honest sizing — this is smaller than the raw finding claimed.** The scan estimated "roughly 1 MB of JSON re-parsed on the UI thread every minute". That is wrong, and worth correcting here rather than shipping it into an issue: `fetchTokenDefinitions` throws on `!response.ok` **before** it reaches `response.json()` ([`tokenDefinitionsUtils.ts:122`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsUtils.ts#L122)–[`:126`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsUtils.ts#L126)), and a transport-level failure never gets that far either. A failing tick costs a request that fails and two redux actions — not a parse. The 229–290 KB parse happens exactly once per pair, on the tick that finally succeeds, after which the filter drops the pair for good.

So the honest claim is: a permanently-repeating, permanently-futile background fan-out plus a store write per minute, on a path the user gets nothing from. Not a long task. The fix removes the repetition; it does not make any single tick faster.

## Notes

- **The After hunk has not been compiled.** It is written against the surrounding types by reading.
- **The backoff is the fix; the idle scheduling is not in the After, deliberately.** The raw finding proposed also wrapping the re-armed tick in `runWhenIdle`. Two reasons it is left out. First, the interval is already 60 s and a _healthy_ tick is close to free — the filter at [`:62`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L62) empties `definitionTypes`, `D.isEmpty` short-circuits at [`:69`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L69) and the thunk resolves `Promise.all([])`; there is no work to move off the critical path. Second, `@suite-common/token-definitions` is compiled into the React Native bundle as well as the web one, and `runWhenIdle` is a web helper whose fallback is a plain `setTimeout` — dropping it in here would silently add its timeout as a fixed delay on Hermes, which the writer brief rules out for native code. If a reviewer wants the idle wrap anyway, the repo-idiomatic route is the DI this thunk already uses: add a scheduler to `extra.services` (the shape lives in [`extraDependenciesType.ts:89`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/redux-extra-dependencies/src/extraDependenciesType.ts#L89)) and let `packages/suite` pass `runWhenIdle` while `suite-native` passes a direct call. That is three files of ceremony for a no-op tick, which is why it is not proposed.
- **Moving the re-arm below the `await` is a behaviour change, and it has a failure mode.** It is what makes an outcome-dependent delay possible, and it also removes the overlap the current pre-arm allows. But it means a request that never settles stops the poller entirely — `fetchTokenDefinitions` passes no `AbortSignal` and no timeout, so a captive portal that holds the connection open can hang it. Today's pre-arm keeps firing in that case (badly: it starts a new fan-out on top of the stuck one). Neither behaviour is right; the actual fix for that is a fetch timeout, which this document does **not** add. A reviewer who is unhappy with the trade can keep the pre-arm and compute the delay from the _previous_ tick's outcome instead — one line different, same cadence, no hang risk.
- **`await dispatch(…)` cannot throw here, which the re-arm now relies on.** `initTokenDefinitionsThunk` returns `Promise.all` over dispatched thunks and nothing calls `.unwrap()`, so a rejected inner thunk resolves the outer promise with a rejected action. If that ever changes, the re-arm has to move into a `finally` or the poller dies on the first error.
- **Re-entrancy is unchanged, not fixed.** `tokenDefinitionsTimeout` stays a module-level singleton with a clear-on-entry, so the three native dispatch sites can still land while a run is in flight; the reducer's `pending` case only sets `isLoading` when the symbol has no entry yet ([`tokenDefinitionsReducer.ts:16`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsReducer.ts#L16)), so a retry in flight does not mark itself loading and an overlapping dispatch will re-fetch the same pair. Worth fixing, but it is a correctness issue in the reducer rather than a scheduling one, so it is left alone.
- **A manual dispatch during a failing streak advances the backoff.** `discoveryMiddleware.ts:92` and `accountsImportThunks.ts:87` dispatch the same thunk, and if the run still leaves an error the counter increments as if it were a scheduled retry. Bounded by the 30 m cap, and arguably correct (it _was_ another failed attempt), but a reviewer may prefer resetting the counter on an externally-triggered run — that needs an argument on the thunk, which is why it is not proposed.
- **Newly-enabled networks are mostly not affected by a long backoff, but not entirely.** On web, [`tokenDefinitionsMiddleware.ts:20`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsMiddleware.ts#L20) fetches definitions for a newly-enabled symbol immediately, and on native `discoveryMiddleware` re-dispatches the whole thunk. The gap: the middleware only acts when `!tokenDefinitions` ([`:24`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsMiddleware.ts#L24)), so a network that errored earlier, was disabled and is re-enabled has an entry already and falls through to the poll — which may now be 30 minutes away. This is the strongest thing to push back on. It is a real regression in a narrow case, and the cheap mitigation is to reset `tokenDefinitionsFailedChecks` from the middleware, or to loosen its condition to also fire on `tokenDefinitions[type]?.error`.
- **What the user sees.** Nothing, in the healthy case — the schedule is identical until something fails. In the failing case, a definitions file that becomes reachable again is picked up later than it would be today: up to 30 minutes rather than up to 60 seconds. The visible consequence is that tokens for that network keep showing as unrecognised for longer. Any device connect, account import or network change on native re-dispatches the thunk, and any app restart resets the counter, so recovery is never gated on the 30 minute ceiling alone — but on web with the app left open and nothing touched, it is.
- **The `error` flag exists and is still unused by the retry path.** This change reads it in `hasFailedTokenDefinitions` for the delay, but the filter at `:62` continues to ignore it. Making the filter respect `error` would be a _different_ fix — one that stops retrying altogether — and that is worse: a transient outage would then never recover within a session. Deliberately not changed.
- **A payload that parses to a falsy value loops with a parse.** `fulfilled` stores `data: action.payload` and the filter tests `definition.data` for truthiness, so an endpoint serving `null` (a captive portal, a broken deploy) would re-download **and** re-parse every tick. `[]` is truthy so an empty definitions list is fine. Out of scope here; the backoff caps the damage at once per 30 minutes either way.
- **Tests.** There is no test for this thunk — `suite-common/token-definitions/src` has only [`tokenDefinitionsUtils.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsUtils.test.ts) and `phishing/phishing.test.ts`. [`packages/suite/src/actions/suite/initAction.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts) asserts an exact ordered action list containing `periodicCheckTokenDefinitionsThunk.pending` → `initTokenDefinitionsThunk.pending`/`.fulfilled` → `periodicCheckTokenDefinitionsThunk.fulfilled` (e.g. [`:151`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts#L151)–[`:154`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts#L154)); the After dispatches nothing new and nothing in a different order, so that list is unchanged. The backoff itself deserves its own test with fake timers, which would be the first test of this thunk.
- **Package impact: none published.** `@suite-common/token-definitions` is `"private": true`, so the two new exported constants are internal.
- **Feedback into the skill.** `skills/performance-scheduling/SKILL.md` names `InteractionManager.runAfterInteractions` as React Native's nearest equivalent to `requestIdleCallback`. On the pinned RN it is a deprecated stub that is `setImmediate` with a better name — no interaction awareness, no deadline. That correction is not needed to act on this document (nothing here is idle-scheduled), but it is the reason the idle half was dropped for the shared module, so it belongs in the same follow-up.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
