# @suite-common/chain-data

Chain data (balances, tokens, rates, transaction history, and later sends) read through **chain
networks** and owned by **TanStack Query**, instead of being copied into Redux by thunks.

## Shape

```
selection (Redux)          composition (app)                 generic code (this package, UI)
enabled networks    ──▶   createDesktopChainNetworks   ──▶   networks.map(n => n.getAccountBalance(…))
+ chosen backend           the only network-type switch       useQueries + combine, no network branching
```

- **`ChainNetwork`** (`@trezor/network-module-suite-common-types`): one selected network bound to
  the backend the user chose. Plain-promise capabilities, a network-owned fiat rule and its own
  refresh policy. Implementations live in each network's `-suite-common` package, one per backend
  variant (Bitcoin on Blockbook or Electrum, EVM on Blockbook or custom RPC, Solana).
- **Composition**: each app builds networks for the selection (`selectChainNetworkSelection`, plus
  any runtime networks) and exposes them as a `ChainNetworksStore`: `{ getSnapshot, subscribe }`,
  read with `useSyncExternalStore` (`useSelectedChainNetworks`). The store publishes only when a
  network is added, removed or rebuilt, and a network is rebuilt only when its backend settings
  change. Consumers do not subscribe to Redux, and a new block changes nothing.
- **Queries**: one cache entry per chain account (`['chain', symbol, backendType, 'account',
descriptor, 'balance']`) and per network rate. Keys hold plain strings only; the backend type
  scopes them so data from one backend is never served after switching to another.
- **Multi-chain accounts**: aggregation runs over `PortfolioAccount.chainAccounts`, never over a
  single symbol, so one EVM address on Ethereum and its L2s is one account with several entries.

- **Assets**: each network answers its native asset (`nativeAsset` + balance) and, where it has
  them, its tokens (`getTokens`, absent on Bitcoin). `useChainAssets` returns one flat,
  unmerged list of `ChainAsset`s across networks. Grouping is the UI's decision: the desktop groups
  per network as the dashboard does today (`groupChainAssetsByNetwork`); an asset-first view
  (WETH and ETH as one row) would be another grouping over the same list.

- **Transaction history**: one `useInfiniteQuery` per chain account
  (`[...account, 'transactions']`) over `network.getTransactions({ ref, cursor })`. Pages load in
  order; each network decides how the next page is asked for (page number, Ripple marker, Stellar
  cursor) and the cursor is plain data. A network without history on its backend (EVM on a custom
  RPC) has no `getTransactions`. History is refetched when the account's balance changes, and on
  the network's sync interval while a loaded transaction is pending.
- **Historic rates**: `useChainHistoricRates` asks `network.getHistoricFiatRates` once per loaded
  page, asset and currency, at the hours of its confirmed transactions, and returns them in the
  wallet's `RatesByTimestamps` shape, so the existing fiat helpers and the phishing detector work
  unchanged.

## Coverage

Every network family is a chain network; only failed and CoinJoin accounts stay on the Redux path.

| Family                    | Backends              | Displayed balance | Tokens                          | Rates                         | History paging            |
| ------------------------- | --------------------- | ----------------- | ------------------------------- | ----------------------------- | ------------------------- |
| Bitcoin-like              | Blockbook, Electrum   | available         | none                            | Blockbook (HTTP) or CoinGecko | page, 25                  |
| Ethereum and EVM networks | Blockbook, custom RPC | available         | ERC20, BEP20; custom tokens     | Blockbook or CoinGecko        | page, 25; none on RPC     |
| Solana                    | Solana RPC            | available         | SPL, SPL-2022                   | CoinGecko                     | page, 8                   |
| Cardano                   | Blockfrost            | available         | native assets                   | CoinGecko                     | page, 8                   |
| Ripple                    | Ripple                | full (reserve)    | none (backend lists none)       | CoinGecko                     | marker, 25; total unknown |
| Stellar                   | Stellar               | full (reserve)    | classic assets, watched Soroban | CoinGecko                     | cursor, 25; total unknown |
| Tron                      | Blockbook             | available         | TRC10, TRC20; custom tokens     | Blockbook or CoinGecko        | page, 25                  |

