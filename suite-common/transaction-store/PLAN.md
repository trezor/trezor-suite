# Transaction store: local transaction database and sync engine

Status: in progress on `feat/transaction-store`.

- Phases 1–3 (engine, sync, watcher, RPC) are in this package.
- Phase 4 for web and desktop is in `@suite/transaction-store`: the worker entry, the service
  and its feed in the Suite composition root, the react-query hooks, a Debug settings section,
  and the account transaction list reading from it. It runs only while its Debug settings
  switch is on in debug mode (debug mode alone, as E2E tests use it, keeps the Redux list).
- Native (Phase 4b) is not started; see "Native: the open problem".
- Tested: migrations, repository, blockchain-link source and the sync job, on real SQLite.
  Not tested yet: the queue, the watcher, the composition root, the RPC pair and the web entry.

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

1. hands over the accounts it knows and says which networks it is interested in,
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

### Where it runs: the whole engine off the main thread

Syncing is expensive: paging backends, parsing large history responses, serializing every
transaction to JSON and writing it to SQLite. None of it may run on the thread that renders
the app, on any platform. The engine talks to the app only through the `TransactionStore`
API, and every method of it is async, so the boundary can sit anywhere.

**Web and Electron renderer** (`@suite/transaction-store`, done):

```
main thread (app)                          dedicated worker (transactionStoreWorker.ts)
-----------------                          -------------------------------------------
startTransactionStoreFeed (service)        createTransactionStoreCompositionRoot
  setAccounts / watchNetworks       ─RPC─►   sync queue, jobs, watcher
  setBackends (Connect defaults     ─msg─►   blockchain-link per network
  filled in on the main thread)              └─ nested Worker per backend (blockbook, …)
useStoredAccountTransactions      ◄─RPC─   SQLite (Evolu WASM driver, OPFS SAHPool)
  invalidated by store events       ◄─evt─
```

- Only small messages cross: commands, events, and the rows a screen asked for.
- blockchain-link's backends run as nested workers. Its in-thread module variant cannot be
  used in a worker: inside any worker it answers through `self.postMessage`, so it would talk
  to the app and take over the store's messages. Every backend runs as a nested worker,
  Solana and EVM RPC included (Connect runs those two in-thread in the browser, but they start
  themselves in a worker too). Electrum needs Node sockets, so it stays `BackendUnavailable`.
- Backends disagree on what `page` means (blockbook: 1-based page and page count; Solana:
  0-based page and transaction count), so a page shorter than asked for ends the history.
- Networks whose blocks come too often to sync on each (Solana, as the app's
  `shouldSubscribeBlocks`) are not subscribed to blocks; the fallback interval refreshes them.
- The worker buffers the app's messages until the store has started, so calls made right
  after spawning it are not lost.
- **Reads must be paginated.** Rows are copied from the worker and deserialized on the main
  thread, so a screen asks for a page (`limit` / `offset`) and only the columns it shows. A
  "whole history" read would bring the jank back.

**React Native: the open problem.** There are no Web Workers, and Evolu's expo-sqlite driver
is synchronous, so running the engine in process would block the JS thread during a big
sync. Options, cheapest first:

1. **Chunked work:** in process, but yield between pages and batched writes. The UI stays
   responsive, but the work still runs on the JS thread. Acceptable only as a stopgap.
2. **Separate JS runtime:** run the engine in its own runtime (e.g. `react-native-worklets`
   runtimes) with the same RPC host/client pair on that boundary; the code needs no change.
   Needs a spike to confirm blockchain-link's websockets and the SQLite driver work there.
3. **Async native SQLite:** a driver that runs queries off the JS thread (op-sqlite). This
   moves only the I/O, not the parsing; it combines with 1 or 2.

The target is 2; native is not wired until the spike decides.

### Setup API and disposal

