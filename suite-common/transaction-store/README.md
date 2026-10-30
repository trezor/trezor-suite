# @suite-common/transaction-store

A local copy of the accounts' transaction history, kept in SQLite, so the app can page, search,
count and filter over everything stored without asking a backend each time.

It is lazy: it downloads an account's history only once something asks for it, keeps those
accounts fresh when the app says they changed, and has no clock of its own.

- `@suite-common/transaction-store` (this package): the engine. Platform-free; it gets its SQLite and
  its source of history injected.
- `@suite/transaction-store`: the web/desktop host. It runs the engine in a worker, feeds it from
  Redux, fetches its history through the app's Connect and exposes it to React.

The store opens no backend connection of its own. Every page of history comes from the app's
Connect, which already holds one connection per network on the user's chosen backend, and which
reaches Electrum through the desktop main process. Asking by descriptor never involves the device.

The app reads with queries of its own, as with Evolu: `createTransactionStoreQuery` builds one with
Kysely against the store's table types (`TransactionStoreDatabase`) and compiles it, and
`useTransactionStoreQuery` keeps it open in the store, which runs it read-only (`PRAGMA
query_only`) and sends new rows whenever a write changes the result. A query names the accounts it
reads; subscribing to it is what downloads their history. The rest of the API is three commands:
`setAccounts` (each with a revision; a changed one re-syncs the account), `setKnownTokens` and
`requestFullHistory`.

## Components

```mermaid
flowchart TB
    subgraph main["App main thread"]
        direction TB
        redux[("Redux state")]
        root["createSuiteCompositionRoot"]
        init["initAction"]
        feed["startTransactionStoreFeed"]
        service["ensureTransactionStore<br/>(starts the worker when not running)"]
        client["RPC client<br/>TransactionStore"]
        list["StoredTransactionList"]
        live["useTransactionStoreQuery"]
        kysely["createTransactionStoreQuery (Kysely)<br/>getAccountTransactionsQuery"]
        connect["TrezorConnect"]

        root --> service
        root --> feed
        init -- "once Connect is ready" --> feed
        redux -- "accounts with revisions,<br/>token definitions" --> feed
        feed -- "setAccounts /<br/>setKnownTokens" --> client
        service --> client
        redux -- "dust txids, not-scam txids" --> list
        list -- "builds and compiles" --> kysely
        list -- "requestFullHistory" --> client
        list --> live
        live -- "subscribeQuery(compiled SQL,<br/>its accounts)" --> client
        service -- "getAccountInfo by descriptor" --> connect
    end

    subgraph worker["Transaction store worker"]
        direction TB
        port["startBufferedPort"]
        host["startTransactionStoreRpcHost"]
        relay["startConnectRelay"]
        engine["createTransactionStoreCompositionRoot<br/>TransactionStore"]
        liveQueries["createLiveQueries<br/>(read-only, re-run after each write)"]
        queue["createSyncQueue<br/>(one sync per account at a time)"]
        sync["createSyncAccountTransactions"]
        repo["createTransactionRepository<br/>(the engine's own reads and writes)"]
        source["createBlockchainLinkTransactionSource"]
        sqlite[("SQLite in OPFS<br/>trezor-transaction-store")]

        port --> host --> engine
        port --> relay
        engine --> queue --> sync
        engine --> liveQueries
        sync --> source
        sync --> repo
        queue -- "is_syncing" --> repo
        repo -- "written" --> liveQueries
        repo --> sqlite
        liveQueries --> sqlite
        source --> relay
    end

    backends(("Backends<br/>(the user's choice)"))

    client <-->|"commands, compiled queries /<br/>responses, rows when changed"| port
    service <-->|"getAccountInfo / accountInfo,<br/>startFailed"| port
    connect --> backends
```