Tokens a backend may leave out are watched: the account's last known tokens and the Soroban
contracts the user added travel on `ChainAccountRef.watchedTokens`, and each network decides how
to ask for them.

Account descriptors are confidential: balance queries carry `CONFIDENTIAL_QUERY_META`, so a failure
logs only the error name, and `ChainNetworkError` carries a code and symbol, never a backend
message. Keys are never logged and the cache is not persisted.

## Status

Desktop reads native balances and their fiat value through this package behind the debug flag
`queryChainData` (Settings → Debug → Flags): the sidebar coin rows, the account header and the
dashboard total. Under the flag the dashboard also lists every asset read through chain networks
(native coins and tokens of every family, filtered by the token definitions as today). With the flag off nothing is fetched and the Redux path is unchanged. Under the
flag the dashboard total values native balances only.

Under the flag the account's transaction list, the transaction detail modal (including bump fee
and cancel) and the transaction notifications also read history and its historic rates from the
query cache. Transactions the wallet has just sent stay in Redux until the backend lists them and
are shown on top. Readers that took a txid and looked it up in Redux (confirmations, phishing
detection) now take the transaction object, so they work in both states; the txids a user marked
as "not a scam" stay persisted in Redux.

Still on the Redux transactions slice: export, the graph, staking views, the send form (coin
control, nonces, RBF), block height, and the phishing filter of notifications whose transaction is
not loaded in the query cache.

Under the flag the desktop send pipeline also runs through chain networks, and runtime EVM
networks (see below) can be turned on. That covers the send
form, RBF bump fee and cancel, token allowance, trading exchange and sell, and Send raw.

- **Compose.** Each family composes in its network package (`network.send.composeFeeLevels`),
  through the query cache (`getChainComposeFeeLevelsQueryOptions`, `useChainComposeFeeLevels`).
- **Sign and broadcast.** `useChainSignTransaction` and `useChainPushTransaction` are never
  retried and log nothing confidential.
- **Under review.** The transaction lives in the desktop's React send session, not in the send
  form state.
- **After the broadcast.** The network's pending transaction (`network.send.createPendingTransaction`)
  shows on top of the history until the backend lists it or 15 minutes pass. The transaction it
  replaces is hidden. The account is read again.
- **Legacy readers.** The wallet's own sync is still told about the sent transaction.
- **One implementation.** The Redux send thunks delegate to the same network functions, so the
  flag-off path and the flows still on Redux run the same code. Those flows are staking, yield,
  WalletConnect and the native app.

### Account nonce

Networks that order an account's transactions by a nonce (EVM) resolve it themselves
(`network.getAccountNonce`, `ChainAccountNonce`) from their backend and the account's pending sends.
Nothing is read from Redux.

- **Per backend.** Blockbook returns a pending-inclusive nonce and, on newer versions, the
  mined-only one. Connect's JSON-RPC backend returns the mined-only nonce and the count of
  transactions in the node's mempool. A runtime network asks its node for both counts.
- **Pending sends.** A pending send keeps the nonce it was signed with. Networks read the account's
  pending sends through `getChainPendingSends` (`GetChainPendingSendsDep`), which the app serves
  from the cache (`createReadChainPendingSends`): the sends the history shows, neither listed nor
  expired. They feed the next nonce and Blockbook's private-pending hint for gas estimation.
- **The next nonce.** Every nonce below the backend's pending count is taken. The next nonce walks
  past own pending sends and stops at the first gap. Without a mined-only count, the confirmed nonce
  is lowered to the lowest own pending send. A replacement keeps its nonce, and signing refuses a
  custom nonce below the confirmed one.
- **Display.** `useChainAccountNonce` reads it under the account's key, so a broadcast reads it
  again. The desktop send form, account details, transaction list and detail read it through
  `useAccountEvmNonceInfo`. A pending transaction reads as superseded only when the history shown
  lists a mined transaction at its nonce.
- **Still on Redux.** The gas of a replaced transaction (RBF params), cancel composing, and the
  native app.

## Adding a network

