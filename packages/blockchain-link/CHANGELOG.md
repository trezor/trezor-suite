# 2.1.14

-   feat: update deps across non-native packages (16053e222)- feat: update deps in root package.json (5806d41bc)- chore(blockchain-link): use TypedEmitter from `@trezor/utils` (395331f2f)- feat(blockchain-link): add getMempoolFilters method (5711aa998)- chore: use workspace:\* everywhere (819c019d1)- chore(blockchain-link): use `@trezor/e2e-utils` in tests (3e072b11f)- chore(blockchain-link): fix ripple blocktime (844eb2f59)- npm-release: @trezor/utxo-lib 1.0.5 (fb32cdac5)- npm-release: @trezor/utils 9.0.7 (b55cabe95)- chore: remove ETH Ropsten (f1476a391)- chore: token.address to token.contract (b846fc88b)- chore(blockchain-link): allow ERC-X to go through (0ff98e965)- feat(suite): internal transactions in transaction history list (8108b43cf)- chore: update deps (97fd16bb1)- feat(blockchain-link): add token param to blockbook fiat methods (d8d076915)- chore(deps): bump webpack from 5.75.0 to 5.76.0 (a8931c25a)- feat(blockchain-link): fix websocket dispose (00cb4669c)- chore: separate utils and types from blockchain-link (a8f3042cb)- chore(blockchain-link): improvements for cj reuse (2ff811941)- fix(suite-native): cardano websocket (#7722) (177d1a22c)- feat(blockchain-link): add getBlock method (12b31a947)- feat(blockchain-link): add mempool subscription (a413154d5)- chore(prettier): update formatting after prettier upgrade (3edbe0df6)- feat(mix): update deps (1bed6820b)- feat(desktop): update deps (79d702d59)- feat: update typescript (151f364d7)- feat(suite): update deps (1a997e6cb)- npm-release: @trezor/utils 9.0.5 (1e57d3a19)- npm-release: utxo-lib 1.0.3 (4b67e5f5f)- feat: cardano preview testnet (4c8e4dccd)- release: @trezor/blockchain-link 2.1.6 (525954374)- release: @trezor/utxo-lib 1.0.2 (7a93f7703)- release: @trezor/utils 9.0.4 (ec96cd28a)- fix(blockchain-link): sortTxsFromLatest fixed (68434754c)- chore(monorepo): force workspace resolutions (d027b9763)- fix(coinjoin): order of txs in the same block (26b0a1d40)- chore(npm): fix yarn publish command and prevent using npm (fbceedba2)- feat(webpack): update webpack cli and dev server (63fa02f63)- feat: update few libs without changes (5d1f95388)- chore: Upgrade to TS 4.9 (#6932) (b23f7b7bf)- feat(storybook): resolve webpack to v5 (9829076b5)- release: @trezor/blockchain-link 2.1.5 (14b0f096d)- release: @trezor/utxo-lib 1.0.1 (068bd5cd1)- release: @trezor/utils 9.0.3 (5d58e6fa7)- feat(suite): improve coinjoin service fee calculation (bbf3d9f26)- test(blockchain-link): fixture with feerate and vsize (1a97fd5b1)- feat(blockchain-link): add vsize and feeRate (008cff18d)- chore(suite): rework b3f7dd8 and add anonymitySet to AccountInfo in @trezor/blockchain-link (3570de9dd)- feat(blockchain-link): joint txs in electrum (db7b5fe51)- refactor(blockchain-link): loosen util types (96c549734)- release: @trezor/blockchain-link 2.1.4 (4607bd247)- feat(blockchain-link): add isAccountOwned to I/Os (8c90a7120)- feat(blockchain-link): add joint transaction type (0cce80c6f)- refactor(blockchain-link): remove unused totalSpent (79ee70f07)- refactor(blockchain-link): export common utils (d80e2ef74)- chore: remove trailing whitespaces (39ea716a0)- chore(ci): Nx for github validations (#6095) (a446583d5)- chore: upgrade to yarn 3 (#6061) (39c0ed80e)- chore(lint): enforce usage of @ts-expect-error (50ce258b0)- chore(suite): update dependencies without breaking changes (765124294)- chore(all): add missing EOF newlines (530252205)- chore: run all node scripts using tsx (#5987) (c1ad0f875)- chore: forbid redundant eslint disable directives (1485646d8)- chore(dependencies): update webpack libs (359030332)- chore(dependencies): update ts-loader (599b06744)- feat(websocket): Add ws interface for React Native with user agent (218395c84)- test(blockchain-link): electrum pagination fix (8030df6cf)- fix(blockchain-link): electrum txs pagination (5f6e26701)- deps: update ts-loader (a580b9d88)- deps: update webpack (31d4cf5e3)- release: @trezor/utils 9.0.2 (fe848fc71)- fix: update public packages homepage (deb62e4b0)- feat(suite): update libs without breaking changes (75f79009c)- feat(blockchain-link): get zcash consensus branch id from server info (26e176466)- chore: update trezor-utils version (b78fd2dd3)- fix(blockchain-link): proper transaction order (23fac0288)- fix(blockchain-link): notification throttling (ae72754ea)- fix(blockchain-link): electrum block caching (f99207bda)- fix(blockchain-link): testnet subscription fix (9c4877f47)- perf(blockchain-link): electrum optimization (ee2c40c25)- chore(utils): util for parsing hostname (7728574f1)- feat(blockchain-link): backend prioritization (612848dc0)- fix(blockchain-link): disallow concurrent connects (85a412b02)- Revert Revert refactor(blockchain-link): unify backend selection (bfe6b8001)- chore(blockchain-link): add Params/Response type utility (ddecada12)- fix(blockchain-link): missing ADA types (45a68e3da)- chore: remove \_old references from config files (bf0e4020d)- feat: new suite-native app boilerplate (#5186) (e4b515eb4)- release: blockchain-link 2.1.3 (730167edd)- Revert refactor(blockchain-link): unify backend selection (c371cfb98)- release: @trezor/blockchain-link 2.1.2 (b00736043)- feat(blockchain-link): add withdrawal and deposits amounts to transaction (0058c2da8)- chore(docs): unify readmes in packages (d49065dea)- chore: update npm ignore (37de98ba0)- fix(blockchain-link): throttle block events (aa5e6cc45)- fix(test): fix blockchain-link test in the ci (5fa4bbb39)- chore: update ts-loader (e81d7ac97)- chore: update webpack-dev-server (26f4001a8)- chore: update webpack and related (bd4ca1d25)- refactor(blockchain-link): unify backend selection (8316e3bb4)- feat(blockchain-link): electrum backends shuffle (cefa971a3)- fix(blockchain-link): set proxyAgent protocol to satisfy sentry wrapper (4de95de7c)- feat: Cardano Integration - UI (8fed4ff93)- chore: TS refactor to composite project, upgrade to TS 4.5 (#4851) (182439a7f)- test: add electrum inegration blockchain-link (5aa8a78eb)- chore: Prettier refactor, update, add CI check (#4950) (6253be3f9)- release: @trezor/blockchain-link 2.1.1 (403d946b9)- fix(blockchain-link): use proxy agent conditionally in RippleApi (50230f119)- release @trezor/blockchain-link 2.1.0 (e73cccfba)- release: @trezor/utils 1.0.1 (ace6ddf7a)- docs: add readme how to publish @trezor package to npm registry (d1c809ec1)- chore(blockchain-link): discovery from utxo-lib (4981c5d0f)- chore(blockchain-link): derivation from utxo-lib (60fd5c052)- chore(blockchain-link): use utils package (0273a2862)- chore(lint): remove forgotten console.log and turn off warnings for when we want them (75d6a219a)- fixup: blockchain-link (electrum) integration tests (7ff84c79b)- chore: temporary changes (316387936)- feat(blockchain-link): regtest/electrum support (98d3e32a9)- feat(blockchain-link): electrum server (ab1e7e414)- fix(blockchain-link): add ProxyAgent for nodejs + tor connection (2d8aa3e0d)- fix(blockchain-link): spoof headers for nodejs websocket connection (267f62de4)- feat: unify promise utils (88651b062)- chore: update webpack-cli (f3a941cea)- upgrade dependencies (#4711) (b0defd675)- chore(code): refactor eslint for blockchain link (bd50ec893)- chore(code): Deduplicate modules (a83a0774f)- release(blockchain-link): version 2.0.0 (bd80ea8fa)- docs(blockchain-link): update README (0a57b3ee5)- chore(blockchain-link): remove unused dependencies (820bd8ac2)- refactor(blockchain-link): webpack without babel (eac6227d8)- test(blockchain-link): use modules, workers and builds (ec1ca33e9)- refactor(blockchain-link): worker index as module (da596bce4)- refactor(blockchain-link): use strict typescript settings (1a6b3e72a)- chore(blockchain-link): update eslint rules (f89e7b684)- chore(blockchain-link): use es2017 compiler to build lib (b0f3b4ce7)- feat: @trezor/blockchain-link 1.1.0 (60cc46fd4)- feat(blockchain-link) - Blockfrost balance history (#4683) (ccff1d1ce)- fix(blockchain-link): fill tx targets when swapping ETH <-> ERC20 (353f49668)- cardano blockchain-link fixes (#4479) (884a5da5d)- fix(blockchain-link): use all vouts if tx was sent to change address as external output (55e0d2fb0)- feat: Cardano intergration (9eef7e18e)- chore(dependencies): update ts-node and remove no more needed config with comments in json files (invalid syntax) (4ae0afb5a)- chore(dependencies): upgrade typescript on latest version to get newest features (5fe2b6d65)- tests: mock console log/warn in unit tests (ec1486f8f)- fix(blockchain-link): change XRP default base reserve (c7fe1f054)- fix(blockchain-link): revert adding peer dependencies (da93a756b)- fix(blockchain-link): add missing peer dependency of ws lib (995454309)- chore: update webpack and related libs (b35ec32bb)- chore: use webpack5 in @trezor/blockchain-link (adc7eaee3)- chore: update prettier and eslint (c6694afef)- docs: Improve blockchain-link README (cc2f13cea)- chore: update eslint (78736782f)- chore: update babel dependencies (1c2e16fca)- fix(blockchain-link): add tx.lockTime field (dfdcd4a71)- fix(blockchain-link): types circular references (3b15c48e1)- chore(blockchain-link): prepare 1.0.17 (46987f9a3)- fix(blockchain-link): dont include fee in tx.amount (btc sent tx), add totalSpent (67747d584)- release: blockchain-link@1.0.16 (f181c26df)- fix(blockchain-link): add missing types in tx.ethereumSpecific (6a4150b2b)- fix(blockchain-link): ETH pending fee (4628d7cee)- fix(blockchain-link): check if available balance is zero before marking account as empty (2d0d60b3e)- fix: ethereum estimate gas limit (b05a488bf)- chore: upgrade react 17, next 10, react-native 0.63.4 and other deps (b0b7982b2)- blockchain-link 1.0.15 (887ea0551)- chore: update deprecated filed in jest.configs (157ce2ed1)- test(blockchain-link): transaction details (09aa64093)- feat(blockchain-link): add transaction details (1a9951793)- fix(blockchain-link): typed event listeners (adbb21aa2)- fix(blockchain-link): remove artificial workersDependencies, expose lib/build files, expose types (7efa0c6a7)- chore: update blockchain-link dependencies (e24660185)- chore: update eslint related dependencies (c79dd874f)- chore: update babel related dependencies (0182a8359)- chore(eslint): add require-await rule (29c759985)- chore(update): various minor dev patch deps (9e68f1041)- chore: bump typescript, eslint, babel deps and fix lint errors (3135d7f1d)- chore(blockchain-link): update version (e251ac618)- chore(blockchain-link): update dependencies (5068dd426)- bump connect (8.1.10) (#2194) (f65b21fe9)- Blockchain link 1.0.13 (#2053) (9d2fa6fef)- Update/ts39 (#2019) (534573ffe)- update blockchain-link dependencies (#1981) (4e3ec2f6b)- Fix/pending balance (#1878) (742cdf11a)- Fix/blockchain link recv tx (#1750) (e81570362)- Feat/update connect (#1626) (77f13e96b)- Fix/bl test (#1516) (7b4a0a188)- Feature/new-account-menu (#1467) (46c577801)- Blockchain-link: fix type in AccountBalanceHistory (#1426) (5efc8e829)- Blockchain link@1.0.10 (#1409) (88fcba229)- Send form - upgrades and bugs (#1393) (b06f271f3)- Update modules (#1372) (b73a0fbb2)- Coin balance format (#1298) (9bd5b38fd)- blockchain-link@1.0.9 (ecd760e20)- Update modules (#1307) (63cfa20a5)- Update/trezor connect 8.1.0 beta2 (#1283) (695309d24)- blockchain-link-v.1.0.8 (#1281) (8fcc74d4e)- Fix/update account (#1279) (a9741da67)- blockchain-link v1.0.7 (#1224) (27ab9a8b2)- Another bunch of modules update (#1127) (b01ed696d)- Update modules (#1067) (a36b249a8)- upgrade to ts 3.7 (#879) (ab09e495e)- Feature/rn bridge (#912) (223e8e863)- blockchain-link@1.0.6 (#865) (3d158052b)- Feature/node modules update (#820) (1a44e6b7d)- fix ripple 'transaction' stream event (50caae29b)- remove unnecessary ts-ignore (29dc56fa6)- Update CHANGELOG.md (c2da45723)- fix ui imports (7757132a5)- RippleApi reconnection issue (5fa5bcb6f)- Update CHANGELOG.md (e8eb4d5cb)- blockchain-link@1.0.4 (d40b5d0ac)- fix TinyWorker import (b6bde2b73)- fix Websocket import (b0e0d42d4)- update blockchain-link dependencies (ripple-lib fix) (ffc7f18c8)- fix blockchain-link module-worker-loader (declare postMessage) (35401ca72)- retype TokenInfo object (1bae0e195)- add type check for blockchain link (#644) (59da49d7a)- lint fix (92b7d9105)- add url field to BlockchainLink.getInfo response (dbedd65c8)- @trezor/blockchain-link@1.0.3 (3167f516b)- blockchain-link: fixed response of getTransaction method (#587) (5baa73539)- release @trezor/blockchain-link@1.0.1 (74b989df2)- recalc sent txs amount (btc + eth) (4d85534ac)- test fixtures with amounts (1bedaf83a)- fix amount calculation + tests (3e065fa2a)- recalculate amount in account transactions (dee18a739)- .eslintignore for VSCode and scripts (#401) (c8fe62350)- move typescript and ts-jest to root and fix few types (#397) (789e7319c)- Propagate static files across the monorepo, remove build target for suite-onboarding (#387) (869f8d698)- disable eslint in blockchain-link webpack loader (22d3fcd46)- @blockchain-link: fix common native postMessage call (af766d473)- @blockchain-link: version 1.0.0-rc2 (7fb7468ff)- @blockchain-link: move workers.common methods to class (72d50c541)- @blockchain-link: add build for react-native (258d0adab)- Update package.json (11b48fb59)- Merge pull request #307 from trezor/fix/blockchain-link-params (8537c128e)- Publish (6a730cade)- Update README.md (a373e4ac1)- separate workers dependencies (4e1b1dfd3)- remove unnecessary eslint-ignore and ts-ignore + ts fix for ripple available balance (8d6c0ae85)- add ethereumSpecific to transaction object (d779f38f7)- increase tests coverage (10b058d74)- Merge pull request #286 from trezor/fix/blockchain-link-params (63aaa410a)- ripple error as full string (dbcd2c81c)- add lerna and bootstrap packages (7a6828cf3)- do not throw error for ripple getAccountInfo - mempool info (468574234)- eslint fix (479cd3fa9)- pass terminate from test to worker (c8ef7eed2)- getTransaction tests (0eb986a12)- estimateFee tests (76d96a942)- implement getBlockHash in tests (3a62c7125)- implement getBlockHash in ui (0b0fec08a)- implement getBlockHash in blockbook worker (7cc62590a)- pushTransaction test (ea58b9009)- worker timeout from parameter (177c41011)- race condition fix for subscription error (223ac7864)- fix typescript in tests (11faca797)- fix test weboscket (df7e611a4)- disconnect blockchain in every test teardown (c78669a43)- add coinbase to utxo (in will be provided by blockbook) (226790772)- eslint fix (feeca81f3)- enable keepAlive test (01c057fe1)- add rbf check for transaction parser (03c7f2c5a)- fixing tests (60cc68f94)- add ping and connection timeouts (745b8522e)- transform ripple error to CustomError (2a9ec9add)- type predefined errors (9e8c5b195)- add timeout and keepAlive params (136f6b6d0)- add blockHash call to blockbook websocket (b2a993270)- temporary workaround for ripple high fee (8d4015c96)- build ws wrapper (utils/ws) from typescript (01a0a9134)- remove coinbase field from utxo (blockbook doesnt provide that) (e04532d5f)- ui fixes (9502f83e4)- add more coins to config (btc-like) (f904f2b7a)- estimateFee, accountUtxo, pushTransaction (3162120ad)- getAccountInfo: add empty field + availableBalance calculation (936d10368)- remove Error from responses (d1edc9f0f)- move workers config to a single file (849ad4207)- test ci (0b3a763f8)- update connection test (b506fdcc3)- separate subscribe and notifications tests (20ad8435d)- test/weboscket: sendNotification with receive client (ca1f821da)- Delete mocha.opts (119c1ced0)- enable test verbose (158b2e4b8)- eslint disable console (26e330110)- blockchain-link: enable connection test for ripple (172b7999b)- Merge pull request #217 from trezor/fix/blockchain-link-eslint (68eb568d0)- test branch without ci folders again (bddcbee3b)- test branch (d3069aabb)- update tsconfigs (239e0907a)- fix integration tests (70307b197)- fix common utils types (b49d014ed)- fixed pingTimeout type (d4af73b39)- fix workers.common (a1dded722)- no-hoist for babel-jest (fed7858a7)- remove yarn.lock from blockchain-link (6577ea5b1)- eslint fixes manual (501441715)- eslint --fix (c804c8f00)- lint everyhting in blockhain link (d39663f1c)- add blockchain link ci (874204ee3)- Add 'packages/blockchain-link/' from commit '21e2523c245511777797f0733d741b112d83713d' (e14b52322)

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