`createTransactionStoreCompositionRoot(deps)` migrates the schema and returns
`Result<TransactionStore, TransactionStoreStartError>`; after that the store keeps running:
block subscriptions and fallback intervals keep watched networks fresh until it is disposed.

`transactionStore.dispose()` unsubscribes from every network, stops every interval, lets
in-flight jobs finish without queueing new ones, and resolves once the queue is idle. Entries
dispose it on app shutdown (and on "forget device" once that is wired). The RPC host has its own
`dispose()` that detaches from the port without touching the store.

### Database

`PRAGMA user_version` holds the version; migrations are numbered statement lists.

- `accounts(account_key PK, symbol, descriptor)`
- `transactions(account_key, txid, block_height NULL, block_time NULL, type, data JSON,
PRIMARY KEY(account_key, txid))`, index `(account_key, block_time DESC)`. `data` is the whole
  blockchain-link `Transaction`, for rendering. Pending transactions have `block_height NULL`.
- `transfers(account_key, txid, idx, kind, contract NULL, direction, amount, decimals NULL,
symbol NULL, standard NULL, from_address NULL, to_address NULL, block_height NULL,
block_time NULL, PRIMARY KEY(account_key, txid, idx))` (v2), index
  `(account_key, contract, block_time DESC)`. Every asset movement of a transaction, flat: its
  native leg (when it moves any coin), each token transfer and each internal transfer, each
  with its own direction. `contract IS NULL` is the network's coin. Written with its
  transaction in one SQLite transaction (`flattenTransfers`, typed TypeScript, no SQL JSON) and
  deleted with it, so an asset's history is a plain indexed query:

    ```sql
    SELECT t.data FROM transactions t
    WHERE t.account_key = ?
      AND EXISTS (SELECT 1 FROM transfers f
                  WHERE f.account_key = t.account_key AND f.txid = t.txid AND f.contract IS ?)
    ORDER BY t.block_height IS NULL DESC, t.block_time DESC
    ```

    `selectTransactions` / `countTransactions` take that filter as `contract` (a token, `null`
    for the coin, left out for all). v2 clears v1's rows, which the stores sync again.

- `sync_state(account_key PK, is_complete, last_synced_at NULL, last_error NULL)`; the newest
  block is computed from `transactions`.

### Accounts stay in sync with the app's

`setAccounts` takes the app's whole account list; `replaceAccounts` diffs it against the
`accounts` table in one SQLite transaction, deletes every stored account missing from it (its
transactions, transfers and sync state cascade) and upserts the rest. Only the added accounts
get a sync; the others are kept fresh by blocks and the interval. Because the diff is against
the database, it also catches what left while the store was off:

- a forgotten device's wallets, and a not remembered wallet after a restart (Suite does not
  persist its accounts, so the store does not keep its history either);
- accounts of a network that gets disabled, and accounts hidden in the app.

The feed starts after Redux is hydrated with the stored accounts (`initThunk` runs after
`hydrateReduxStore`), so the first list is complete and nothing is wiped by mistake.

### Search

The list's search runs as SQL in the worker over everything stored, not over a loaded page,
with the syntax of the Redux list (`@suite-common/transaction-search`): free text, `YYYY-MM-DD`,
amounts and dates after `<`, `>`, `=` or `!=`, joined by `&` and `|`.

- `parseTransactionSearch` turns the query into data (`TransactionSearch`: groups of terms,
  any group matching when all its terms do). Labels are the app's, so the app resolves each
  text term to the txids and addresses whose labels contain it, and whether it is the
  network's symbol (`toTransactionSearch`); only those lists reach the worker.
- `toTransactionSearchClause` turns it into one condition on `transactions`:
    - text: txid; transfers' from/to, contract, symbol and amount digits; UTXO input, output and
      target addresses (`json_tree` over `data`); the EVM function name; label matches;
    - amounts: `transfers.value` (the amount in units, schema v3), a sent one as negative;
    - dates: `block_time`, with the Redux list's day bounds.