The send and read paths above never branch on the network type; a lint rule
(`noNetworkTypeBranchingSyntax`) keeps it so in `chain-data`, the desktop chain-data and send hooks,
and the wallet's chain-send glue. Each network decides from what the app passes in; only the
composition (`createDesktopChainNetworks`) maps a network to its implementation.

- **A new family.** Add a `-suite-common` package whose factory returns a `ChainNetwork` (with
  `send` to send), and add one case to the composition switch. The legacy network list is derived
  from the family's configs.
- **A built-in EVM network (needs a release).** In `@trezor/network-ethereum*`, add the symbol, its
  `networkConfigBySymbol` entry and its wrapped native token. The legacy list, the sync interval
  and the chain network follow from that; transaction simulation is opt-in per chain. A Blockbook
  backend still needs Connect's own coin data (`coins-eth.json`, fee levels).
- **A runtime EVM network (no release).** Defined as data, read and broadcast over the network's
  own JSON-RPC nodes; Connect only signs, for the definition's chain ID. See below.

Still shared across families: `ChainSendDraft` and the precomposed types are the union of every
family's send form fields. Splitting them means splitting the send form UI.

### Runtime EVM networks

Behind the `queryChainData` flag. A definition comes from one of two places:

- **Trezor's signed list.** The message-system feature `networks.evm.runtime` carries the
  definitions in its payload, signed and delivered like any message-system config:

    ```json
    {
        "domain": "networks.evm.runtime",
        "flag": true,
        "payload": {
            "networks": [
                {
                    "symbol": "exc",
                    "chainId": 777,
                    "name": "Example Chain",
                    "nativeSymbol": "EXC",
                    "decimals": 18,
                    "rpcUrls": ["https://rpc.example.com"],
                    "explorer": {
                        "tx": "https://explorer.example.com/tx/",
                        "address": "https://explorer.example.com/address/"
                    }
                }
            ]
        }
    }
    ```

- **The user.** Settings → Debug → Custom EVM networks. The node must answer with the chain ID
  the user entered.

Every entry is validated (`validateRuntimeEvmNetworkDefinition`): a symbol of 2 to 10 lowercase
letters or digits, a symbol and chain ID no built-in network has, 18 decimals, RPC nodes over
https (http on this computer only) and an https explorer. Trezor's entries win over the user's on
a clash. Each network stays off until the user turns it on, because it is then read at the
addresses of the wallet's Ethereum accounts: an EVM address is the same on every chain, so a
runtime network needs no discovery.

What works: the network's balance per Ethereum account on the dashboard, and sending its coin. The
send has its own review, since the wallet's reads the app's network config. The device shows the
chain as unknown, with its chain ID. Before composing and before broadcasting, the node must serve
the chain the definition names.

What does not, yet: tokens, history, fiat rates, account pages, custom fees, replacement, MEV
protection. Analytics see `runtime-evm`, never the network. On desktop, the renderer's request
filter lets a node's host through on its first request (`request-filter/allow-chain-node-host`,
used through `createChainNodeFetch`) until the app quits, as custom backends are in the main
process.

**State outside Redux.** None of it is in Redux:

- **The registry** (`createRuntimeEvmNetworkRegistry`, Ethereum package) is an external store over
  three sources the platform provides: the user's preferences, Trezor's list, and whether runtime
  networks are read at all (the flag). It resolves them with `resolveRuntimeEvmNetworks`.
- **The preferences** are a port, `RuntimeNetworkPreferencesStore`
  (`@trezor/network-module-suite-common-types`). It holds the user's definitions and the networks
  they turned on, keyed `source:symbol`, so consent never carries over to another network with the
  same symbol. Each platform keeps them as it likes. Web and desktop use their own IndexedDB store,
  `runtimeNetworkPreferences` (`createIdbRuntimeNetworkPreferencesStore`), over the shared
  in-memory implementation.
- **The send** is composed in a modal held in component state. It is reviewed in the React send
  session. During a runtime session, the device's `ButtonRequest_Other` screens open that review.

### Adding Sui

Sui is the next family. It needs no change to the contracts above:

