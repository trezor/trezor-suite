# `fetchAndSaveMetadataForAllDevices` fans out a cloud fetch, an AES decrypt and a JSON parse per labelable entity while Suite is doing its first render

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_. The dispatch is not awaited, so unlike its neighbours in the same function it does not hold the loading gate; what it does is start a fan-out whose synchronous decrypt-and-parse work lands, response by response, in exactly the frames where React is mounting the app tree.

## Where

[`packages/suite/src/actions/suite/initAction.ts:123`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L123) — step 12 of `init()`, twelve lines before `onSuiteReady()` at [`:135`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.ts#L135).

`fetchAndSaveMetadataForAllDevices` ([`suite/metadata/src/metadataLabelingActions.ts:271`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataLabelingActions.ts#L271)) returns immediately if labeling is off, and otherwise dispatches `fetchAndSaveMetadata` once per remembered device that has metadata keys ([`:278`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataLabelingActions.ts#L278)–[`:285`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataLabelingActions.ts#L285)). Each of those does one `getProviderDetails()` round trip, then fans out again over `selectLabelableEntities` — the device plus every account belonging to it ([`suite/metadata/src/metadataReducer.ts:273`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataReducer.ts#L273)) — and awaits a `Promise.all` over them:

[`suite/metadata/src/metadataLabelingActions.ts:235`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataLabelingActions.ts#L235)

```ts
const labelableEntities = dispatch(getLabelableEntities(device.state.staticSessionId));
const promises = labelableEntities.map(entity =>
    dispatch(fetchMetadata({ provider, entity })).then(result => {
        if (result) {
            dispatch(metadataDataThunks.setMetadata({ ...result, provider }));
        }
    }),
);
await Promise.all(promises);
```

Per entity, `fetchMetadata` does a cloud `getFileContent(fileName)` ([`:72`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataLabelingActions.ts#L72)) and then, on the main thread, a synchronous AES-GCM decrypt plus `JSON.parse` of the plaintext ([`:83`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataLabelingActions.ts#L83), body at [`suite/metadata/src/metadataUtils.ts:109`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataUtils.ts#L109)).

## Before

```ts
// 12. fetch metadata. metadata is not saved together with other data in storage.
// historically it was saved in indexedDB together with devices and accounts and we did not need to load them
// immediately after suite start.
dispatch(metadataLabelingActions.fetchAndSaveMetadataForAllDevices());
```

## After

```ts
// 12. fetch metadata. metadata is not saved together with other data in storage.
// historically it was saved in indexedDB together with devices and accounts and we did not need to load them
// immediately after suite start.
runWhenIdle(() => dispatch(metadataLabelingActions.fetchAndSaveMetadataForAllDevices()), {
    timeout: 1000,
});
```

`runWhenIdle` is the shared `requestIdleCallback` helper introduced by whichever of these scheduling issues lands first (`packages/utils/src/runWhenIdle.ts`, exported from `@trezor/utils`); the import goes at the end of the existing `@trezor/*` group, after `@trezor/suite-desktop-api`.

## Why it matters

The user has just launched Suite and the app tree is mounting. `n` is devices × (accounts + 1) labelable entities, and it is not bounded — a user with several remembered wallets and many accounts fans out to that many independent HTTP requests, each of which comes back at its own moment and each of which is followed by a synchronous decrypt and parse. Those decrypts are interleaved with the first render rather than replacing it, so the cost is spread rather than a single block, but it is spread over precisely the interval that matters.

**Honest sizing: this is small, and smaller than it first looks.**

- It only runs at all when a legacy metadata provider is connected — `metadata.enabled` false returns at [`:274`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataLabelingActions.ts#L274), and the whole surface is marked `@deprecated Legacy Labeling` ([`metadataReducer.ts:271`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataReducer.ts#L271)) and gated off entirely when Suite Sync is on ([`suite/metadata/src/selectIsLegacyLabelingVisible.ts:14`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/selectIsLegacyLabelingVisible.ts#L14)). The affected population is a shrinking subset of users.
- The dispatch is already unawaited, so no gate moves. The only thing that changes is when the fan-out starts.
- The idle wrap does not make a single decrypt cheaper. If the real cost turns out to be the decrypt itself on a wallet with many accounts, the lever is moving it off the main thread, not scheduling when it begins.

What the user sees does not change in kind. Labels are **not** persisted: IndexedDB stores only `MetadataState` — enabled flag, providers, selected provider ([`suite-common/metadata-types/src/metadataTypes.ts:293`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/metadata-types/src/metadataTypes.ts#L293)) — while the label text itself lives in `provider.data[fileName]`, written only by `METADATA.SET_DATA` ([`suite/metadata/src/metadataDataThunks.ts:84`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataDataThunks.ts#L84)) and read back by `selectAccountLabelsLegacy` ([`metadataReducer.ts:228`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataReducer.ts#L228)). So today the account list already paints with default names and swaps in custom labels when the network round trip returns. This change adds at most the idle wait to that swap, on top of a round trip that is already there.

## Notes

- **The After hunk has not been compiled.** It is written against the surrounding types by reading.
- **Why `timeout: 1000` and not the 2–5 s used for pure telemetry.** Labels are user-authored content the user recognises their accounts by, so the ceiling has to stay under the perceptual budget for "the name I gave this account". One second is already comparable to the provider round trip that follows it; a longer timeout would start being the dominant term rather than a rounding error on it. If a reviewer thinks even that is too much, the alternative that keeps the ordering benefit without any added latency is to dispatch it after `onSuiteReady()` without the idle wrap at all.
- **The claim is deliberately narrow.** This is not "labels appear late" — they already appear late, because nothing about them is cached locally. It is "the fan-out's decrypt work should not land on top of the first render". Reviewers should read it as a small, cheap reordering, not a fix for a visible stall.
- **No cancellation path exists here.** `init()` is a thunk with no teardown hook, so there is nowhere natural to store the callback id. In practice the store outlives the callback (a reload tears down the whole page on web, the whole renderer on desktop), so a dispatch landing in a dead store is not reachable from this call site. If a reviewer wants the id kept anyway, it needs an owner with a lifecycle, and `init()` is not one.
- **Ordering: nothing sequences on this dispatch today.** The boot fan-out is one-shot; the repeating 60-second poll ([`metadataLabelingConstants.ts:14`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataLabelingConstants.ts#L14)) is installed by a different entry point, `metadataLabelingActions.init` at [`:690`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataLabelingActions.ts#L690), so deferring the boot call does not shift the interval.
- **To verify before merging:** if the user opens a label editor inside the deferral window, they would briefly see the un-fetched state. The provider flows re-fetch on demand, but that path was not traced end to end in this sweep — check it rather than assume it.
- **Tests.** [`packages/suite/src/actions/suite/initAction.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/initAction.test.ts) asserts the exact ordered action list for four fixtures and **none of them contain a metadata action**, because the initial state has `metadata.enabled === false` and the thunk returns before dispatching anything. So this change does not disturb that test — which also means it has no coverage. [`suite/metadata/src/metadataActions.test.ts`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataActions.test.ts) covers `setAccountMetadataKey`, `addAccountMetadata`, `connectProvider` and friends, but not `fetchAndSaveMetadataForAllDevices`. Adding coverage means faking a provider instance, which is why the change is worth keeping to one line.
- **The existing comment agrees with the fix.** The three lines above the call already say this data was deliberately left out of the boot storage load because it was not needed immediately after Suite start. Deferring it is what that comment describes.
- **Platform.** Web and desktop only; `packages/suite` and `@suite/metadata` are both private packages. Safari has no `requestIdleCallback`, hence the `setTimeout` fallback inside `runWhenIdle`; `suite-desktop` is Chromium and always has the real API.
- **Sibling in the same file:** `p1-01` moves `routerInit()`/`onSuiteReady()` above the awaited definition and rate fetches at `:98`–`:115`. That one is about the gate; this one is about the first render. They touch adjacent lines of `init()`, so whichever lands second needs a trivial rebase — and if `p1-01` lands first, this dispatch will already be sitting after `onSuiteReady()`, which is the ordering this document assumes.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
