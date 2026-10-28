# Transaction store: local transaction database and sync engine

Status: in progress on `feat/transaction-store`. Phases 1–3 and the RPC layer live in this
package; the per-platform entries (Phase 4) are the next step. Tested so far: migrations,
repository, blockchain-link source and the sync job (on real SQLite). Not yet tested: the
queue, the watcher, the composition root and the RPC host/client.

## Problem

Transaction history is fetched by the app itself: per account, page by page, with
"fetch everything" and "fetch until timestamp" thunks in
`suite-common/wallet-core/src/transactions/transactionsThunks.ts`
(`fetchTransactionsPageThunk`, `fetchAllTransactionsForAccountThunk`,
`fetchTransactionsFromNowUntilTimestampThunk`) and refreshes driven from Redux
(`syncAccountsWithBlockchainThunk`, `onBlockMinedThunk` in
`suite-common/wallet-core/src/blockchain/blockchainThunks.ts`). Every feature that shows
transactions (account history, asset detail, trading history, graphs) has to orchestrate
fetching, know what is already loaded and merge pages. That makes it slow to build on and
easy to get wrong.

## Goal

A standalone engine that owns a local SQL database of transactions and keeps it up to date on
its own, on web, Electron desktop and React Native. The app only:

1. registers the accounts it knows and says which networks it is interested in,
2. asks what is synced (and gets told when that changes),
3. runs queries.

It never fetches transactions itself.

## Non-goals (first iteration)

- Encryption at rest. Nothing here is synced off the device, so Evolu's encrypted CRDT store is
  not needed; only its plain SQLite drivers are reused.
- Multi-device sync, cloud, or anything leaving the device.
- Replacing Redux for balances, UTXOs or the send flow. Only transaction history reading moves.

## Constraints

- Shared logic lives in `suite-common` and must not depend on `packages/suite`, `suite/*` or
  `suite-native/*`. Platform pieces (SQLite driver, blockchain-link instance, worker) are
  injected by app entries, the same way Evolu is injected only in `@suite/suite-sync` and
  `@suite-native/suite-sync`.
- suite-common is test-first; tests are co-located; dependencies in tests use the declared
  `Deps` types and `createMockDeps` / `mock` (`skills/tests`).
- Errors cross service boundaries as `Result` (`@trezor/type-utils`), not exceptions
  (`skills/defensive-programming`).
- Confidential data (descriptors, xpubs, addresses, txids, balances) never leaves the device:
  no logging of identifiers, and errors carry an error type, never a backend message that may
  echo an address.

## Architecture

### Services, dependency injection and composition roots

Everything is a service written to `skills/dependency-injection`: `XDeps` type, service shape,
`createX(deps)` factory reading `deps.y`, no imports of platform code. The package is wired by
one package-level composition root, the same shape as `createSuiteSyncCompositionRoot` and the
app roots (`createSuiteWebCompositionRoot`, `createSuiteDesktopCompositionRoot`,
`createConnectExplorerCompositionRoot` → `createConnectExplorerApp`):

```
app entry (per platform)                      package composition root (this package)
------------------------                      --------------------------------------
createXxxTransactionStoreEntry                createTransactionStoreCompositionRoot(deps)
  sqlite            = Evolu SqliteDriver  ─┐    migrate schema
  transactionSource = blockchain-link     ─┼─►  repository  = createTransactionRepository
  startInterval     = setInterval wrapper ─┤    syncAccount = createSyncAccountTransactions
  now               = Date.now            ─┘    syncQueue   = createSyncQueue
                                                watcher     = createNetworkWatcher
                                                └─► TransactionStore (public API, disposable)
```

Platform contracts the entries provide (all marked `@serviceContract`):

| Contract                 | Web / Electron renderer                                                                                                     | React Native                                     | Tests                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| `TransactionStoreSqlite` | `createWasmSqliteDriver` (`@evolu/web`, OPFS)                                                                               | `createExpoSqliteDriver` (`@evolu/react-native`) | `createBetterSqliteDriver` (`@evolu/nodejs`, in memory) |
| `TransactionSource`      | `createBlockchainLinkTransactionSource` over `@trezor/blockchain-link` instances, one per network, honoring custom backends | same                                             | fake source                                             |
| `StartInterval`          | `setInterval`                                                                                                               | `setInterval`                                    | manual ticks                                            |

All three SQLite drivers already ship in the repo (via `suite-sync`) and implement Evolu's
synchronous `SqliteDriver` contract (`exec({ sql, parameters }) → { rows, changes }`), so the
engine adds no new database dependency. Kysely is also already present (through Evolu) and is
the planned typed query layer once the raw-SQL API settles.

### Where it runs: in a worker, or in process

The engine is synchronous over SQLite and talks to the app only through the `TransactionStore`
API, so where it runs is an entry decision:

- **Web and Electron renderer:** a dedicated Web Worker. The worker entry builds the deps, calls
  the composition root and serves the store through `createTransactionStoreRpcHost` on the
  worker's port. The app side uses `createTransactionStoreRpcClient`, which implements the same
  `TransactionStore` type. OPFS (SAHPool VFS) needs a worker anyway and needs no COOP/COEP.
- **React Native:** in process on the JS thread, no RPC: the native entry calls the composition
  root directly and hands the store to the app. Moving it to a worklet or separate runtime later
  only means putting the RPC host/client pair on that boundary.

Every public method is async, so the in-process store and the RPC client are interchangeable.

### Setup API and disposal

`createTransactionStoreCompositionRoot(deps)` migrates the schema and returns
`Result<TransactionStore, TransactionStoreStartError>`; after that the store keeps running:
block subscriptions and fallback intervals keep watched networks fresh until it is disposed.

