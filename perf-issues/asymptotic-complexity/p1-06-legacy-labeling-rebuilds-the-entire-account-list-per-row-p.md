# `selectLabelableEntityByKey` rebuilds and spreads the whole account+device list to answer one keyed lookup

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. The scan is not inside a `for` loop here; the loop is React — the selector sits inside a `useSelector` in a per-row component, so it re-runs for every mounted row on every dispatched action.

## Where

[`suite/metadata/src/metadataReducer.ts:304`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataReducer.ts#L304) — the `.find()` over a list that is materialised from scratch at [`:273-293`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataReducer.ts#L273), reached from [`:353-368`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/metadataReducer.ts#L353).

`selectIsLabelingAvailableForEntity` answers a yes/no question about **one** entity. To do it, it calls `selectLabelableEntities`, which filters every account and every device of the store, allocates a new object per survivor by spreading `...account.metadata` / `...device.metadata`, concatenates the two lists into a third array, and only then `.find()`s the single entry it wanted. None of it is memoized — these are plain functions, not `createSelector`. The entity it is looking for is already reachable by key: accounts by `selectAccountByKey`, and the device entity is literally the `device` the function resolved three lines earlier.

## Before

### 1. The list build (`:273-293`) and the lookup (`:299-311`)

```ts
export const selectLabelableEntities = (state: MetadataRootState, deviceState: StaticSessionId) => {
    const { wallet, device } = state;
    const { devices } = device;
    const { accounts } = wallet;

    return [
        ...accounts
            .filter(a => a.deviceState === deviceState)
            .map(account => ({
                ...account.metadata,
                key: account.key,
                type: 'account' as const,
            })),
        ...devices
            .filter((device: TrezorDevice) => device.state?.staticSessionId === deviceState)
            .map((device: TrezorDevice) => ({
                ...device.metadata,
                state: device.state,
                type: 'device' as const,
            })),
    ];
};

/**
 * @deprecated Legacy Labeling
 */
const selectLabelableEntityByKey = (
    state: MetadataRootState,
    deviceState: StaticSessionId,
    entityKey: string,
) =>
    selectLabelableEntities(state, deviceState).find(e => {
        if ('key' in e) {
            return e.key === entityKey;
        }
        if ('state' in e) {
            return e.state?.staticSessionId === entityKey;
        }

        return false;
    });
```

### 2. The caller (`:353-368`)

```ts
export const selectIsLabelingAvailableForEntity = (
    state: MetadataRootState,
    entityKey: string,
    deviceStaticSessionId?: StaticSessionId,
): boolean => {
    const device = deviceStaticSessionId
        ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
        : selectSelectedDevice(state);
    if (!device?.state?.staticSessionId) return false;
    const entity = selectLabelableEntityByKey(state, device.state.staticSessionId, entityKey);

    return Boolean(
        selectIsLabelingAvailable(state) &&
        entity?.[METADATA_LABELING.ENCRYPTION_VERSION]?.fileName,
    );
};
```

## After

### Tier 1 — reorder the guard (one line, zero behaviour change)

The two conditions are already `&&`-ed, so hoisting the cheap one above the scan is semantically a no-op. It removes the list build entirely whenever legacy labeling is off — which is the common case now that Suite Sync is the default labeling backend.

```ts
export const selectIsLabelingAvailableForEntity = (
    state: MetadataRootState,
    entityKey: string,
    deviceStaticSessionId?: StaticSessionId,
): boolean => {
    if (!selectIsLabelingAvailable(state)) return false;

    const device = deviceStaticSessionId
        ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
        : selectSelectedDevice(state);
    if (!device?.state?.staticSessionId) return false;

    const entity = selectLabelableEntityByKey(state, device.state.staticSessionId, entityKey);

    return Boolean(entity?.[METADATA_LABELING.ENCRYPTION_VERSION]?.fileName);
};
```

### Tier 2 — look the entity up directly

`selectLabelableEntityByKey` can then be deleted; `selectLabelableEntities` must stay, it is still used by `metadataLabelingActions.ts:41`.

```ts
export const selectIsLabelingAvailableForEntity = (
    state: MetadataRootState,
    entityKey: string,
    deviceStaticSessionId?: StaticSessionId,
): boolean => {
    if (!selectIsLabelingAvailable(state)) return false;

    const device = deviceStaticSessionId
        ? selectDeviceByStaticSessionId(state, deviceStaticSessionId)
        : selectSelectedDevice(state);
    if (!device?.state?.staticSessionId) return false;

    // account entities are matched first, mirroring the order of the legacy entity list
    const account = selectAccountByKey(state, entityKey);
    if (account?.deviceState === device.state.staticSessionId) {
        return Boolean(account.metadata[METADATA_LABELING.ENCRYPTION_VERSION]?.fileName);
    }

    // the only device entity reachable by key is the device resolved above
    if (entityKey === device.state.staticSessionId) {
        return Boolean(device.metadata[METADATA_LABELING.ENCRYPTION_VERSION]?.fileName);
    }

    return false;
};
```

## Why it matters

Per call: O(accounts + devices) array allocations plus one object spread per surviving account and device, to produce a value that is discarded except for a single `fileName`. `n` is the number of accounts in the store — every account of every wallet instance the user has ever opened in this session, not just the visible one, since the `.filter` runs over the whole `wallet.accounts` array before narrowing. A user with several passphrase wallets across many coins sits at 50-150 accounts.

The multiplier is what makes this a P1. `selectIsLabelingAvailableForEntity` is called from inside `useSelector`, so it re-executes for **every mounted instance** on **every dispatched action**, whether or not that instance re-renders. `Labeling` calls it twice — once directly ([`Labeling.tsx:72-74`](https://github.com/trezor/trezor-suite/blob/develop/suite/labeling/src/Labeling.tsx#L72)) and once through `selectIsLabelActionEnabled` ([`selectIsLabelActionEnabled.ts:51`](https://github.com/trezor/trezor-suite/blob/develop/suite/labeling/src/selectIsLabelActionEnabled.ts#L51)) — and `Labeling` is a per-row component: `UtxoSelection` renders two per UTXO row in coin control ([`UtxoSelection.tsx:156`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelection/UtxoSelection.tsx#L156), :249), `TransactionTarget` one per transaction target, `AddressHistoryRow` one per address row via `AddressLabeling`. A coin-control screen with a few hundred UTXOs therefore issues on the order of `4 × rows` calls, each allocating `accounts + devices` objects — hundreds of thousands of object spreads per Redux action, and Redux dispatches during send-form composition are continuous.

Coin control is also where the already-filed UTXO issues land, so the costs stack on the same screen. No measurement was taken for this one.

## Notes

- Tier 1 is a pure reordering: `selectIsLabelingAvailable` has no dependency on `entityKey` or on the resolved `device` (it reads `selectSelectedDevice` itself), and the original expression already `&&`-ed the two results, so short-circuiting earlier cannot change the returned boolean. Worth landing on its own even if tier 2 is deferred.
- Tier 2 must preserve **account-before-device precedence**. In the current list, accounts are spread in first, so `.find()` returns an account entity when an account key and a device static session id would both match. Account keys and static session ids do not collide in practice, but the `if (account…) … if (entityKey === …)` order keeps the semantics identical rather than relying on that.
- The account branch must keep the `deviceState` filter. `selectAccountByKey` searches all accounts regardless of wallet instance; the list build only ever contained accounts whose `deviceState` equals the resolved device's `staticSessionId`. Hence the `account?.deviceState === device.state.staticSessionId` comparison rather than a bare truthiness check.
- The device branch collapses to an identity check: entities of type `'device'` are only emitted for devices whose `state.staticSessionId === deviceState`, and the predicate then matches on `e.state?.staticSessionId === entityKey`. Both sides are the same value, so the entity can only match when `entityKey === deviceState` — and that device is already in hand.
- Discriminating on `'key' in e` works today because the account spread overwrites the `key` from `AccountEntityKeys` (the legacy xpub) with `account.key`, while `DeviceEntityKeys` has no top-level `key`. The direct lookup sidesteps that entirely — one less implicit invariant.
- No new imports needed: `selectAccountByKey`, `selectDeviceByStaticSessionId` and `selectSelectedDevice` are all already imported in `metadataReducer.ts` (lines 9, 10, 21). If `selectLabelableEntityByKey` is deleted, check whether `TrezorDevice` is still referenced — it is, by `selectLabelableEntities`, which stays.
- `selectAccountByKey` is a `createWeakMapSelector`, so it memoizes per `(accounts, accountKey)` pair; repeated per-row calls with distinct keys all stay cached across dispatches that do not touch `wallet.accounts`. That is the actual win over the current code, which allocates unconditionally.
- TypeScript: `if (!device?.state?.staticSessionId) return false;` narrows `device` and `device.state` for the rest of the body via optional-chain narrowing, so `device.metadata` and `device.state.staticSessionId` type-check without extra assertions. `selectAccountByKey` returns `Account | null`, and `AccountEntityKeys` / `DeviceEntityKeys` both index to `LabelableEntityKeys | undefined` at `METADATA_LABELING.ENCRYPTION_VERSION`, so the `?.fileName` reads are safe. This is `packages/suite`/`suite/*` — no React Compiler here, so nothing memoizes these calls for free.
- Test cover: `suite/labeling/src/selectIsLabelActionEnabled.test.ts` mocks `selectIsLabelingAvailableForEntity` outright, so it does not exercise this path. There is no unit test for `metadataReducer`'s selectors at all — tier 2 should come with one covering account-key hit, device-session-id hit, wrong-wallet account, and the no-match case.
- Both `selectLabelableEntities` and `selectIsLabelingAvailableForEntity` are marked `@deprecated Legacy Labeling`, and the whole branch only runs when Suite Sync is off. Worth confirming with the team whether **deleting the legacy branch** beats optimising it — if the branch has a removal date, land tier 1 only and skip tier 2.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
