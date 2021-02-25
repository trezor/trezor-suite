# 1.0.17

#### changes
- Fixed tx.amount for btc-like sent txs
- Added tx.totalSpent
- Added tx.details.locktime
# 1.0.16

#### changes
- Fixed an issue where account with non-zero balance could be marked as empty (eth)
- Pending ETH transaction fee calculated from `ethereumSpecific` field
- Added missing types (data) to `ethereumSpecific` field

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