`transactionStore.dispose()` unsubscribes from every network, stops every interval, lets
in-flight jobs finish without queueing new ones, and resolves once the queue is idle. Entries
dispose it on app shutdown (and on "forget device" once that is wired). The RPC host has its own
`dispose()` that detaches from the port without touching the store.

### Database

Schema v1 (`PRAGMA user_version` holds the version; migrations are numbered statement lists):

- `accounts(account_key PK, symbol, descriptor)`
- `transactions(account_key, txid, block_height NULL, block_time NULL, type, data JSON,
PRIMARY KEY(account_key, txid))`, index `(account_key, block_time DESC)`. `data` is the whole
  blockchain-link `Transaction`; only what lists sort and filter by is a column. Pending
  transactions have `block_height NULL`.
- `sync_state(account_key PK, is_complete, newest_block_height NULL, last_synced_at NULL,
last_error NULL)`

### Sync engine

- **Queue** (`createSyncQueue`): one job per account, deduplicated. Requesting `full` while
  `latest` is queued upgrades the job; requesting while it runs schedules one rerun. At most
  `maxConcurrentJobsPerNetwork` jobs run per network, so one slow backend never blocks others
  and backends are not hammered.
- **Job** (`createSyncAccountTransactions`):
    - `latest`: walk pages from the newest, upsert each, stop at the first page containing a
      transaction already stored (pending ones are re-upserted, so confirmations update rows).
    - `full`: walk pages to the end and mark the account complete. A `full` request on a complete
      account runs as `latest`.
    - A backend without paging (no `page` in the response) returns everything at once, so the
      account is complete after the first page.
    - Failures are recorded as an error type in `sync_state.last_error`; the next block or
      interval tick retries. That is the backoff in v1.
- **Watcher** (`createNetworkWatcher`): `watchNetworks(symbols)` subscribes to blocks of the
  added networks and unsubscribes removed ones; every block, and every fallback interval tick,
  requests `latest` for the network's registered accounts.

### App-facing API

```ts
type TransactionStore = {
    registerAccounts: (accounts: TransactionStoreAccount[]) => Promise<void>;
    removeAccounts: (accountKeys: string[]) => Promise<void>;
    watchNetworks: (symbols: NetworkSymbol[]) => Promise<void>;
    requestSync: (params: { accountKeys: string[]; mode: SyncMode }) => Promise<void>;
    getSyncStatus: (accountKeys: string[]) => Promise<AccountSyncStatus[]>;
    selectTransactions: (params: SelectTransactionsParams) => Promise<StoredTransaction[]>;
    query: (query: SqlQuery) => Promise<ReadonlyArray<SqlRow>>; // read-only SELECT / WITH
    subscribe: (listener: TransactionStoreListener) => Promise<Unsubscribe>;
    whenIdle: () => Promise<void>;
    dispose: () => Promise<void>;
};
```

Events: `syncStatusChanged` (per account) and `transactionsChanged` (account keys whose rows
changed), so the React side can invalidate react-query keys instead of polling.

Type safety: v1 exposes `selectTransactions` for the common list and a raw read-only `query`.
Next, a Kysely `Database` interface for the schema plus a dialect that forwards compiled SQL
through `query`, so feature queries are typed end to end. No own query builder.

## Phases

1. **Package, schema, repository** — done here. Migrations, upserts, queries, sync state;
   tested on the in-memory better-sqlite3 driver.
2. **Sync engine** — done here. Queue (dedupe, upgrade, rerun, per-network cap), latest/full
   jobs, sync state, events; tested with a fake source.
3. **Watcher and setup API** — done here. Block subscriptions, fallback interval, composition
   root, disposal; RPC host/client for running in a worker.
4. **Platform entries** — next:
    - `@suite/transaction-store-worker`: worker entry for web and Electron renderer
      (`@evolu/web` driver, blockchain-link per network with the user's custom backends,
      `createTransactionStoreRpcHost` on `self`), plus the client wiring in
      `createSuiteWebCompositionRoot` / `createSuiteDesktopCompositionRoot`.
    - `@suite-native/transaction-store`: in-process entry (`createExpoSqliteDriver`), wired in
      the native composition root.
    - App feeding: register accounts from discovery, `watchNetworks` from enabled networks,
      re-create the network's source when its custom backend changes.
    - React hooks over react-query (`useStoredTransactions`, `useAccountSyncStatus`), invalidated
      by store events.
5. **First consumer** — the asset detail transactions list (#33764) reads from the store.
6. **Migration** — one-time import of IndexedDB `txs` (`packages/suite/src/storage`, with an IDB
   migration per `skills/idb-migrations`), move the remaining readers, delete the old fetch
   thunks and their merging.

## Follow-ups and open decisions

- Pagination beyond page indexes: Ripple `marker`, Stellar `pageCursor`, direct-RPC
  `olderHistoryFrom`. The job's cursor becomes a per-backend union; v1 treats those backends as
  complete after one response.
- `full` resumes from page 1 (idempotent upserts); resuming from a stored page needs an overlap
  window because new transactions shift page indexes.
- Account notifications (`subscribe({ type: 'accounts' })`) to pick up mempool transactions
  before the next block; v1 relies on the interval for those.
- Token transfers as a child table, so per-token lists (asset detail) do not scan JSON.
- Exponential backoff per backend instead of "retry on next tick".
- Leader election (Web Locks) so several web tabs share one engine.
- Wipe the device's rows on "forget device".

## Acceptance criteria

- App code contains no transaction fetching; it registers, watches, queries and reads status.
- Custom backends are honored, and switching one refreshes the affected accounts.
- A block on a watched network updates visible lists without user action.
- Reloading the app shows stored history immediately, then syncs `latest`.
- No descriptor, xpub, address or txid appears in logs, Sentry or error messages.
- All gates in `.github/workflows/check-code-validation.yml` pass.
