# The account-detail graph starts its whole fetch-and-reduce pipeline from a mount effect, while the screen is still being pushed

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_. `useGraphData` dispatches its refetch from a bare mount effect. On the account-detail screen that effect runs as the screen is being pushed onto the native stack, so the graph pipeline, the transaction list's first-page fetch and the list's own first render all contend for the one JS thread in the same turn. Of those three, the graph is the one the user is not waiting for — it renders a loading state either way.

## Where

[`suite-native/graph/src/hooks.ts:79`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/hooks.ts#L79) is the effect. Its only gates are `isDeviceAuthorized` and the `isEnabled` flag, which defaults to `true` ([`:43`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/hooks.ts#L43), declared at [`:33`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/hooks.ts#L33)) and which **neither** call site passes today.

The two call sites are [`PortfolioGraph.tsx:28`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-home/src/screens/HomeScreen/components/PortfolioGraph.tsx#L28) on Home and [`AccountDetailGraph.tsx:47`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountDetailGraph.tsx#L47) on account detail. This issue is about the second one, because only it sits behind a push transition: `AccountDetailGraph` is rendered by [`TransactionListHeader.tsx:79`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/TransactionListHeader.tsx#L79), which is built as the `ListHeaderComponent` at [`AccountDetailContentScreen.tsx:41`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/screens/AccountDetailContentScreen.tsx#L41) and handed to the transaction `FlashList` at [`TransactionList.tsx:299`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L299). It therefore mounts with the screen the user has just tapped into.

`AccountDetail` is a route of the app's native stack ([`RootStackNavigator.tsx:126`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/src/navigation/RootStackNavigator.tsx#L126), navigator created at [`:79`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/src/navigation/RootStackNavigator.tsx#L79)), and every push in that stack is animated — [`suite-native/navigation/src/config.ts:6`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/navigation/src/config.ts#L6) sets `animation: 'ios_from_right'` for all of its screens.

What the effect starts is not a small dispatch. `refetchGraphThunk` → `fetchGraphData` → `getMultipleAccountBalanceHistoryWithFiat` → `getAccountBalanceHistory` per account, then `getAccountMovementEvents` for the graph's event markers. On the local-balance-history networks that means reading the account's transactions ([`graphDataFetching.ts:173`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L173)) and folding every one of them ([`:180`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L180)) — the reduction **p1-16** is about — plus a `TrezorConnect.getAccountInfo` round trip in parallel ([`:223`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/graph/src/graphDataFetching.ts#L223)) and the fiat-rate mapping afterwards.

For an account whose transactions are already in the store, none of that waits for the network before the fold: `fetchTransactionsFromNowUntilTimestamp` ([`transactionsThunks.ts:802`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L802)) returns straight out of the store at [`:824`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsThunks.ts#L824), `createSingleInstanceThunk` wraps the payload creator in a `Promise.resolve` ([`createSingleInstanceThunk.ts:82`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/redux-utils/src/createSingleInstanceThunk.ts#L82)), and every hop in between is a promise continuation. Microtasks drain before the task ends, so on that path the fold runs **in the same event-loop turn as the mount effect**. When the transactions are not cached, the same work lands one or more round trips later — often still inside the transition.

## Before

The effect, verbatim, at [`hooks.ts:79`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/hooks.ts#L79):

```ts
useEffect(() => {
    if (!isEnabled || !isDeviceAuthorized) return;

    refetchGraph();
}, [isEnabled, isDeviceAuthorized, refetchGraph]);
```

and the account-detail call site, verbatim, at [`AccountDetailGraph.tsx:47`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountDetailGraph.tsx#L47):

```tsx
const { refetchGraph: refetchAccountGraph } = useGraphData({
    instanceId: graphInstanceId,
    accounts,
    eventsAccount: accountItem,
    timeframeHours: accountGraphTimeframe,
    backendSymbol: accountItem?.symbol ?? 'btc',
});
```

## After

A hook next to the other navigation hooks, `suite-native/navigation/src/hooks/useHasScreenTransitionFinished.ts`, that reports when the screen has finished coming in. The native stack emits `transitionEnd` for the route when its screen appears:

```ts
import { useEffect, useState } from 'react';

import { type ParamListBase, useNavigation } from '@react-navigation/native';

import { type StackNavigationProps } from '../types';

// A screen that appears without an animation never receives transitionEnd, so the flag also flips
// on its own. The timeout is a safety net for that case, not the mechanism.
const TRANSITION_END_FALLBACK_MS = 1000;

/**
 * Tells a screen whether its transition animation is over, so work that does not have to compete
 * with the incoming screen's own rendering can wait for it.
 */
export const useHasScreenTransitionFinished = () => {
    const navigation = useNavigation<StackNavigationProps<ParamListBase, string>>();
    const [hasTransitionFinished, setHasTransitionFinished] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('transitionEnd', ({ data }) => {
            if (!data.closing) {
                setHasTransitionFinished(true);
            }
        });
        const fallbackTimeoutId = setTimeout(
            () => setHasTransitionFinished(true),
            TRANSITION_END_FALLBACK_MS,
        );

        return () => {
            unsubscribe();
            clearTimeout(fallbackTimeoutId);
        };
    }, [navigation]);

    return hasTransitionFinished;
};
```

exported from the package alongside the existing hooks in [`suite-native/navigation/src/index.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/navigation/src/index.ts):

```ts
export * from './hooks/useHasScreenTransitionFinished';
```

The account-detail call site then feeds it into the `isEnabled` flag the hook already has, so `useGraphData` itself is unchanged and the Home graph keeps its current behaviour:

```tsx
const hasScreenTransitionFinished = useHasScreenTransitionFinished();

const { refetchGraph: refetchAccountGraph } = useGraphData({
    instanceId: graphInstanceId,
    accounts,
    eventsAccount: accountItem,
    timeframeHours: accountGraphTimeframe,
    backendSymbol: accountItem?.symbol ?? 'btc',
    isEnabled: hasScreenTransitionFinished,
});
```

The gate only ever delays the **first** fetch. Once the flag is true it stays true, so a timeframe switch, a base-currency change or the retry button ([`AccountDetailGraph.tsx:79`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountDetailGraph.tsx#L79)) still dispatch immediately.

## Why it matters

The user taps an account row and the account-detail screen slides in. During that window the JS thread owes work to three different things: React's first render and commit of the screen (header, `FlashList`, first cells), the transaction list's own page-1 fetch effect ([`TransactionList.tsx:170`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L170)) and list-model rebuild ([`:210`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/transactions/src/components/TransactionList.tsx#L210), which is **p2-13**), and the graph pipeline above. Two of those produce what the user came to see. The third produces a chart that is behind a spinner regardless.

**What `n` is.** The transactions returned for the graph's timeframe — one month by default, the account's entire history on the "All" tab — folded once for the points and again for the event markers, because `AccountDetailGraph` passes the account as `eventsAccount` ([`:50`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountDetailGraph.tsx#L50)). Nothing bounds it but how much the user has transacted. The per-item cost is interpreted BigNumber arithmetic on Hermes.

**What the user sees after the fix.** The graph starts loading when the screen has landed instead of while it is arriving, so the chart appears later by about the length of the push. It cannot flash an empty or "price unavailable" state in the meantime: `selectGraphIsLoading` already defaults to `true` for an instance that has never fetched ([`graphSelectors.ts:30`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/graphSelectors.ts#L30)), and the unmount cleanup in `AccountDetailGraph` ([`:68`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountDetailGraph.tsx#L68), reducer at [`slice.ts:92`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/slice.ts#L92)) deletes the flag, so a remounted graph reads `true` again before anything is dispatched. `isTokenPriceUnavailable` ([`:76`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-accounts-management/src/components/AccountDetailGraph.tsx#L76)) is gated on `!isLoading`, so the hidden-graph branch cannot fire during the delay either. This is worth stating because the raw scan assumed the loading flag came only from `refetchGraphThunk.pending` ([`slice.ts:120`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/slice.ts#L120)) and that deferring the dispatch would therefore flash an empty graph — it does not.

A second, smaller win: a user who taps in and immediately backs out never starts the fetch at all, because the listener is removed on unmount and the flag never flips.

**Honest sizing.** Three things a reviewer should weigh against this:

- **The push animation is native, so nothing here is "animation jank".** `ios_from_right` is a react-native-screens stack animation run by the platform, and the swipe-back gesture is native too; a busy JS thread does not by itself drop those frames. The claim is narrower: the incoming screen's own content is what the JS thread should be producing while the screen slides, and the graph pipeline takes that thread away from it. If a reviewer does not accept that narrower claim, the issue should be closed.
- **The fix moves the work rather than removing it.** After the deferral the fold lands right as the user starts scrolling the transaction list. What stops it from monopolising the thread is the chunking in **p1-16**, not this issue. The two compose; neither is sufficient alone.
- **For a cold account the pipeline is network-bound anyway**, so most of it would land after the transition with or without this change, and what the gate removes from the transition window is only the synchronous head of the dispatch. The strong case is the warm-store path described in _Where_, which is also the common one when the user re-opens an account they were just looking at.

## Notes

- **`InteractionManager.runAfterInteractions` is not available as a fix here, and the raw scan's proposal to use it is wrong.** Verified in the installed source: `node_modules/react-native/Libraries/Interaction/InteractionManager.js` exports `InteractionManagerStub`, every member `@deprecated`; `runAfterInteractions` is a `setImmediate` in a promise with a `cancel()` that calls `clearImmediate`, `createInteractionHandle()` returns `-1`, `setDeadline()` is `// Do nothing.`. It has no knowledge of touches or animations. Worse for this defect specifically: with bridgeless enabled (`suite-native/app/android/gradle.properties:38`), `Libraries/Core/setUpTimers.js` shims `setImmediate` from `Timers/immediateShim.js`, which is `global.queueMicrotask(...)` — so `runAfterInteractions` would move the dispatch by **one microtask**, i.e. not even out of the mount effect's own task. It would be pure decoration. `skills/performance-scheduling/SKILL.md` still calls it React Native's nearest equivalent to `requestIdleCallback` and needs correcting.
- **`requestIdleCallback` does exist on this React Native** — same file installs it from `src/private/webapis/idlecallbacks/specs/NativeIdleCallbacks` in the bridgeless branch and from `JSTimers` in the bridge branch (this corroborates **p1-16**, which found the same thing) — but it is still the wrong tool here, and that is the point worth carrying back into the skill. Idle-ness of the _JS thread_ is not the same as the transition being over when the animation runs _natively_: the JS thread can go idle mid-slide and the idle callback would fire right back into the window we are trying to keep clear. That is why the After listens for the navigation event instead of reaching for the shared `runWhenIdle` helper.
- **`transitionEnd` is real on the pinned versions, verified in the installed source, not assumed.** `@react-navigation/native-stack@7.12.0` (`suite-native/app/package.json:37`) emits `{ type: 'transitionEnd', data: { closing: false } }` from the screen's `onAppear` in `lib/module/views/NativeStackView.native.js`, and its `lib/typescript/src/types.d.ts` declares `transitionEnd` in `NativeStackNavigationEventMap` with exactly that payload. `react-native-screens` is `4.26.2`. The repo already uses `@react-navigation/native` hooks widely (`useFocusEffect`, `useIsFocused`), but has no `transitionEnd` listener yet, so this is a new pattern in the codebase.
- **The fallback timeout is the weakest part of the After and a fair thing to push back on.** `AccountDetail` is always reached by a push, so `transitionEnd` should always arrive; the timeout exists only for the cases nobody has verified — a screen restored without an animation, or a platform where `onAppear` behaves differently — and for the theoretical race where the graph mounts after the event has already fired. Without it, a missing event means a graph that spins forever, which is a far worse failure than a late fetch. The value is a guess: long enough to outlast a push on a slow device, short enough that a missing event is not a visible hang. A reviewer may reasonably prefer dropping it and relying on the event, or replacing it with an explicit "already settled" check.
- **The `After` has not been compiled or run.** `StackNavigationProps` is the repo's own alias for `NativeStackNavigationProp` ([`types.tsx:23`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/navigation/src/types.tsx#L23)), which carries the native-stack event map, so `addListener('transitionEnd', …)` types without a cast. `@suite-native/module-accounts-management` already depends on `@suite-native/navigation`, so no new dependency edge.
- **Deliberately not changed: the Home portfolio graph.** [`PortfolioGraph.tsx:28`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/module-home/src/screens/HomeScreen/components/PortfolioGraph.tsx#L28) has the same mount effect and does more work (one balance history per account), but it is not behind a stack push — it mounts with a tab, or with the app — so `transitionEnd` may never fire for it and gating it on this hook would be wrong. Its case is a different one and needs a different lever.
- **Also deliberately not changed: `useGraphData`.** Putting the gate inside the shared hook would push the same assumption onto the Home path. Using the existing `isEnabled` parameter keeps `suite-native/graph` untouched and makes the deferral visible at the call site that has the transition.
- **Ordering and re-entrancy.** The gate only delays the dispatch; it does not reorder anything inside the pipeline. A late fetch that is superseded by a timeframe switch is still discarded by the `lastFetchTimestamps` check at [`graphThunks.ts:119`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/graph/src/graphThunks.ts#L119). One thing to watch: the fetch now starts after the first commit rather than during it, so a `refetchGraph` identity change that happens in between (account list churn while discovery is running) can make the effect fire once with the pre-churn accounts and once after — the same behaviour as today, just shifted.
- **Tests.** Nothing currently covers `useGraphData` or `AccountDetailGraph`; the graph package's tests are `selectors.test.ts`, `utils.test.ts` and `graphTimeframe.test.ts`, none of which mount a component. A test for the new hook would need to fake the navigation event and the timer, which is doable but was not written here.
- **Package impact: none.** `@suite-native/navigation`, `@suite-native/graph` and `@suite-native/module-accounts-management` are all `private: true`. Unlike most documents in this sweep this one adds nothing to `@trezor/utils`, because neither `yieldToMain` nor `runWhenIdle` is the right primitive for it.
- **Cross-references.** **p1-16** chunks the fold this effect kicks off — land it and the collision this issue describes stops being damaging even before this fix. **p2-13** is the transaction list rebuilding on the same screen at the same time. All three are the account-detail screen's mount, and a reviewer may reasonably want them as one PR.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
