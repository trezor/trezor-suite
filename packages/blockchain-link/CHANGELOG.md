# 2.1.12

-   b2e8fb9 hmm

# 2.1.11

-   chore(blockchain-link): fix ripple blocktime

# 2.1.10

-   fix: remove workspace: from dependencies

# 2.1.9

-   feat: add `token` param to to `GetCurrentFiatRates`, `GetFiatRatesForTimestamps` and `GetFiatRatesTickersList` methods
-   chore: parts of this packages split into @trezor/blockchain-link-types and @trezor/blockchain-link-utils
-   chore: token.address to token.contract, ethereum improvements
-   feat: add token param to blockbook fiat methods

# 2.1.8

-   fix(suite-native): cardano websocket (#7722)
-   feat(blockchain-link): add getBlock method
-   feat(blockchain-link): add mempool subscription

# 2.1.7

-   feat: cardano preview testnet

# 2.1.6

-   deps: updated typescript to 4.9
-   fix: order of txs in the same block

# 2.1.5

-   added Transaction.feeRate
-   use Transaction.size provided by Blockbook instead of computing it from hex if available
-   Electrum: fixed `joint` transaction handling

# 2.1.4

-   add missing ADA types
-   added `joint` transaction type to Transaction interface.
-   added `isAccountOwned` field to `tx.details.vin`/`tx.details.vout`
-   removed `totalSpent` field from Transaction interface

# 2.1.3

### changes

-   revert part of backend selection refactoring (298e56ca992508ba0d5e1c0586d60d7a232eaa6a)

# 2.1.2

#### changes

-   throttling of block events (#5093)
-   backend selection refactoring (#5047)
-   set proxyAgent protocol to satisfy sentry wrapper (#5033)
-   Blockfrost: add withdrawal and deposits amounts to transaction

# 2.1.1

#### changes

-   Proxy agent in Ripple worker is set based on `RippleAPI._ALLOW_AGENT` flag, in order not to fail in standalone `trezor-connect` implementation (#4942)

# 2.1.0

#### changes

-   Added `proxy` param allowing workers to initialize SocksProxyAgent and use it for proxying communication
-   Added support for `Electrum` backend
-   Using common utilities from new `@trezor/utils` package
-   Updated dependencies

# 2.0.0

#### changes

-   Refactored architecture of workers. They may now be used as commonjs module in main context or in WebWorker context like before.
-   Updated library build targets to es2017 reducing polyfills from typescript transpilation.
-   Removed `build` directory from npm registry.
-   Updated dependencies.

# 1.1.0

#### changes

-   lower default XRP reserve
-   set XRP reserve after `getInfo` call (get server info)
-   added support for `Cardano` using `Blockfrost` backend
-   fix blockbook transaction target when tx is sent to change address
-   fix blockbook (ETH) transaction target when swapping ETH <> ERC20

# 1.0.17

#### changes

-   Fixed tx.amount for btc-like sent txs
-   Added tx.totalSpent
-   Added tx.details.locktime

# 1.0.16

#### changes

-   Fixed an issue where account with non-zero balance could be marked as empty (eth)
-   Pending ETH transaction fee calculated from `ethereumSpecific` field
-   Added missing types (data) to `ethereumSpecific` field

# 1.0.15

#### changes

-   Added `details` to `Transaction` object (vin, vout, size)
-   Fixed types in `BlockchainLink` event listeners
-   Move "workersDepenedecies" to regular "dependencies" in package.json
-   Update dependencies

# 1.0.14

#### changes

-   Update dependencies

# 1.0.13

#### changes

-   Add `AccountTransaction.target.n` (output index) field
-   Fix `build/node/ripple-worker` (webpack configuration)
-   Update dependencies

# 1.0.12

#### changes

-   Update dependencies

# 1.0.11

#### changes

-   Fixed `recv` transaction targets

# 1.0.10

#### changes

-   Better clearing of `undefined` fields inside nested objects in `Response`
-   Added `misc.erc20Contract` field to getAccountInfo response (fetching info about ERC20 smart contract)

# 1.0.9

#### changes

-   Added new Blockbook methods for fiat rates (`getAccountBalanceHistory`, `getCurrentFiatRates`, `getFiatRatesForTimestamps`, `getFiatRatesTickersList`)

# 1.0.8

#### changes

-   Fix: Ripple notification dispatched for both, sender and receiver

# 1.0.7

#### changes

-   Update outdated node_modules
-   Ripple worker: different reconnection schema since RippleApi@1.6.3
-   Ripple worker: fixed bug with `minLedgerVersion` since RippleApi@1.6.3

# 1.0.6

#### changes

-   Fix for react-native workers
-   Update outdated node_modules

# 1.0.5

#### changes

-   Fixed Ripple-lib transaction event transformation (missing ledger_index field in transaction object)

# 1.0.4

#### changes

-   Update dependencies (ripple-lib@1.4.0) and fix reconnection issue
-   Update types for ERC20 tokens

# 1.0.3

#### changes

-   Add currently connected url to 'getInfo' response
-   Fixed getAccountInfo 'blockbook' type: empty = (transactions === 0 && unconfirmedTransactions === 0)

# 1.0.2

#### changes

-   Fixed getTransaction response

# 1.0.1

#### changes

-   Fixed amount calculation in blockbook Transactions

# 1.0.0-rc3

#### changes

-   Added possibility to export workers as a main thread module (using webpack build)
-   ./src/workers/common.ts changed to class for multiple instance usage

# 1.0.0-rc1

-   First release