- a `networks/sui/*` package whose factory returns a `ChainNetwork` with `send`: balances,
  `Coin<T>` tokens, history and the gas budget. If Sui is not served through Connect, it reads
  its fullnodes with `createChainNodeFetch`, like runtime networks do;
- `'sui'` in the network type union and its config, from which the legacy list derives;
- one case in `createDesktopChainNetworks`;
- a gas-budget field in `ChainSendDraft`, while drafts are still shared across families;
- signing through Connect once the firmware supports it. The fee levels can come from the node
  through `send.getFeeInfo`.

Still to edit for any new family: the `networkType` branches in the transaction review modal and
`buttonRequestMiddleware`, and `wallet-utils` (roadmap phase 9).

## Roadmap

Phases 1–3 come first: they finish what the read and send paths already started. Each phase ends
when its exit criterion holds.

0. **Land it.** Split the branch into reviewable PRs in commit order: contracts and reads, history,
   send, data-driven EVM networks, runtime networks with the state outside Redux, and the nonce.
   Each stays behind `queryChainData`.
   _Exit:_ every PR merged with the flag off by default and the legacy path unchanged.
1. **Close the partial paths.**
    - Sync: wire `createChainQueryInvalidator` to Connect's block and notification events, add
      `network.subscribe`, and turn the Redux refresh off under the flag. Changing only a backend
      URL keeps the cache scope, so the composition must call `onBackendChanged(symbol)` when it
      rebuilds a network.
    - RBF and cancel: the replacement's params and the replaced transaction's gas come from chain
      history; cancel and allowance compose through `network.send`.
    - The trading re-compose goes through `network.send`; coin control reads the chain account's
      UTXOs.
    - The networks' deps stop reading Redux: Solana block info, the Stellar backend URL, block
      height and confirmations come from the network.

    _Exit:_ the chain networks' deps take nothing from Redux; no double fetching;
    `NETWORK_SYNC_INTERVALS` removed.

2. **Direct-RPC history.** The custom-RPC EVM network gets `getTransactions` over Connect's evm-rpc
   worker, with the recent window and older-history loading the store path has
   (`LoadOlderHistory`, `getOlderHistoryFrom`), threaded through
   `AccountTransactionsSource.fetchPage` and `useChainAccountTransactions`. Arc, which has no
   Blockbook, is the first consumer.
   _Exit:_ an RPC-backed account lists the same history under the flag as without it.
3. **Totals and assets.** Staking and token values in the totals, the wallet switcher total, the
   sidebar token and staking rows, the tokens tab and the send and receive asset pickers.
   _Exit:_ the flagged total equals the legacy total.
4. **History readers.** Export, the graph, search over the whole history and the "not a scam"
   marks.
   _Exit:_ the Redux transactions slice is legacy only.
5. **Earn and integrations on `network.send`.** Staking views and transactions, yield (with its
   earn toasts), WalletConnect and Connect popup signing.
   _Exit:_ no network-type switches in `sendFormThunks`.
6. **Discovery and identities.** `network.discoverAccounts` returns chain accounts; a
   `PortfolioAccount` slice persists identities only. Receive and addresses follow; CoinJoin
   accounts stay on Redux.
   _Exit:_ Redux accounts hold no balances or tokens.
7. **Persistence** for remembered wallets, with the same consent as Redux storage.
   _Exit:_ a remembered wallet works offline without Redux balances.
8. **Native.** `createNativeChainNetworks` from the same factories.
   _Exit:_ the mobile account list reads chain data.
9. **No network-type branching** in `wallet-utils`, the transaction review modal and
   `buttonRequestMiddleware`.
   _Exit:_ the lint rule bans network-type branching outside the composition.
10. **New families and runtime networks.** Sui, per [Adding Sui](#adding-sui). Runtime networks
    gain tokens, history, fiat rates, account pages, custom fees, replacement and MEV protection.
    _Exit:_ a runtime network reads like a built-in one.
11. **Remove the flag**, the Redux balance fields, the fiat-rate thunks and `useTotalFiatBalance`.
    _Exit:_ the legacy path is gone.