- It is part of `TransactionsFilter`, so `selectTransactions` and `countTransactions` page and
  count the matches, and it combines with `contract`.

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
    - The first sync of an account stops after its newest page, so the list shows something
      at once. The queue then **backfills on its own**: after every sync that worked, an account
      that is not complete gets a `full` job, so the whole history arrives without anyone
      paging. Each stored page emits `transactionsChanged`, so lists fill in while it walks.
      Pages are 50 transactions (more than a screen's) to make the walk take fewer requests.
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
    /** The app's whole list; the store deletes every other account it holds, with its history. */
    setAccounts: (accounts: TransactionStoreAccount[]) => Promise<void>;
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
4. **Web and desktop entry** (`@suite/transaction-store`) — done, behind a Debug settings switch:
    - `worker/transactionStoreWorker.ts`: `startTransactionStoreWorker` opens the Evolu WASM
      driver, keeps a blockchain-link per network on nested workers, runs the composition root
      and serves it with `startTransactionStoreRpcHost`. Returns the dispose of all of it.
    - `worker/transactionStoreWorkerProtocol.ts`: the worker's own messages, typed by one map
      per direction (`TransactionStoreWorkerCommands`, `TransactionStoreWorkerEvents`); senders
      use `toWorkerMessage`, receivers `createWorkerMessageHandler`, which needs a handler for
      every name.
    - `createGetTransactionStoreService`: in `createSuiteServicesCompositionRoot`, so web and
      desktop share it. Spawns the worker on first use and fills in Connect's default backends.
    - `createStartTransactionStoreFeed`: a service, not a component. The composition root
      binds it to the Redux `getState` / `subscribe`, the store service and `getIsEnabled` (the
      Debug settings switch); `initThunk` starts it right after Connect and the backends are
      initialised (step 7b), since the networks' default backends come from Connect's coin info.
      Started any earlier, every default backend resolved to nothing. Returns its dispose.
      Memoized selectors (`transactionStoreFeedSelectors.ts`) derive the accounts (visible,
      enabled networks, no coinjoin) and the backends, and keep the same reference while those
      are unchanged, so balance updates and blocks push nothing. On a change it registers
      hands the store the whole account list (`setAccounts`), sets backends and watches the networks; when
      disabled it disposes the store and its worker.
    - `useStoredAccountTransactions({ account, page, perPage })`: the account's page of rows,
      enhanced to `WalletAccountTransaction`, its stored count and sync status, `isLoading`,
      `isSyncing` and `requestFullHistory`. Query keys are per account, so a change on one
      account refetches only its queries; opening it requests a `latest` sync.
    - `StoredTransactionList`: the account's Transactions list on that hook, with the sync status
      line; paging past what is stored requests the whole history. Search as below; no export yet.
    - `TransactionStoreDebug`: Settings → Debug → Transaction store, with the switch
      (`suiteSettings.debug.isTransactionStoreEnabled`) and per-account sync details.

    Every `start…` returns its dispose; services that hold state expose `dispose`.

4b. **Native entry** — after the runtime spike (see "React Native: the open problem"). 5. **First consumer** — the asset detail transactions list (#33764) reads from the store. 6. **Migration** — one-time import of IndexedDB `txs` (`packages/suite/src/storage`, with an IDB
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
- Per-contract sync (`contractFilter`) for backends whose account history leaves out a token's
  oldest transfers.
- Exponential backoff per backend instead of "retry on next tick".
- Leader election (Web Locks) so several web tabs share one engine.

## Acceptance criteria

- App code contains no transaction fetching; it registers, watches, queries and reads status.
- Custom backends are honored, and switching one refreshes the affected accounts.
- A block on a watched network updates visible lists without user action.
- Reloading the app shows stored history immediately, then syncs `latest`.
- No descriptor, xpub, address or txid appears in logs, Sentry or error messages.
- All gates in `.github/workflows/check-code-validation.yml` pass.
