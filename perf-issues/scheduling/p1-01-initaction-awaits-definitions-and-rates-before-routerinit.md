# Suite start awaits token definitions and two fiat-rate round trips before `routerInit()`, so nothing in the app is reachable until they resolve

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_. This is not a long task; it is three network chains that the boot sequence happens to `await` on the wrong side of the gate that un-blocks the router. The app cannot paint anything but the spinner until a token-definitions JSON per enabled network and two chained fiat-rate fetches have come back, and none of the components that consume that data need it to mount.

## Where

[`packages/suite/src/actions/suite/initAction.ts:98`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L98), [`:101`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L101), [`:107`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L107), [`:115`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L115) — the gate is [`:118`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L118).

`init()` is one long `async` function of numbered steps. Steps 8, 9 and 10 are all `await`ed, and step 11 is `dispatch(routerInit())`. That dispatch is what eventually sets `router.loaded`: `routerInit` ([`suite/router/src/routerThunks.ts:62`](https://github.com/trezor/trezor-suite/blob/develop/suite/router/src/routerThunks.ts#L62)) dispatches `onLocationChange`, whose `routerLocationChange` reducer sets `state.loaded = true` ([`suite/router/src/routerReducer.ts:75`](https://github.com/trezor/trezor-suite/blob/develop/suite/router/src/routerReducer.ts#L75)). Four lines later, step 16 dispatches `onSuiteReady()` ([`packages/suite/src/actions/suite/suiteActions.ts:103`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/suiteActions.ts#L103)), whose `SUITE.READY` sets `lifecycle.status = 'ready'` ([`packages/suite/src/reducers/suite/suiteReducer.ts:94`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/suite/suiteReducer.ts#L94)). Both are read by the same condition:

[`packages/suite/src/components/suite/Preloader/Preloader.tsx:109`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/Preloader/Preloader.tsx#L109)

```tsx
if (lifecycle.status !== 'ready' || !router.loaded || !isTransportInitialized) {
    // TODO: multiplied by 5, temporarily. Now initActions incorrectly awaits altcoin specific logic which can trigger this timeout easily for bigger accounts
    return <InitialLoading timeout={90 * 5} />;
}
```

So every `await` between `init()`'s entry and line 118 is in front of the app's first usable paint, and the file above already says so in its own TODO — the spinner timeout is `90 * 5` seconds because of it.

What is being awaited:

- **Step 8** — `periodicCheckTokenDefinitionsThunk` ([`suite-common/token-definitions/src/tokenDefinitionsThunks.ts:106`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L106)) awaits `initTokenDefinitionsThunk`, a `Promise.all` over one fetch per enabled network per supported definition type ([`:54`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L54)–[`:82`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsThunks.ts#L82)).
- **Steps 9** — two separate `periodicFetchFiatRatesThunk` calls, `current` then `lastWeek`, awaited one after the other although neither reads the other's result. Each one internally chunks its ticker list four at a time and **chains** the chunks ([`suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts:383`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts#L383)–[`:406`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts#L406)), so its depth grows with the number of held tokens.
- **Step 10** — `updateMissingTxFiatRatesThunk` with no `accountKey`, i.e. a scan of every persisted transaction across every remembered wallet. That scan is its own defect and is drafted separately as `p1-03`; this document only removes the `await`.

## Before

```ts
    // 7. init backends
    await dispatch(initBlockchainThunk())
        .unwrap()
        .catch(err => console.error(err));

    // 8. fetch token definitions (has to be fetched before fiat rates)
    await dispatch(periodicCheckTokenDefinitionsThunk());

    // 9. init periodic fetching of fiat rates
    await dispatch(
        periodicFetchFiatRatesThunk({
            rateType: 'current',
            localCurrency,
        }),
    );
    await dispatch(
        periodicFetchFiatRatesThunk({
            rateType: 'lastWeek',
            localCurrency,
        }),
    );

    // 10. fetch rates for transactions with missing rates
    await dispatch(updateMissingTxFiatRatesThunk({ localCurrency }));

    // 11. dispatch initial location change
    dispatch(routerInit());

    // 12. fetch metadata. metadata is not saved together with other data in storage.
    // historically it was saved in indexedDB together with devices and accounts and we did not need to load them
    // immediately after suite start.
    dispatch(metadataLabelingActions.fetchAndSaveMetadataForAllDevices());

    // 13. start fetching staking data if needed, does need to be waited
    dispatch(periodicCheckStakeDataThunk());

    // 14. init wallet connect
    dispatch(walletConnectActions.walletConnectInitThunk());
    // 15. bio auth
    if (isDesktop()) {
        dispatch(bioAuthThunks.init());
    }
    // 16. backend connected, suite is ready to use
    dispatch(onSuiteReady());
};
```

## After

```ts
    // 7. init backends
    await dispatch(initBlockchainThunk())
        .unwrap()
        .catch(err => console.error(err));

    // 8. dispatch initial location change
    dispatch(routerInit());

    // 9. fetch metadata. metadata is not saved together with other data in storage.
    // historically it was saved in indexedDB together with devices and accounts and we did not need to load them
    // immediately after suite start.
    dispatch(metadataLabelingActions.fetchAndSaveMetadataForAllDevices());

    // 10. start fetching staking data if needed, does need to be waited
    dispatch(periodicCheckStakeDataThunk());

    // 11. init wallet connect
    dispatch(walletConnectActions.walletConnectInitThunk());
    // 12. bio auth
    if (isDesktop()) {
        dispatch(bioAuthThunks.init());
    }
    // 13. backend connected, suite is ready to use
    dispatch(onSuiteReady());

    // 14. definitions and rates are not needed to render the app, so they run once it is on
    // screen. token definitions still have to be fetched before fiat rates.
    runWhenIdle(
        async () => {
            await dispatch(periodicCheckTokenDefinitionsThunk());

            await Promise.all([
                dispatch(periodicFetchFiatRatesThunk({ rateType: 'current', localCurrency })),
                dispatch(periodicFetchFiatRatesThunk({ rateType: 'lastWeek', localCurrency })),
            ]);

            dispatch(updateMissingTxFiatRatesThunk({ localCurrency }));
        },
        { timeout: 2000 },
    );
};
```

`runWhenIdle` is the shared `requestIdleCallback` helper introduced by whichever of these scheduling issues lands first (`packages/utils/src/runWhenIdle.ts`, exported from `@trezor/utils`); the import goes at the end of the existing `@trezor/*` group, after `@trezor/suite-desktop-api`.

## Why it matters

The user has just launched Suite and is looking at `InitialLoading`. Nothing is reachable — not the dashboard, not the coin list, not settings — because the router itself is not loaded. Today that wait includes, in series: one HTTP fetch per enabled network per definition type, then a chain of `⌈tickers / 4⌉` sequential rate requests for `current`, then the same chain again for `lastWeek`, then a full scan of persisted transactions. Both `n`s are user data — the enabled-coin list and the number of held tokens — and neither is bounded by the app.

The costs add rather than overlap, which is the part that is wrong regardless of the deferral: the `current` and `lastWeek` fetches read nothing from each other and are still awaited one after the other. The definitions fetch genuinely must precede the rates (the comment at `:97` is a real dependency), but neither must precede `routerInit()`.

There is no warm path that makes this cheap on a returning user. Storage persists only the per-network hide/show lists, not the definition data: `buildTokenDefinitionsFromStorage` writes `data: undefined` for every network it restores ([`suite-common/token-definitions/src/tokenDefinitionsUtils.ts:90`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsUtils.ts#L90)), so `initTokenDefinitionsThunk`'s "skip what already has data" filter never hits on a cold store and the fetch runs on every single start.

After the change the gate depends only on steps 1–7 and the transport event. Definitions and rates arrive into an app the user is already looking at.

## Notes

- **The After hunk has not been compiled.** It is written against the surrounding types by reading.
- **Most of the win is in dropping the `await`, not in the idle wrap.** Moving `routerInit()` above the fetches is what un-gates the app; `runWhenIdle` only additionally keeps the fetch/parse work out of the frames where React is mounting the tree. A reviewer who is unconvinced by the idle callback should still take the reordering — and equally, a reviewer could ask for the fetches to start immediately (unawaited) rather than at idle, which is a defensible smaller change.
- **`Promise.all` on the two rate fetches is independently worth taking.** It halves the rate chain even if everything else in this document is rejected.
- **User-visible: fiat values render blank for a moment.** `BaseCurrencyValue` returns `null` when there is no rate yet ([`packages/suite/src/components/suite/BaseCurrencyValue.tsx:143`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/BaseCurrencyValue.tsx#L143)), and its loading skeleton does **not** cover this case: the skeleton at [`:103`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/BaseCurrencyValue.tsx#L103)–[`:112`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/BaseCurrencyValue.tsx#L112) requires `isTokenKnown`, which is false whenever definitions are missing and permanently false on networks with no coin-definitions feature. So it is blank, not a skeleton. The components tolerate it — they must, since these fetches can fail outright — but "tolerate" is not "look right", and this is the single most likely reason to push back on the change.
- **User-visible, worse: tokens are briefly classified as unverified.** `isTokenDefinitionKnown` returns `false` when the definitions are absent ([`suite-common/token-definitions/src/tokenDefinitionsUtils.ts:31`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/token-definitions/src/tokenDefinitionsUtils.ts#L31)), and `getTokens` routes every unknown token on a definitions-enabled network into `unverified` ([`suite-common/wallet-core/src/tokens/tokenUtils.ts:85`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/tokens/tokenUtils.ts#L85)). A token row would therefore appear under "unverified" and then move into the shown list when the definitions land, and the dashboard total would change with it. That is a real flicker, not a cosmetic one. Mitigating it properly means giving the token views a "definitions not fetched yet" state — deliberately **not** attempted here, because it is a UI change with its own review surface. If the reviewer wants no flicker at all, the honest compromise is to keep step 8 awaited and defer only steps 9 and 10.
- **Window visibility.** `periodicFetchFiatRatesThunk` skips the fetch and only arms its timer when the window is hidden ([`suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts:443`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesThunks.ts#L443)). Deferring widens the window in which the user could background the app between `init()` and the callback; if that happens, `lastWeek` rates first arrive an hour later ([`fiatRatesConstants.ts:15`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/fiat-rates/fiatRatesConstants.ts#L15)). Unlikely during a boot the user is watching, but it is a new way to lose the first fetch.
- **Why `timeout: 2000`.** Rates are data the user actively looks for, so the ceiling should be short — this is not telemetry. The timeout is a guarantee, not a delay: on a boot with any idle gap the callback fires well before it, and on a page that never idles it fires at 2 s.
- **Re-entrancy is safe.** `init()` returns early on `status !== 'initial'` ([`initAction.ts:42`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L42)) and `SUITE.INIT` at `:44` has already moved it to `loading`, so an earlier `onSuiteReady()` cannot trigger a second `init()`.
- **No cancellation.** `init()` is a thunk with no teardown hook, so there is nowhere natural to park the idle-callback id. In practice the store outlives the callback (a reload tears down the whole page on web and the whole renderer on desktop), so this is noted rather than fixed.
- **Tests: this is where the work is.** [`packages/suite/src/actions/suite/initAction.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts) asserts the **exact ordered list** of dispatched action types for four fixtures, and each of them places `routerInit.pending` after `updateMissingTxFiatRatesThunk.fulfilled` ([`:151`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts#L151)–[`:165`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts#L165), [`:200`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts#L200)–[`:214`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts#L214), [`:251`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts#L251)–[`:265`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts#L265)). All of them need reordering, and the definition/rate actions no longer land inside the awaited `init()` at all, so the fixtures must either mock the idle helper or drive it with fake timers. Worth extending them with an assertion that `routerInit.pending` precedes `periodicCheckTokenDefinitionsThunk.pending` — that is the property this change is actually about, and nothing asserts it today.
- **Platform.** Web and desktop only; `packages/suite` is not a published package. Safari has no `requestIdleCallback`, hence the `setTimeout` fallback inside `runWhenIdle`; `suite-desktop` is Chromium and always has the real API.
- **Deliberately not changed here:** the `await` on `initBlockchainThunk` at `:93` (that is `p1-02`, and it is very likely the larger of the two — it waits on a websocket handshake to every coin backend), and the unbounded scan inside `updateMissingTxFiatRatesThunk` itself (`p1-03`). Whichever of the three lands second will need a small rebase in this file. The numbered-comment structure is kept and just renumbered, even though the file's own TODO at `:56`–`:58` asks for `init()` to be split into functions.
- **Sibling in the same file:** `p2-01` covers the metadata fan-out at `:123`. Different argument — that one is not awaited and does not hold the gate; it competes with the first render.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
