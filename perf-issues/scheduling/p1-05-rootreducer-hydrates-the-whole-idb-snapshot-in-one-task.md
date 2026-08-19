# Storage hydration writes an immer draft entry per persisted transaction inside one synchronous `rootReducer` call

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Break a long task up and yield to the main thread"_. The raw finding claimed the whole IndexedDB snapshot; reading every `storageLoad*` reducer, that overstates it. Almost all of the hydration pass is assignment proportional to the number of devices and accounts. Exactly one term is proportional to the number of persisted **transactions**, and this issue is about that term.

## Where

[`packages/suite/src/reducers/store.ts:190`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/reducers/store.ts#L190) — `initStore` derives the preloaded state by calling the combined root reducer once with the `@storage/load` action that `preloadStore` returned. `combineReducers` runs every slice's handler in that one synchronous call, so the whole hydration is a single task; nothing paints and no input is processed until it returns.

[`packages/suite/src/support/extraDependencies.ts:301`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/extraDependencies.ts#L301) — `storageLoadTransactions`, the handler the transactions slice registers for that action ([`transactionsReducer.ts:169-172`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsReducer.ts#L169-L172)). It iterates every persisted transaction row and, per row, builds an `AccountKey` string and writes into an immer draft.

For contrast, the rest of the pass: `storageLoadAccounts` maps and sorts the account list ([`:349-355`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/extraDependencies.ts#L349-L355)), `storageLoadDevices` maps devices ([`:387-404`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/extraDependencies.ts#L387-L404)), `storageLoadFormDrafts` / `storageLoadReceiveAccounts` / `storageLoadBlockchain` / `storageLoadExplorer` walk one record per account or per network, and the settings handlers are object spreads. The second-largest term is `storageLoadHistoricRates` ([`:329-335`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/support/extraDependencies.ts#L329-L335) → [`buildHistoricRatesFromStorage`, `fiatRatesUtils.ts:87`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-utils/src/fiatRatesUtils.ts#L87)), which loops every timestamp of every rate key of every account — but as plain-object work outside the draft, followed by one `state.historic = …` assignment. See Notes for why it is not in the `After`.

## Before

```ts
// get initial state by calling STORAGE.LOAD action with optional payload
// payload will be processed in each reducer explicitly
const preloadedState = preloadStoreAction ? rootReducer(undefined, preloadStoreAction) : undefined;
```

```ts
        storageLoadTransactions: (state: TransactionsState, { payload }: StorageLoadAction) => {
            const { txs, phishing } = payload;

            txs.forEach(item => {
                const k = createAccountKey({
                    accountDescriptor: item.tx.descriptor,
                    networkSymbol: item.tx.symbol,
                    deviceStaticSessionId: item.tx.deviceState,
                });

                if (!state.transactions[k]) {
                    state.transactions[k] = [];
                }

                state.transactions[k][item.order] = item.tx;
            });

            phishing.forEach(({ key, value }) => {
                state.phishing[key] = value;
            });
        },
```

```ts
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadTransactions,
            );
```

## After

A reducer cannot await, so the loop has to move to the dispatching side. Build the account-to-transactions index as a plain object in batches, yield between them, and let the reducer do one assignment. `store.ts:190` is unchanged and stays synchronous — it just no longer carries the per-transaction term, because `txs` leaves the `@storage/load` payload.

`packages/suite/src/actions/suite/storageActions.ts`

```ts
const TRANSACTIONS_HYDRATION_BATCH_SIZE = 2000;

const buildTransactionsFromStorage = async (txs: StorageLoadAction['payload']['txs']) => {
    const transactions: TransactionsByAccount = {};

    for (let i = 0; i < txs.length; i += TRANSACTIONS_HYDRATION_BATCH_SIZE) {
        txs.slice(i, i + TRANSACTIONS_HYDRATION_BATCH_SIZE).forEach(item => {
            const key = createAccountKey({
                accountDescriptor: item.tx.descriptor,
                networkSymbol: item.tx.symbol,
                deviceStaticSessionId: item.tx.deviceState,
            });

            if (!transactions[key]) {
                transactions[key] = [];
            }

            transactions[key][item.order] = item.tx;
        });

        await yieldToMain();
    }

    return transactions;
};

export const loadTransactionsFromStorage =
    ({ txs, phishing }: Pick<StorageLoadAction['payload'], 'txs' | 'phishing'>) =>
    async (dispatch: Dispatch) => {
        const transactions = await buildTransactionsFromStorage(txs);

        dispatch({
            type: STORAGE.LOAD_TRANSACTIONS,
            payload: { transactions, phishing },
        });
    };
```

`packages/suite/src/support/extraDependencies.ts`

```ts
        storageLoadTransactions: (
            state: TransactionsState,
            { payload }: StorageLoadTransactionsAction,
        ) => {
            state.transactions = payload.transactions;

            payload.phishing.forEach(({ key, value }) => {
                state.phishing[key] = value;
            });
        },
```

`suite-common/wallet-core/src/transactions/transactionsReducer.ts`

```ts
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoadTransactions,
                extra.reducers.storageLoadTransactions,
            );
```

## Why it matters

This runs on every cold start of Suite on web and desktop, between `root.render(<LoadingScreen />)` and the first render of the real tree ([`MainWeb.tsx:57-61`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-web/src/MainWeb.tsx#L57-L61), [`MainDesktop.tsx:65-70`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-ui/src/MainDesktop.tsx#L65-L70)). The user is looking at a bare loading screen and the main thread is inside one function call.

`n` is the total number of persisted transaction rows across every remembered wallet, every network and every account — `db.getItemsExtended('txs', 'order')` fetches them unfiltered ([`suite-storage/src/index.ts:289`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-storage/src/index.ts#L289)) — and nothing prunes them short of forgetting a wallet or an account, so it only grows with use. Per row the reducer runs a `createAccountKey` call (a template-string build plus three `includes('-')` validations, [`account.ts:147-169`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-types/src/account.ts#L147-L169)) and an immer proxy write into a sparse array. Every other handler in the same pass costs something proportional to accounts or devices, which is two or three orders of magnitude smaller for a user with real history.

After the fix the same total work happens, but it happens as one task per batch with the main thread free in between, and the draft write collapses from one per transaction to one per hydration. Nothing appears earlier for the user by itself — what changes is that a click, a keypress or a paint arriving mid-hydration is handled between batches instead of after all of it.

## Notes

- **The `After` hunks have not been compiled.** They are written against the surrounding types by reading. `TransactionsByAccount` is exported from [`transactionsReducerTypes.ts:19-21`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/wallet-core/src/transactions/transactionsReducerTypes.ts#L19-L21) and matches the object built here, sparse arrays included.
- `yieldToMain()` is the shared helper introduced by whichever of these scheduling issues lands first — proposed home `packages/utils/src/yieldToMain.ts`, exported from `@trezor/utils`: `scheduler.yield()` when present, `setTimeout(resolve, 0)` otherwise. Safari has no `scheduler.yield`; `suite-desktop` is Chromium and always has the real thing. suite-native never dispatches `@storage/load` (it hydrates through redux-persist/MMKV and stubs the whole group, [`suite-native/state/src/extraDependencies.ts:207-214`](https://github.com/trezor/trezor-suite/blob/develop/suite-native/state/src/extraDependencies.ts#L207-L214)), so this is web and desktop only.
- **Relationship to [`p1-04`](p1-04-preloadstore-loads-the-whole-transaction-history-before-render.md).** That issue is the IDB-read half: it stops `preloadStore` awaiting the bulk stores before first render. This one is the hydration half: it stops the merge being one uninterruptible task wherever it runs. They stay separate because they are different files and different fixes, and each leaves the other in place — deferring the read alone just moves an unchunked pass off the critical path, and chunking alone chunks a pass first render still waits for. They compose neatly, though: with `p1-04` landed, `loadTransactionsFromStorage` is the natural consumer of `preloadDeferredStore`'s payload, and a reviewer may reasonably ask for one PR.
- **Honest sizing: low confidence that any single user crosses 50 ms here, high confidence that nothing bounds it.** The raw finding was medium confidence for exactly this reason and I have not raised it. A wallet with a few hundred transactions pays nothing measurable. This is worth fixing because `n` has no ceiling and the cost is paid on the one path where the user has no alternative but to wait — not because anyone traced it. Profile a large real profile before settling on a batch size.
- **Why 2000 and not the skill's 25.** Each batch here is plain-object writes with no dispatch and no re-render, so the per-item constant is small and a large batch keeps the number of yields low; the skill's example batches dispatches, which are far more expensive per item. The number is a guess, and the reviewer should treat it as one.
- **Why the alternative shape was rejected.** Chunking on the dispatch side instead — many `@storage/load`-style actions with sliced payloads — would work, but every dispatch notifies subscribers and re-renders the connected tree, so a large history becomes dozens of renders, and the immer proxy write per transaction stays. Building outside the draft avoids both. If a reviewer prefers chunked dispatches anyway (for progressive display of the list), the batch dispatches should be wrapped in `startTransition` so the cascade is interruptible.
- **`createAccountKey` throws.** It rejects a descriptor or symbol containing `-`. Today that throw happens inside `rootReducer(undefined, action)` and takes down store creation; moved into a thunk it becomes an unhandled rejection, which is worse. The PR should catch per batch and drop the offending row rather than lose the rest of the history.
- **The new reducer replaces instead of merging** (`state.transactions = payload.transactions`). On the boot path the slice is empty, so this is equivalent. It stops being equivalent the moment hydration can land after a fetch has already written into the slice, which is exactly what `p1-04` enables — so if both land, this must merge per account key, or the dispatch must be guaranteed to precede any fetch.
- **Historic rates are deliberately not in the `After`.** `buildHistoricRatesFromStorage` is the second-largest term and is genuinely proportional to stored rate entries, but it is plain-object work followed by a single draft assignment, so the per-entry constant is much lower than the transaction path's. Chunking it also means turning `storageLoadHistoricRates` from a replace into a merge, which is a behaviour change with its own clobbering risk. It belongs in its own change; a reviewer who disagrees can fold it in, and the same `yieldToMain` loop shape applies.
- **New action type and shared-contract churn.** `STORAGE.LOAD_TRANSACTIONS` is a new constant in [`storageConstants.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/constants/storageConstants.ts) plus a new entry in `actionTypes` on the shared contract ([`extraDependenciesType.ts:132-136`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/redux-extra-dependencies/src/extraDependenciesType.ts#L132-L136)) and one more `notImplementedActionType` stub on native. `StorageLoadTransactionsReducer` is already a distinct type in that contract ([`:141`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/redux-extra-dependencies/src/extraDependenciesType.ts#L141)), so the payload change is contained.
- **No cancel path exists.** Nothing today can outlive store creation, but an awaited loop can: a reload or a storage `blocked` event mid-hydration would leave the batches writing into a dead store. Key the loop on store identity, or bail when the store has been replaced.
- **Test coverage is thin.** There is no test for `store.ts` or `preloadStore.ts`, and no reducer test exercises the `@storage/load` path for transactions — `transactionsReducer.test.ts` covers the `transactionsActions` cases only, and `fiatRatesUtils.test.ts` does not touch `buildHistoricRatesFromStorage`. This change needs a reducer test for the new action and a test that the batched build produces the same `TransactionsByAccount` (sparse indices included) as the current reducer.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