| Component                                                          | Package | Role                                                                                                                               |
| ------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `createTransactionStoreQuery` / `TransactionStoreDatabase`         | engine  | Builds a query with Kysely over the store's table types and compiles it; the store runs the SQL.                                   |
| `getAccountTransactionsQuery`                                      | engine  | An account's transactions, filtered by asset, search and suspiciousness; the caller picks columns, order and page, or counts.      |
| `matchesTransactionSearch`                                         | engine  | The Redux list's search syntax as a Kysely condition.                                                                              |
| `isNotSuspicious`                                                  | engine  | The app's phishing detectors, except dust, as a Kysely condition.                                                                  |
| `createTransactionStoreCompositionRoot`                            | engine  | Migrates the schema and wires the engine into a `TransactionStore`.                                                                |
| `createLiveQueries`                                                | engine  | Runs the app's queries read-only and re-runs the open ones after each write, sending only changed results.                         |
| `createSyncQueue`                                                  | engine  | Runs one sync per account at a time; a request arriving mid-sync runs once more after it. Marks the account as syncing.            |
| `createSyncAccountTransactions`                                    | engine  | Fetches pages from the source and stores them: the newest page (`latest`) or the whole history (`full`).                           |
| `createTransactionRepository`                                      | engine  | The engine's own reads and writes, in Kysely. Each write is atomic and tells the live queries.                                     |
| `createBlockchainLinkTransactionSource`                            | engine  | Reads history pages through a `BlockchainLinkClient`, which on web and desktop is the relay.                                       |
| `createTransactionStoreRpcClient` / `startTransactionStoreRpcHost` | engine  | The RPC between the app and the worker: commands, one-off queries and live queries.                                                |
| `transactionStoreWorker`                                           | host    | The worker entry. Opens SQLite, starts the engine and serves it.                                                                   |
| `startConnectRelay`                                                | host    | Sends each `getAccountInfo` to the app and resolves it with Connect's answer.                                                      |
| `ensureTransactionStore`                                           | host    | Starts the worker when it is not running and owns it. Answers the relay with Connect's `getAccountInfo`.                           |
| `startTransactionStoreFeed`                                        | host    | Pushes what changed in Redux to the store: accounts with their revisions, and known tokens. Stops the store when it gets disabled. |
| `useTransactionStoreQuery`                                         | host    | Keeps a compiled query open in the store and returns its latest rows, as Evolu's `useQuery`.                                       |

## Reading a page

```mermaid
sequenceDiagram
    autonumber
    participant UI as StoredTransactionList
    participant Store as TransactionStore (worker)
    participant Queue as Sync queue
    participant Backend as Connect (app thread)

    UI->>Store: subscribeQuery(page of the account), subscribeQuery(count), subscribeQuery(sync_state)
    Store-->>UI: rows now (empty for a new account)
    alt the account never synced
        Store->>Queue: requestSync(latest)
        Queue->>Store: is_syncing = 1
        Store-->>UI: sync_state rows
        Queue->>Backend: newest page
        Backend-->>Queue: transactions
        Queue->>Store: stored, is_syncing = 0
        Store-->>UI: page, count and sync_state rows
    end

    Note over UI,Store: Paging past what is stored
    UI->>Store: requestFullHistory(account)
    Store->>Queue: requestSync(full)
    loop until the last page
        Queue->>Backend: next page
        Queue->>Store: stored
        Store-->>UI: changed rows only
    end

    Note over UI,Store: The app's refresh found the account changed
    UI->>Store: setAccounts, its revision changed (from the feed)
    Store->>Queue: requestSync(latest), tracked accounts only
```

## Schema

Removing an account from `setAccounts` deletes its transactions, transfers and sync state through
the cascades.

```mermaid
erDiagram
    accounts ||--o{ transactions : "has"
    accounts ||--o| sync_state : "has"
    transactions ||--o{ transfers : "moves"
    token_definition_networks ||--o{ known_tokens : "lists"

    accounts {
        TEXT account_key PK
        TEXT symbol
        TEXT descriptor
    }
    transactions {
        TEXT account_key PK, FK
        TEXT txid PK
        INTEGER block_height
        INTEGER block_time
        TEXT type
        TEXT data "the whole transaction as JSON"
    }
    sync_state {
        TEXT account_key PK, FK
        INTEGER is_complete
        INTEGER last_synced_at
        TEXT last_error
        INTEGER is_syncing
    }
    transfers {
        TEXT account_key PK, FK
        TEXT txid PK, FK
        INTEGER idx PK
        TEXT kind "native or token"
        TEXT contract
        TEXT direction
        TEXT amount "base units"
        TEXT value "units, for search"
        TEXT standard
    }
    known_tokens {
        TEXT symbol PK
        TEXT kind PK "coin or nft"
        TEXT contract PK
    }
    token_definition_networks {
        TEXT symbol PK
    }
```

## Hiding suspicious transactions

The filter runs in SQL, so pages and counts stay right over the whole stored history.

- **In the store:** the detectors that need only the transaction and the network's token
  definitions: zero-value transfers, fake tokens, unknown transactions, TRC-10 transfers and
  unsolicited Stellar offers. The feed keeps `known_tokens` in step with the definitions and the
  user's show/hide choices.
- **From the app:** dust depends on fiat rates, which are dynamic and not stored. The app flags dust
  among the transactions it has in Redux and passes their txids, along with those the user marked
  "not a scam".
