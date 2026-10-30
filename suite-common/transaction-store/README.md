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

## Components

```mermaid
flowchart TB
    subgraph main["App main thread"]
        direction TB
        redux[("Redux state")]
        root["createSuiteCompositionRoot"]
        init["initAction"]
        feed["startTransactionStoreFeed"]
        service["getTransactionStoreService<br/>(spawns the worker on first use)"]
        client["RPC client<br/>TransactionStore"]
        hook["useStoredAccountTransactions<br/>(react-query)"]
        list["StoredTransactionList"]
        connect["TrezorConnect"]

        root --> service
        root --> feed
        init -- "once Connect is ready" --> feed
        redux -- "accounts, revisions,<br/>token definitions" --> feed
        feed -- "setAccounts / refreshAccounts /<br/>setKnownTokens" --> client
        service --> client
        list --> hook
        redux -- "dust txids, not-scam txids" --> list
        hook -- "ensureSynced / selectTransactions /<br/>countTransactions / requestFullHistory" --> client
        service -- "getAccountInfo by descriptor" --> connect
    end

    subgraph worker["Transaction store worker"]
        direction TB
        port["startBufferedPort"]
        host["startTransactionStoreRpcHost"]
        relay["startConnectRelay"]
        engine["createTransactionStoreCompositionRoot<br/>TransactionStore"]
        queue["createSyncQueue<br/>(one sync per account at a time)"]
        sync["createSyncAccountTransactions"]
        repo["createTransactionRepository"]
        clauses["toTransactionSearchClause<br/>toSuspiciousClause"]
        source["createBlockchainLinkTransactionSource"]
        sqlite[("SQLite in OPFS<br/>trezor-transaction-store")]

        port --> host --> engine
        port --> relay
        engine --> queue --> sync
        engine --> repo
        sync --> source
        sync --> repo
        repo --> clauses
        repo --> sqlite
        source --> relay
    end

    backends(("Backends<br/>(the user's choice)"))

    client <-->|"postMessage RPC<br/>+ store events"| port
    service <-->|"getAccountInfo / accountInfo,<br/>startFailed"| port
    connect --> backends
```

| Component                                                          | Package | Role                                                                                                                            |
| ------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `createTransactionStoreCompositionRoot`                            | engine  | Migrates the schema and wires the engine into a `TransactionStore`.                                                             |
| `createSyncQueue`                                                  | engine  | Runs one sync per account at a time; a request arriving mid-sync runs once more after it. Reports each account's sync status.   |
| `createSyncAccountTransactions`                                    | engine  | Fetches pages from the source and stores them: the newest page (`latest`) or the whole history (`full`).                        |
| `createTransactionRepository`                                      | engine  | All SQL: accounts, transactions, transfers, sync state and known tokens. Filters by asset, search and suspiciousness.           |
| `toTransactionSearchClause`                                        | engine  | The Redux list's search syntax as SQL.                                                                                          |
| `toSuspiciousClause`                                               | engine  | The app's phishing detectors, except dust, as SQL.                                                                              |
| `createBlockchainLinkTransactionSource`                            | engine  | Reads history pages through a `BlockchainLinkClient`, which on web and desktop is the relay.                                    |
| `createTransactionStoreRpcClient` / `startTransactionStoreRpcHost` | engine  | The typed RPC between the app and the worker.                                                                                   |
| `transactionStoreWorker`                                           | host    | The worker entry. Opens SQLite, starts the engine and serves it.                                                                |
| `startConnectRelay`                                                | host    | Sends each `getAccountInfo` to the app and resolves it with Connect's answer.                                                   |
| `getTransactionStoreService`                                       | host    | Spawns the worker on first use and owns it. Answers the relay with Connect's `getAccountInfo`.                                  |
| `startTransactionStoreFeed`                                        | host    | Pushes what changed in Redux to the store: accounts, account revisions and known tokens. Stops the store when it gets disabled. |
| `useStoredAccountTransactions`                                     | host    | A page, its count and the sync status for React. Refetches on the store's events.                                               |

## Where this is going

Planned next, not built yet: typed queries and live results over the RPC. The app builds queries
with Kysely against the store's table types; the worker runs them read-only and pushes new rows
whenever a write changes a result. That replaces the store events, `selectTransactions`,
`countTransactions`, `getSyncStatus` and react-query. Sync status becomes a column the queue writes.

```mermaid
flowchart LR
    subgraph main["App main thread"]
        list["StoredTransactionList"] --> live["useLiveQuery"]
        live --> kysely["Kysely<br/>(compiles only)"]
    end

    subgraph worker["Transaction store worker"]
        live_host["Live queries<br/>(re-run after each write batch)"]
        writes["Sync queue / setAccounts /<br/>setKnownTokens"]
        sqlite[("SQLite")]

        live_host -- "read-only" --> sqlite
        writes --> sqlite
        writes -- "committed" --> live_host
    end

    kysely -- "subscribeQuery(compiled SQL)" --> live_host
    live_host -- "rows, when changed" --> live
```

## Reading a page

```mermaid
sequenceDiagram
    autonumber
    participant UI as StoredTransactionList
    participant Store as TransactionStore (worker)
    participant Queue as Sync queue
    participant Backend as Connect (app thread)

    UI->>Store: ensureSynced([account])
    alt never synced
        Store->>Queue: requestSync(latest)
        Queue->>Backend: newest page
        Backend-->>Queue: transactions
        Queue->>Store: stored → transactionsChanged
    end
    Store-->>UI: sync status
    UI->>Store: selectTransactions(page, search, hideSuspicious)
    Store-->>UI: rows from SQLite

    Note over UI,Store: Paging past what is stored
    UI->>Store: requestFullHistory(account)
    Store->>Queue: requestSync(full)
    loop until the last page
        Queue->>Backend: next page
        Queue->>Store: stored → transactionsChanged
        Store-->>UI: event → refetch
    end

    Note over UI,Store: The app's refresh found the account changed
    UI->>Store: refreshAccounts (from the feed)
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
