# Discovery creates every buffered account in one task, and each account fans out into a dozen more dispatches

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and
yield to the main thread"_. This is the skill's own worked example: the `bad` hunk in that section is
this exact line, and the `good` hunk is the chunked-by-25 version. So this document is the canonical
first consumer of `yieldToMain`, and it is the one that **specifies the helper in full** — every other
document in this set says "introduced by whichever of these issues lands first" and shows only its call
site.

The scanner's added value over the skill is the fan-out: one `createAccount` dispatch is not one reducer
write. It expands into roughly a dozen further dispatches through a ~30-middleware chain, plus two
IndexedDB transactions and a `TrezorConnect.blockchainSubscribe`. So the queue drain is not `k` reducer
writes in a task, it is `~12k` chain traversals in a task.

## Where

[`suite-common/wallet-core/src/discovery/discoveryThunks.ts:468`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L468)
— the `accountQueue.forEach` inside `onBundleProgress`, the synchronous `UI_REQUEST.BUNDLE_PROGRESS`
handler registered at
[`:479`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L479)
and removed at
[`:503`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L503).

### What the queue is for

`accountQueue` is declared at
[`:439`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L439)
under the comment _"we do not create empty accounts right away, but store the progress events for
later"_. Connect emits one progress event per discovered account. The handler buffers instead of
dispatching while `!discoveryPayload.hasLoadedAnyNonEmptyAccount && event.progress !== 100`
([`:453`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L453)),
and `discoveryPayload.hasLoadedAnyNonEmptyAccount` is `discovery.hasLoadedAnyNonEmptyAccount ||
!accountInfo.empty`
([`:221`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L221)).
So **every account in the queue is an empty account, and the queue holds only the run of empty accounts
before the first funded one** — that is the whole reason for the buffer. The hidden-wallet flow depends
on it: `applyDeviceStatesThunk` is dispatched at
[`:459`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L459)
_before_ the drain, so the passphrase wallet's device state is registered in the store before any
account referencing that `deviceState` lands. The `accountQueue.splice(0, accountQueue.length)` at
[`:471`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L471)
empties the buffer so the trailing `dispatch(createAccount(accountPayload))` at
[`:473`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/discovery/discoveryThunks.ts#L473)
— the account that _triggered_ the drain — always lands last.

### How big it gets

`n` is the number of empty accounts walked before the first funded one, or **every account of the whole
run** when the wallet is entirely empty — in that case no event ever satisfies the drain condition until
`event.progress === 100`, and the last event dumps the lot. Discovery walks one account per account type
per enabled network (`btc` alone declares `taproot`, `segwit` and `legacy` on top of `normal` —
[`networksConfig.ts:23-43`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-config/src/networksConfig.ts#L23)),
plus one extra per already-used chain
([`selectors.ts:142-151`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/selectors.ts#L142)).
A user with a broad set of networks enabled and an empty or nearly-empty wallet is in the dozens; there
is no cap, only the network catalogue and how far down the coin list the first funded account happens to
sit.

### What one `createAccount` actually costs

Verified by reading each reactor. On web/desktop, per dispatched account:

| Reactor                                                                                                                                                 | Cost                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`metadataMiddleware.ts:15`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataMiddleware.ts#L15)                          | rewrites `action.payload` via `setAccountMetadataKey` → HMAC-SHA256 + base58check + HMAC-SHA512 ([`metadataUtils.ts:21`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataUtils.ts#L21), [`:37`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataUtils.ts#L37)), when labeling is enabled                                                                                                                                                      |
| [`logsMiddleware.ts:69`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/logger/src/logsMiddleware.ts#L69)                             | **+1 dispatch** — `addLog` with a spread copy of the account                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| [`sentryMiddleware.ts:54`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/suite/sentryMiddleware.ts#L54)            | a Sentry breadcrumb                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| [`accountsReducer.ts:119`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/accounts/accountsReducer.ts#L119)           | `findIndex` over the accounts array + `splice`, to keep canonical coin order                                                                                                                                                                                                                                                                                                                                                                                                                                |
| [`walletMiddleware.ts:43`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/walletMiddleware.ts#L43)           | **+1 dispatch** — `addTransaction`, and nested in _that_ pass: **+1** `updateTxsFiatRatesThunk` ([`fiatRatesMiddleware.ts:50`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts#L50)) and `removeAccountTransactions` + **+1** `saveAccountTransactions` — two IndexedDB transactions ([`storageMiddleware.ts:170`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L170)) |
| [`walletMiddleware.ts:56`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/walletMiddleware.ts#L56)           | **+1 dispatch** — `subscribeBlockchainThunk`, whose body rescans **all** accounts in the store ([`blockchainThunks.ts:184`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/blockchain/blockchainThunks.ts#L184)) and posts a `blockchainSubscribe` to Connect                                                                                                                                                                                                             |
| [`fiatRatesMiddleware.ts:32`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts#L32)   | **+2 dispatches** — `fetchFiatRatesThunk` for `current` and `lastWeek`                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [`fiatRatesMiddleware.ts:113`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesMiddleware.ts#L113) | **+1 dispatch** — `updateFiatRatesThunk` for the account ticker plus one per token                                                                                                                                                                                                                                                                                                                                                                                                                          |
| [`storageMiddleware.ts:111`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L111)       | `saveAccounts([account])` + **+1 dispatch** `saveCoinjoinAccount` — gated on the device being remembered ([`:320`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/storageMiddleware.ts#L320)), which it is by default ([`deviceUtils.ts:29-40`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/device/src/deviceUtils.ts#L29))                                                                                                                 |

That is eight child dispatches, and every one of them — plus each thunk's own `pending`/`fulfilled`
actions — traverses the full chain: 14 suite middlewares
([`middlewares/suite/index.ts:26-41`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/suite/index.ts#L26))

- 15 wallet middlewares
  ([`middlewares/wallet/index.ts:33-49`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/middlewares/wallet/index.ts#L33))
- toast, onboarding, backup and RTK's defaults.

## Before

`suite-common/wallet-core/src/discovery/discoveryThunks.ts:438-477`

```ts
// we do not create empty accounts right away, but store the progress events for later
const accountQueue: CreateAccountActionProps[] = [];
const onBundleProgress = (event: ProgressEvent) => {
    const currentDiscovery = selectDiscoveryByDevicePath(getState(), device.path);
    if (!currentDiscovery) {
        return console.error('bundle progress handler: no discovery found');
    }

    const { accountPayload, discoveryPayload } = transformProgressEventData(
        event,
        deviceState.staticSessionId,
        currentDiscovery,
    );

    // no non-empty account encountered and not the last event, enqueue account for postponed creation
    if (!discoveryPayload.hasLoadedAnyNonEmptyAccount && event.progress !== 100) {
        accountQueue.push(accountPayload);
    } else {
        // first non-empty account encountered right now or the last event, create all enqueued accounts first
        if (!currentDiscovery.hasLoadedAnyNonEmptyAccount) {
            if (isAddingHiddenWallet && discoveryPayload.hasLoadedAnyNonEmptyAccount) {
                dispatch(
                    applyDeviceStatesThunk({
                        newDeviceState: deviceState,
                        isAddingHiddenWallet,
                        devicePath: passedDevice.path,
                    }),
                );
            }

            accountQueue.forEach(account => dispatch(accountsActions.createAccount(account)));
            accountQueue.splice(0, accountQueue.length);
        }
        dispatch(accountsActions.createAccount(accountPayload));
    }

    dispatch(discoveryActions.updateDiscovery(discoveryPayload, device.path));
};
```

`suite-common/wallet-core/src/discovery/discoveryThunks.ts:503`

```ts
TrezorConnect.off(UI_REQUEST.BUNDLE_PROGRESS, onBundleProgress);
```

## After

### The shared helper — `packages/utils/src/yieldToMain.ts` (new)

This issue introduces it; the other `long-task` documents in this set defer to whichever of them lands
first. `@trezor/utils` is one-function-per-file with `export * from './name'` in `index.ts` and a
colocated `.test.ts`, so this follows that shape. `scheduler-polyfill` is deliberately **not** added.

```ts
type SchedulerWithYield = { yield?: () => Promise<void> };

/**
 * Hands the main thread back so queued input, rendering and other tasks can run before the caller
 * continues. `scheduler.yield()` resumes at the front of the task queue; the `setTimeout` fallback
 * (Safari, React Native) resumes at the back, and browsers clamp it to 5 ms after five nested
 * timeouts — so it is the fallback, not the target.
 */
export const yieldToMain = (): Promise<void> => {
    const { scheduler } = globalThis as { scheduler?: SchedulerWithYield };

    if (scheduler?.yield) {
        return scheduler.yield();
    }

    return new Promise(resolve => {
        setTimeout(resolve, 0);
    });
};
```

Add `export * from './yieldToMain';` to `packages/utils/src/index.ts` in its alphabetical slot.

### The call site

`suite-common/wallet-core/src/discovery/discoveryThunks.ts` — alongside `USER_UI_CANCEL_CODE` at `:54`:

```ts
const ACCOUNT_QUEUE_BATCH_SIZE = 25;
```

and the handler:

```ts
// we do not create empty accounts right away, but store the progress events for later
const accountQueue: CreateAccountActionProps[] = [];
let accountQueueDrain: Promise<void> | undefined;

const drainAccountQueue = async () => {
    while (accountQueue.length > 0) {
        accountQueue
            .splice(0, ACCOUNT_QUEUE_BATCH_SIZE)
            .forEach(account => dispatch(accountsActions.createAccount(account)));

        await yieldToMain();
    }
};

// a progress event arriving mid-drain pushes onto the same queue instead of starting a
// second one, so accounts are always created in the order Connect reported them
const drainAccountQueueOnce = () => {
    if (!accountQueueDrain) {
        accountQueueDrain = drainAccountQueue().finally(() => {
            accountQueueDrain = undefined;
        });
    }

    return accountQueueDrain;
};

const onBundleProgress = (event: ProgressEvent) => {
    const currentDiscovery = selectDiscoveryByDevicePath(getState(), device.path);
    if (!currentDiscovery) {
        return console.error('bundle progress handler: no discovery found');
    }

    const { accountPayload, discoveryPayload } = transformProgressEventData(
        event,
        deviceState.staticSessionId,
        currentDiscovery,
    );

    accountQueue.push(accountPayload);

    // no non-empty account encountered and not the last event, leave the account enqueued
    if (discoveryPayload.hasLoadedAnyNonEmptyAccount || event.progress === 100) {
        if (
            !currentDiscovery.hasLoadedAnyNonEmptyAccount &&
            isAddingHiddenWallet &&
            discoveryPayload.hasLoadedAnyNonEmptyAccount
        ) {
            dispatch(
                applyDeviceStatesThunk({
                    newDeviceState: deviceState,
                    isAddingHiddenWallet,
                    devicePath: passedDevice.path,
                }),
            );
        }

        drainAccountQueueOnce();
    }

    dispatch(discoveryActions.updateDiscovery(discoveryPayload, device.path));
};
```

and at `:503`, where the listener is removed:

```ts
TrezorConnect.off(UI_REQUEST.BUNDLE_PROGRESS, onBundleProgress);

// the drain outlives the listener - discovery is not complete until every account exists
await drainAccountQueueOnce();
```

## Why it matters

The user has just plugged in and unlocked their Trezor. Unlike the startup path, **the app is fully
interactive during discovery** — `DiscoveryProgress` is a thin fixed bar at the top of `SuiteLayout`
([`SuiteLayout.tsx:127`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/layouts/SuiteLayout/SuiteLayout.tsx#L127),
[`DiscoveryProgress.tsx:16`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/wallet/DiscoveryProgress.tsx#L16)),
and the dashboard sits underneath it with accounts appearing as they are found. So the blocked
interactions are concrete: clicking an account that just appeared, opening settings, switching device,
scrolling the account list, and the progress bar's own repaint — `updateDiscovery` is dispatched at
`:476`, _after_ the drain, so the bar cannot even advance to the value that triggered it. On the
hidden-wallet path the user is instead staring at `DiscoveryLoader`'s spinner
([`PassphraseModal.tsx:97`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/modals/ReduxModal/DeviceContextModal/PassphraseModal.tsx#L97)),
which stops animating for the duration.

`n` is unbounded by anything the code controls — it is the run of empty accounts before the first funded
one, which for an empty wallet is the entire discovery. Multiply that by ~12 chain traversals, two
IndexedDB transactions and one Connect message per account and the task is `O(n)` with a large constant.
The 50 ms long-task threshold is the spec's number, not a measurement of this call site.

After the fix each task covers at most 25 accounts and the thread is free in between, so a click landing
mid-discovery waits for one batch rather than the whole queue. Nothing about how fast discovery finishes
changes; only when the thread is available.

## Notes

- **This is the skill's named example.** `skills/performance-scheduling/SKILL.md:24` quotes
  `accountQueue.forEach(account => dispatch(accountsActions.createAccount(account)))` verbatim as the
  `bad` hunk and lines 27-33 give the chunked-by-25 `good` hunk. The document's job is to turn that
  snippet into a change that actually compiles against the real handler — which is where the two
  complications below come from, neither of which the skill's snippet shows.
- **`onBundleProgress` is synchronous, so it cannot `await`.** The drain is extracted into an async
  helper kicked off without awaiting. `drainAccountQueueOnce` is the single-flight guard: a later
  progress event pushes onto the same array and the running `while` loop picks it up after its next
  yield, so there is never a second concurrent drain and never an out-of-order dispatch.
- **The trailing account must go through the queue, not around it.** Today `:471`'s splice guarantees
  the buffer is empty before `:473` dispatches the triggering account, so buffered accounts always land
  first. With an async drain, dispatching `:473` separately would jump it ahead of accounts still in
  flight. The `After` pushes it onto the queue instead — a behaviour-preserving change only because the
  drain is strictly ordered.
- **The `await` after `TrezorConnect.off` is load-bearing and is not in the skill's snippet.** Without
  it, `completeDiscovery` at `:526`/`:540` would run while accounts are still being created: it dispatches
  `updateDiscovery({ status: 'complete' })` — flipping the UI out of the loading state and detaching the
  progress bar — and reads `selectAccountsByDeviceState` for its analytics loop, which would miss the
  accounts still queued. The e2e helper `discoveryShouldFinish`
  ([`enhancePage.ts:75-86`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/support/testExtends/enhancePage.ts#L75))
  waits for exactly that bar to detach, so any test asserting on account rows immediately afterwards
  would flake without the await. A reviewer should treat this line as the riskiest part of the change.
- **Why 25 and not smaller, despite the fan-out.** The fan-out is heavy but the queued accounts are
  _empty by construction_, so the per-account cost is almost entirely fixed overhead — chain traversals,
  one sorted insert, two IndexedDB transaction opens — and barely varies with the account. Notably
  `addTransaction` returns immediately at
  [`transactionsReducer.ts:64`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsReducer.ts#L64)
  (`transactions.length < 1`), so no history is written even though the dispatch and both IndexedDB
  writes still happen. A fixed count is therefore the right knob and 25 is a predictable ceiling. Keeping
  the skill's number also keeps its example honest. Where to push back: when metadata labeling is
  enabled, `metadataMiddleware` adds two HMAC derivations per account, and a profile of that
  configuration could justify 10 instead. The constant is the one thing here worth tuning with a
  measurement rather than an argument.
- **Chunking multiplies renders.** All dispatches in one task collapse into a single render pass; ⌈n/25⌉
  tasks means ⌈n/25⌉ render passes of everything subscribed to the accounts list. That is a real added
  cost, partly offset by the fact that those renders are what make accounts appear progressively rather
  than in one jump. A reviewer entitled to reject this issue would reject it here.
- **One user-visible ordering change, on native.** `updateDiscovery` is now dispatched while the queued
  accounts are still landing rather than after them. On the native passphrase flow,
  `selectPassphraseDiscoveryCompleted`
  ([`passphraseSelectors.ts:62-65`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/passphrase/src/passphraseSelectors.ts#L62))
  navigates to the initial screen the moment `hasLoadedAnyNonEmptyAccount` flips
  ([`useRedirectOnPassphraseCompletion.ts:37`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/passphrase/src/useRedirectOnPassphraseCompletion.ts#L37)),
  so the wallet screen would open with its first accounts still streaming in. That is arguably the
  better behaviour, but it is a change and it should be checked on device.
- **Cancellation.** There is none, and none is added. `cancelDiscoveryThunk` calls `TrezorConnect.cancel`
  and sets status `cancelled`; a drain already in flight keeps creating accounts. That is the behaviour
  today too — the synchronous drain simply finished before anything could cancel it. If a reviewer wants
  it, the loop should re-check `isDiscoveryInProgress(selectDiscoveryByDevicePath(...))` after each
  `yieldToMain()` and bail; it is left out to keep the change reviewable, and because bailing mid-drain
  leaves a partially-populated wallet, which needs its own thinking.
- **Adjacent, deliberately not fixed.** Two complexity defects sit inside this loop and belong to
  [`../asymptotic-complexity`](../asymptotic-complexity), not here: `accountsReducer.ts:119` does a
  `findIndex` per insert, making the drain quadratic in the accounts already present, and
  `subscribeBlockchainThunk` rescans every account in the store on each `createAccount`
  (`blockchainThunks.ts:184`) and re-subscribes the whole network each time. Yielding spreads both out;
  it does not reduce either.
- **Platform.** `discoveryThunks.ts` is `suite-common`, so this runs on web, the Electron renderer and
  the React Native JS thread. `yieldToMain` is RN-safe — Hermes has no `scheduler.yield`, so it takes the
  `setTimeout` branch. `runWhenIdle` is **not** used here; this is a `long-task` fix, not a
  `non-essential` one. The fan-out table above is web/desktop: native's chain
  ([`suite-native/state/src/store.ts:83-94`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/store.ts#L83))
  has no `walletMiddleware`, `storageMiddleware` or `metadataMiddleware`, so per-account it pays the
  `fiatRatesMiddleware` dispatches and the reducer insert but not the IndexedDB writes or the HMACs. The
  loop is still worth chunking there — the RN JS thread has no second core to hide behind — but the
  native win is smaller than the desktop one.
- **`@trezor/utils` is a published package**, so `yieldToMain` is a published-API addition.
  `suite-common/wallet-core` already depends on it (`package.json:57`), though `discoveryThunks.ts` does
  not import from it yet — the import goes in the `@trezor/*` group after `@trezor/crypto-utils`.
- **`scheduler.yield` may not be in the TypeScript DOM lib.** The helper narrows through a local
  `SchedulerWithYield` type rather than relying on ambient typings, so it compiles regardless.
  `packages/utils/tsconfig.json` sets `skipLibCheck: false`, which is one more reason not to add a global
  declaration.
- **Tests.** There is no unit test for `discoveryThunks.ts` at all — `suite-common/wallet-core/src/discovery/`
  contains only `discoveryReducer.test.ts`, which does not touch the handler. So nothing breaks, and
  nothing covers the new ordering guarantees either. A test that feeds synthetic `BUNDLE_PROGRESS` events
  and asserts (a) buffered accounts precede the triggering one, (b) `applyDeviceStatesThunk` precedes all
  of them, and (c) the drain promise resolves before `completeDiscovery` runs would be new work and is
  the strongest argument for filing this before the other `long-task` issues.
- **The `After` hunks have not been compiled.** They are written against the surrounding types by
  reading, not by running `tsc`. `runDiscoveryThunk`'s body is already `async`, so the added `await` needs
  no signature change.
- **Cross-reference [`p1-08`](p1-08-discovery-completion-fires-analytics-synchronously.md)**, the
  analytics half of the same moment: `completeDiscovery` at `discoveryThunks.ts:284` fires one
  `reportAccountInfoThunk` per account, and `analyticsMiddleware.ts:186` runs four whole-account-list
  scans, both on the tick this drain feeds. They are separable — `p1-08` is `non-essential` and wants
  `runWhenIdle`, this one is `long-task` and wants `yieldToMain` — but a reviewer looking at discovery
  completion should read them together, and the `await` added here is what makes `p1-08`'s deferred
  account list complete.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
