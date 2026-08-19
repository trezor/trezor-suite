# `TransactionRenderer` scans the account list and a full transaction history per notification row — use the memoized keyed selectors

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`packages/suite/src/components/suite/notifications/NotificationRenderer/TransactionRenderer.tsx:46`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/notifications/NotificationRenderer/TransactionRenderer.tsx#L46) (also 47,53) — `TransactionRenderer`

Outer n = the notification list (`state.notifications` filtered to `tx-*` types). Inner m1 = every account in the store (`selectAccounts`), inner m2 = the full transaction array of the matched account. `findAccountsByNetwork`/`findAccountsByDescriptor` are `accounts.filter(...)` (accountUtils.ts:302,305) and allocate a new array each; `findTransaction` is `transactions.find(t => t.txid === txid)` (transactionUtils.ts:605).

## Before

```tsx
const routeName = useSelector(selectRouteName);
const routerApp = useSelector(selectRouterApp);
const dispatch = useDispatch();

const networkAccounts = findAccountsByNetwork(symbol, accounts);
const account = findAccountsByDescriptor(descriptor, networkAccounts).at(0);

// fallback: account not found, it should never happen tho
if (!account) return <View {...props} />;

const accountTxs = getAccountTransactions(account.key, transactions);
```

## After

Resolve the account and the transaction through the existing weakMap-memoized selectors instead of scanning per row: build the account key once with `createAccountKey({ accountDescriptor: descriptor, networkSymbol: symbol, deviceStaticSessionId: device?.state?.staticSessionId })` and use `selectAccountByKey(state, accountKey)`, then `selectTransactionByAccountKeyAndTxid(state, accountKey, txid)` (suite-common/wallet-core/src/transactions/transactionsSelectors.ts:130) — that one is `createMemoizedSelector`/weakMapMemoize, so repeated calls with the same txid are free across dispatches. Same treatment for `findAccountDevice`. That drops the per-row cost to O(1) after the first render.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(notifications x (accounts + txsOfMatchedAccount)) per render of the Activity list`** — hot path.

`NotificationList.tsx:14` maps over the notification array with no pagination and no cap — the reducer only ever `unshift`s (suite-common/toast-notifications/src/notificationsReducer.ts:42), so notifications accumulate for the whole session (one per tx-received / tx-sent / tx-confirmed / tx-approved / tx-staked / tx-yield-* event). The Activity page (packages/suite/src/views/suite/notifications/index.tsx:73) renders every one of them, and `TransactionRenderer` handles all 14 `tx-*` types, i.e. the entire default tab. Each row independently linear-scans the global account list and then the matched account's whole tx history. Worse, the row subscribes to `selectAccounts`, `selectTransactions`, `selectBlockchainState` and `selectDevices`, so every new block / account update re-renders all rows and repeats all scans.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- One correction to the candidate's analysis: `getAccountTransactions` (transactionUtils.ts:60-63) is `transactions[accountKey] || []`, i.e. O(1) — it is NOT a scan. The transaction-side cost is entirely line 53 (`findTransaction`). Fix feasibility: `createAccountKey` is exported from @suite-common/wallet-types (re-exported as the deprecated `getAccountKey` at accountUtils.ts:1133) and `selectTransactionByAccountKeyAndTxid` exists at transactionsSelectors.ts:130 as a createMemoizedSelector, so the proposed rewrite compiles in principle — but note a BEHAVIOUR DELTA: today `findAccountsByDescriptor` matches on descriptor alone across ALL devices and takes `.at(0)`, whereas an account key built from the notification's `device.state.staticSessionId` is device-scoped. A notification carrying a stale/absent device state would stop resolving where it resolves today. Also `createAccountKey` expects a branded `AccountDescriptor` (see `asAccountDescriptor` in accountUtils.test.ts), so the raw `descriptor: string` needs the brand helper. `findAccountDevice` scans `devices`, which is bounded at a handful — leave it alone.

- Spans more than one file — see also `packages/suite/src/components/suite/notifications/Notifications/NotificationGroup/NotificationList/NotificationList.tsx:14`.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
