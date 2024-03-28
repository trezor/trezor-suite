# 2.1.28

-   fix(blockchain-link): fix Solana transaction confirmation (38cd7ccdb6)
-   feat(blockchain-link): add support for Solana priority fees (a6c2aa8c7d)
-   fix(blockchain-link): hanging connection issue (#11516) (6cb0d99c03)
-   fix: wait on solana confirmed tx (#11515) (3cb139fbd3)
-   chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
-   chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 2.1.26

-   fix: from g:tsx to local tsx in prepublish script (d21d698b2)
-   chore(suite): replace `selectCoinsLegacy` by fiat rates selectors (4e3ce7367)
-   chore(suite): autofix newlines (c82455e74)
-   chore(utils): remove build step requirement from @trezor/utils (#11176) (6cd3d3c81)
-   chore(blockchain-link): remove unused error event (4c1b8df7d)
-   refactor(blockchain-link): use `createDeferredManager` (037ecfe68)
-   Fix: add missing keys that eslint was complaining about (#11167) (824c8b18b)
-   chore(repo): ESLint refactor + speed up 70% (#11143) (44fa12a79)
-   chore: update css-loader and remove it from resolutions (953de853e)
-   chore: update various dependencies (no major update) (fecd89f6e)
-   chore: use global tsx (c21d81f66)
-   chore: update typescript and use global tsc (84bc9b8bd)
-   chore: use global rimraf (5a6759eff)
-   chore: update prettier (00fe229e0)
-   chore: use global jest (a7e68797d)
-   chore: upgrade jest to 29.7.0 (3c656dc0b)
-   chore: upgrade jest (004938e24)
-   chore: update root dependencies (fac6d99ec)

# 2.1.25

-   feat(suite): Rename Polygon to Polygon PoS (15a7fd38dc)
-   feat(suite): add Polygon (8c569ca580)
-   Revert feat(blockchain-link); get sol token metadata from coingecko (61cf93cd62)

# 2.1.23

-   feat(blockchain-link); get sol token metadata from coingecko (5c901ea8f)

# 2.1.22

-   fix(suite): subscribe to Solana token accounts as well (b2f85ac9e)
-   fix(suite): re-enable Solana account subscriptions (still without token accounts support) (e05f8c9ed)
-   fix(suite): fix subscription return values (149903f8e)
-   fix(blockchain-link): no throw from ws.close (7e6e79b1c)
-   chore: bump `ws` to 8.16.0 (bd1e5ec81)

# 2.1.21

-   fix(blockchain-link): fix solana txs when sending to associated token account (5cb682078)
-   feat(electrum): support non-batching servers (e06b9375a)
-   test(blockchain-link): remove `TypedRawTransaction` (d3354fdf2)
-   feat(blockchain-link): remove `TypedRawTransaction` (34d405d12)
-   feat(blockchain-link): add `getTransactionHex` method (cbca5dbfd)
-   refactor(blockchain-link): adjust `transformTransaction` params (2d669d72e)
-   chore(blockchain-link): remove ADA `null` subtype (07161b141)
-   test(blockchain-link): smaller timeouts (cd83adc61)
-   test(blockchain-link): fix error testing (7995e957e)

# 2.1.20

-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
-   chore(blockchain-link): use extended top-level tsconfig (d17da1f35)
-   chore: update `jest` and related dependency (b8a321c83)
-   fix(blockchain-link): use timeout field of RippleApi.APIOptions (eafa4f308)
-   chore(blockchain-link): use default imports from commonjs dependencies (9a81b0459)
-   chore: Throttler throttling instead of debouncing in `@trezor/blockchain-link` (#10288) (f7ff0cf9f)
-   fix(blockchain-link): consider only unique solana signatures when paginating (e00cf70ac)
-   chore(repo): update tsx (53de3e3a8)
-   feat(suite): add Solana support (f2a89b34f)

# 2.1.19

-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   fix(blockchain-link): PR review fixes (08d84dfe6)
-   chore(suite): update lockfile (761aea82b)
-   feat(blockchain-link): Solana tx history (9dff5e509)
-   feat(blockchain-link): Solana pushTx (e63813bb6)
-   feat(blockchain-link): Solana tokens (9adc115ce)
-   feat(blockchain-link): Solana getAccountInfo (248913743)
-   feat(blockchain-link): Solana estimateFee (34a2f28a0)
-   feat(blockchain-link): Solana worker setup (662bc092a)
-   feat(blockchain-link): Solana ui config (98407f35a)
-   chore(tests): cleanup jets configs (#9869) (7b68bab05)
-   feat(deps): update deps without breaking changes (7e0584c51)
-   chore: update prettier to v3 and reformat (4229fd483)
-   chore(connect): bl workers dynamic import (74fd08389)
-   chore(build): update deps related to suite app build (6ab9e6322)
-   chore(desktop): update deps related to desktop packages (af412cfb5)
-   fix(blockchain-link): multiple workers initialization (#9766) (3208ea280)

# 2.1.17

-   feat(blockchain-link): add block filter methods (66606afc6)
-   chore: adjust/unify createDeferred usage (4d724a451)

# 2.1.16

-   feat(blockchain-link): ipv6 electrum support (1d4b5471c)
-   fix(blockchain-link): WsWrapper default export (0c5297e56)
-   feat(blockchain-link): return tx hex in blockbook transactions (6aba6f094)
-   feat(blockchain-link): add baseWebsocket options (951bd3e29)

# 2.1.14

-   fix(coinjoin): pending ws message closing recovery (0171cf3ef)
-   chore(deps): update (a21a081ba)
-   chore(blockchain-link): remove ts-loader from blockchain-link (3b117830a)
-   fix(blockchain-link): browser and native Websocket error message (e160101f5)
-   fix(blockchain-link): handle Websocket ping rejection (b9940b6e9)
-   chore(blockchain-link): define missing extraneous dependencies (83230e063)

# 2.1.12

-   5711aa998 feat(blockchain-link): add getMempoolFilters method
-   819c019d1 chore: use workspace:\* everywhere
-   3e072b11f chore(blockchain-link): use `@trezor/e2e-utils` in tests

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
