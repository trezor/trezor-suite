# 10.0.0

- refactor(suite): give each app its own webpack config and remove `suite-build` (f7bbb3d9f4)
- npm-prerelease: @trezor/blockchain-link 10.0.0-beta.3 (0865169c30)
- npm-prerelease: @trezor/blockchain-link 10.0.0-beta.2 (2d40b1523d)
- fix(solana): guard v1 transaction type (d24fa8a5d8)
- fix(solana): gracefuly abort on invalid transaction (b765c07614)
- fix(solana): bump max supported tx version (e48e6cc309)
- refactor(blockchain-link): log only message type in worker onmessage (aaa9292fe7)
- fix(blockchain-link): solana discovery issue (d1fc98016c)
- perf(blockchain-link): skip Solana signature fan-out for unchanged addresses (ddbd5f86f1)
- fix(blockchain-link): subscribe Solana token accounts by owner filter (38b146b18a)
- refactor(blockchain-link): evm rpc chainId validation (aa76c2066f)
- fix(blockchain-link): keep request data out of evm-rpc warnings (523de85e0a)
- perf(blockchain-link): reuse the cached chain id across evm-rpc handlers (e7be97bc26)
- refactor(blockchain-link): constrain accounting function names to the ABI (ca68147e13)
- feat(blockchain-link): optimize pool data loading (4ed345aecb)
- feat(blockchain-link): batch token calls (0726634d94)
- feat(blockchain-link): add multicall support (84d7df25c7)
- refactor(blockchain-link): split ripple worker into handlers and subscriptions (c75522f11c)
- refactor(blockchain-link): split solana worker into handlers and subscriptions (bb981b37c6)
- refactor(blockchain-link): split stellar worker into handlers and subscriptions (66bc14f5f6)
- fix(blockchain-link): preserve error causes compatibly (be76a74fdb)
- chore(eslint): adopt remaining v10 recommended rules (e5916c5f13)
- refactor(blockchain-link): split blockbook worker into handlers and subscriptions (d30a616025)
- chore(suite): bump webpack-related deps (e896473fda)
- feat(suite-core): sending pending nonces and tx ids for blockbook discovery (754da40740)
- feat(suite-core): improve displaying of spent gas for L2 networks (ea3cfd9262)
- fix(stellar): do not report Horizon errors as an empty account (0ab64ba3eb)
- fix(stellar): tolerate missing Horizon history during discovery (9eda26a8e6)
- chore(blockchain-link): format Jest config (b730531800)
- test(blockchain-link): identify integration tests (001fb9ae41)
- Revert refactor(blockchain-link): name worker source files (d9af22a365)
- test(blockchain-link): share test workers (4fdaa1ef13)
- refactor(blockchain-link): name worker source files (59d9b0425b)
- test(blockchain-link): import workers directly (b5d9337b12)
- test(blockchain-link): co-locate tests (d9d8f1c24e)
- chore(connect): bump version to 10.0.0-beta.1 (aaac2abdea)
- feat(blockchain-link): add HyperEVM support (e6fc253368)
- feat(blockchain-link): add page param to getBlock (221fd2e679)
- feat(blockchain-link): add Robinhood Chain support (0e3a6962f2)
- refactor(networks): centralize more chain constants in network packages (6ea67d3809)
- refactor(blockchain-link): shrink account info fixture declaration (53cd5a5cad)
- chore: bump viem (f68294e8df)
- refactor(networks): centralize constants in network packages (77d7adc77a)
- chore(networks): rename sdk packages (18fa2fa279)
- chore(networks): adjust relative paths (b0af094307)
- chore(networks): rename coins-xrpl to coins-ripple (080a06af77)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- chore: bump webpack-related deps (6d86552779)
- fix(blockchain-link): handle uncaught exception in Electrum client (76e7175d7e)
- test(blockchain-link): adjust unit tests (bcb890f16f)
- feat(blockchain-link): analyze txs in getTransaction (f427360a26)
- chore(blockchain-link): add descriptor to getTransaction (6edebff196)
- feat(blockchain-link): evm specific data for gas (f5ae99c78b)
- refactor: preserve original runtime semantics in narrowed casts (f5a85530f4)
- refactor: replace as any casts that masked real type gaps (9ed799c3b3)
- refactor: remove unnecessary type assertions (packages/* small bundle) (026e959ed9)
- fix: bump @types/jest to 30 for TS7 compatibility (d782d3d606)
- refactor: replace boolean find checks with some (f564057a5e)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- fix(blockchain-link): default token decimals to 18 when missing (ec8a2444b9)
- chore: bump viem to 2.52.0 (83a4f768fd)
- chore(xrpl): remove unused deps (abe28a77db)
- chore(xrpl): use code from @trezor/coins-xrpl (2042397735)
- chore(xrpl): add @trezor/coins-xrpl deps (60e9ef3f66)
- chore(stellar): remove unused deps (8cf3fe95f6)
- chore(stellar): polished stellar base reserve (321e5e2868)
- chore(stellar): use code from @trezor/coins-stellar (ce324b1f0a)
- chore(stellar): add @trezor/coins-stellar deps (d218a24716)
- chore: bump webpack packages (ee6e4cacb3)
- refactor: invert throw and return branches (323c89cbfe)
- chore: use extended isHex util (f473d8c2f0)
- chore(wallet): add diagnostic logs for unknown BTC pending tx (f163bcfb36)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- fix: resolve noUncheckedIndexedAccess errors across the codebase (e0d8a3bd20)
- refactor: adopt filter predicates (isNotNull, isNotNullOrUndefined, isNotUndefined) from @trezor/utils (bc72363c9b)
- test(blockchain-link): paginate Horizon to reduce Stellar pushTransaction flake (184e00ba48)
- refactor(blockchain-link): convert (x && x.y) checks to optional chaining (f389d23553)
- refactor: use throwError where possible (32383ee4b7)
- chore(connect): drop redundant publishConfig.type in ESM packages (af2b73c765)
- refactor(solana): change internal structure of @trezor/coins-solana (9d8b8616aa)
- refactor(solana): reorder imports (ccb3cfa3f1)
- refactor(solana): rename to @trezor/coins-solana (cf46b52fd1)
- chore(solana): remove unused deps (36b24a79c1)
- chore(solana): remove old utils (1f99803fa6)
- chore(solana): use utils from @connect-coins/solana (310700efae)
- chore(solana): use types and constants from @connect-coins/solana (016ce57eb8)
- chore(solana): add @connect-coins/solana deps (810c89861f)
- chore: tsconfig formatting (8c60ca008d)
- chore(connect): support top-level module type in ESM packages (9aebe9cfb0)
- chore(deps): bump webpack-related deps (0aacdfd8c5)
- feat(connect): drop CommonJS output across connect ecosystem (b99609bfb8)
- chore(blockchain-link): drop obsolete mainFields override (32bcb0bf50)
- chore(blockchain-link): drop crypto-browserify and stream-browserify polyfills (43e1326dba)
- chore: use type imports (b4caf7f0ac)
- chore(blockchain-link): remove dead TOKEN_DISCOVERY constant (4f3b7dccad)
- chore(blockchain-link): remove dead getTransferAddressesFromLog and TRANSFER_EVENT_SIGNATURE (bcb5b5b6f6)
- chore(blockchain-link): remove unused tokenDiscovery module (d17a7b3cce)
- chore(blockchain-link): remove unused ABI_CONTRACT_POOL constant (4cb0185a76)
- chore(blockchain-link): remove dead removeEmpty method from WorkerState (5af65132e6)
- refactor: replace indexOf comparisons with Array.includes (99cca423fe)
- chore: bump viem (0312abb10f)
- feat(suite): resolve fiat rates for ERC4626 tokens (d59fbc3290)
- fix(blockchain-link): use subscription id safely (57b864a5be)
- chore: update solana backend (e673df88b0)
- feat(blockchain-link): add concurrency to blockbook websocket (b431601511)
- feat(blockchain-link): gap limit in electrum (fc248c1bd5)
- chore(deps): bump @types/chrome, @types/sharedworker, @types/web (3e952cd6fd)
- chore(deps): bump crypto-browserify and postcss patches (027685a6c9)
- chore(tests): migrate web packages to @swc/jest (15192f30ee)
- ci(test-misc): reduce unit-test log noise with --silent and drop --verbose (0ca849c648)
- chore: make all blockchain-link-types import direct, no imports (d073ff12e6)
- fix(blockchain-link): stellar token symbol uppercase consistency (e2dc215f35)
- chore: remove npmPublishAccess fields from package.json (743d2836de)
- chore: unify package.json publishConfig (216e6de7cc)
- chore: update socks-proxy-agent (1de9cac3e2)
- chore(blockchain-link): update proxy API (13879c4b7c)
- chore(suite): bump webpack & related dependencies (caaf00064c)
- chore: unify dependency versions across monorepo (a9d6a995c2)
- test(blockchain-link): change usdc to USDC integration stellar tests (27ac2149be)
- refactor(blockchain-link): pass isTestnet to Stellar pushTransaction instead of hardcoding (1668d36ef7)
- chore(blockchain-link): import direction cleanup, backend specific imports from common, not other way round (e676e2fdd6)
- fix: export from BlockchainLink (87f30cf8a7)
- fix: timerId typing issue (83cbb2bb37)
- fix(blockchain-link): use connect variant available in react-native-tcp-socket (d3a8dd74fa)
- refactor: replace custom eslint script with nx one (ad87eac457)
- chore: add type keyword to all types in imports and exports (47c184a859)
- feat(connect): add .mjs to ESM build (d1bd996295)
- feat: add analytics for the staking providers in coin_discovery event (2dc15fbc9b)
- fix: webpack ProvidePlugin process (1fcceaa344)
- chore: bump viem (5d2c7bb577)
- chore: bump xrpl (566505be9e)
- chore: remove unused `prepublishOnly` script (0056cb62fa)
- feat(suite): add Outside Staking Card component and related messages for external staking accounts (17539cb17d)
- feat(blockchain-link): enhance getSolanaStakingData to filter staking accounts based on criteria (a220c6e036)
- fix(suite): revert publishable npm packages paths (d71e46eb17)
- chore(suite): bignumber imports, trezor/utils (c40f6ded6b)
- chore: bump viem (b8e197d9ca)
- chore: bump xrpl (75aaca51f3)
- chore: bump @stellar/stellar-sdk (7c50951a5f)
- chore: Bump webpack deps (b34ff3fc6e)
- chore: update tron url to production (6556523076)
- chore: bump tsx version (98321960e2)
- npm-prerelease: set all @trezor/connect dependencies to 10.0.0-alpha.1 (ab01b2d889)
- feat(connect): add support for discovery of Tron in Suite (94d04ac540)
- chore(npm): remove prepublish.js (7559f035c3)
- build(repository): Connect publishing ESM (a9e189b9a3)
- fix(blockchain-link): deduplicate transaction history by Electrum worker (18e67de4f4)
- feat(suite-native): allow usage of custom Electrum backend for BTC (dcdb9669fe)
- feat(blockchain-link): cache addresses by Electrum worker (c1fcbfb36b)
- chore: bump webpack-related deps (3f73273dba)
- chore(npm): start publishing source maps (36f6e9692d)
- chore(connect, blockchain-link): validate custom RPCs chainIds (8977871032)
- feat(suite): implement evm-rpc worker (e4b44ea619)

# 2.6.1

- npm-prerelease: @trezor/blockchain-link 2.6.1-beta.1 (7f2a0b24e3)

# 2.6.0

- npm-prerelease: @trezor/blockchain-link 2.6.0-beta.2 (f782d73fa1)
- refactor(connect): new replace-imports.sh script using babel (2128d273f3)
- chore(blockchain-link-types): remove TokenInfo.type (11ae574860)
- npm-prerelease: @trezor/blockchain-link 2.6.0-beta.1 (636770f9ab)
- chore: bump xrpl (70df85521c)
- npm-prerelease: @trezor/blockchain-link 2.5.5-beta.1 (91619afb78)
- feat(blockchain-link): refactor base reserve handling and add trustline transaction builders (2b32cef13c)
- chore(suite): update network backends (74e276011e)
- chore(suite): update AVAX backend server (6d7c023598)
- docs(packages): remove link to non-existing document (9291fe7872)
- chore(connect): add Avax (21c129caf1)

# 2.5.4

- npm-prerelease: @trezor/blockchain-link 2.5.4-beta.1 (8972100854)

# 2.5.3

- fix: add TON of missing dependecies in package.json (7027213e3f)
- fix: remove all dependenices that are unused (found by added depcheck script to package.json) (ecae55a2ea)
- fix: missing deptchecks in packages (0d4633e159)
- fix(blockchain-link): increase Solana ping interval to 1 hour (3b3500ca43)
- npm-prerelease: @trezor/blockchain-link 2.5.3-beta.1 (51e7c81ca3)
- fix(suite): swap heading symbol case (b678d3c854)
- chore(blockchain-link): set max CU limit for sol priority fee simulation (071523a391)
- feat(suite): MEV protection (0396c08bb0)
- fix(blockchain-link-utils): do not use pending EVM balance (07f9a2a5a8)
- test(blockchain-utils): update Stellar integration tests to reflect new expected balances and token data (eaed10ed51)
- feat(blockchain-link): add Stellar token metadata handling. (56e7e07e08)
- chore(suite): bump trends deps (4eb03b8e23)
- feat(blockchain-link): solana - limit history fetch and filter subscriptions (9ccd77c8ee)
- fix(blockchain-link): improve ping reliability and disconnect cleanup (3c3e29b2f3)
- refactor(suite): replace send max switch with a button in send form (a9b2a4c275)
- fix(blockchain-link): disable fullHistory loading for Solana accounts to prevent infinite loading (7b840fec5d)
- feat(blockchain-link): add throttled RPC transport for Solana requests (da2ee9564c)
- chore(suite): bump webpack (654184f9a9)
- chore: update @solana/kit (d681087f42)

# 2.5.2

- npm-prerelease: @trezor/blockchain-link 2.5.2-beta.2 (070f16af4a)
- npm-prerelease: @trezor/blockchain-link 2.5.2-beta.1 (f82fa9ad31)
- fix(suite): solana token discovery error (0eff5fccaa)
- feat(blockchain-link): solana basic detail now returns owner of account (ac38387deb)
- refactor(blockchain-link): subscribed to Stellar block updates using a timer instead of event streaming. (8cb0c8aa7b)

# 2.5.1

- npm-prerelease: @trezor/blockchain-link 2.5.1-beta.1 (b569ce862f)
- chore: update trends deps (a9f09975f2)
- chore: add/remove used/unused packages (60fb96bd78)

# 2.5.0

- npm-prerelease: @trezor/blockchain-link 2.5.0-beta.1 (2ef0ddfd38)
- feat(blockchain-link): Add support for Stellar testnet. (2509e54ab4)
- chore: update solana libs (f58d9b6e44)
- chore: pin webpack to 5.98.0 until dynamic import urls are resolved (3c05b2639d)
- chore: update webpack deps (2c97fedec2)
- feat(blockchain-link): Add basic support for Stellar. (48b5ca0b38)

# 2.4.5

- npm-prerelease: @trezor/blockchain-link 2.4.5-beta.1 (ce9a8c061f)
- chore: apply latest prettier (eb758acea9)
- chore: bump build-related deps (66d16eb013)
- chore(blockchain-link): update xrpl.js to 4.2.5 due to security issues in previous compromised versions (f49497d046)
- feat(websocket-client): autospoof Origin header in node.js (b8c2f2ffcc)
- fix(blockchain-link): do not fetch sol staking for tokens detail (fe6b5ed34a)
- fix(blockchain-link): missing staking data with empty sol acc (7422136a1e)
- fix(blockchain-link): blockhash commitment change (9b91862fcc)

# 2.4.4

- npm-prerelease: @trezor/blockchain-link 2.4.4-beta.1 (a19dc530b6)
- feat(blockchain-link): migrate wallet-sdk-solana staking accounts (995ed63410)
- fix(blockchain-link): clean connectPromise (09488c9ab1)
- fix: staking epoch update (8083c2f349)
- feat(blockchain-link): migrate ripple-lib to xrpl.js (422c175f4f)
- feat(websocket-client): sendMessage is now public; support timeout param (b0740c419e)
- chore(blockchain-link): move solana types (b3dfcb0de0)
- chore: update @everstake/wallet-sdk-solana (e3e1f19e32)

# 2.4.3

- npm-prerelease: @trezor/blockchain-link 2.4.3-beta.1 (7b9b8e1ebd)

# 2.4.2

- npm-prerelease: @trezor/blockchain-link 2.4.2-beta.2 (8e9f390bf2)
- chore: update all `@solana-program/*` deps to use ones that depend on `@solana/kit` (b7446ce635)
- chore: replace `@solana/web3.js` with `@solana/kit` (6356bafe6d)
- npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)

# 2.4.1

- npm-prerelease: @trezor/blockchain-link 2.4.1-beta.1 (be66c4683c)
- feat(backend): added backends so that each EVM has 4 endpoints (f5c057c2be)
- feat(blockchain-link-type): change bigint to string in persist (3ecc87c3a5)
- feat(fee): logic for rent fee calculation (2650f6b510)
- fix(blockchain-link): correctly handle Solana server URL (1fe9034132)
- fix(suite): hide non-Everstake Solana staking accounts (cbb6cdbe59)
- fix(repo): fix generate package script (#17300) (a13f269b99)
- chore(blockchain-link): do not fetch solana rpc version (0959e86389)
- chore(blockchain-link): use confirmed Solana blockhash (8c47f52179)
- feat(suite): add timer to solana tx modal (c2aea2a9ca)

# 2.4.0

- feat(blockchain-link): add support for Solana v2 staking (f12b0240c8)
- npm-prerelease: @trezor/blockchain-link 2.4.0-beta.1 (fe6ccbb8ec)
- chore(suite): fix tests (b646159ec2)
- chore: update solana and everstake deps (cf806ff3d0)
- chore(suite): bump webpack (eab0cc7041)
- feat(blockchain-link): add btc testnet4 to ui (3c194a9499)
- npm-prerelease: @trezor/blockchain-link 2.3.7-beta.1 (c961bb9629)
- chore(blockchain-link): use `@trezor/websocket-client` package (5d1c40cf02)
- test(blockchain-link): use JestCustomEnv.js to detect exceeding listeners (edb3f82eaa)
- chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
- feat(suite): update destination tag field display in the send form (7ab690b3d1)
- fix(blockchain-link): change success status in failed transactions with missing destination tag (dd6d496fd3)
- feat(suite): add Destination tag into TxDetail (c46de7a9c3)
- fix(blockchain-link): stop ripple ping timeout if api disconnected (0342e33b03)
- fix(blockchain-link): remove console.error in solana rpc (170932133b)
- fix(blockchain-link): don't log error on solana rpc channel closed (776e1d8584)
- feat(solana): more generic transaction parsing (89bc5a54fd)
- chore(deps): update various @types packages (c6c6b36900)
- fix(blockchain-link): CustomError with message passed as code (5285872b3f)
- fix: make types strict to prevent accidental deletion via unused types, the optionality is a trap, they are required (184ebbb7f4)
- chore: enable ESLint rule for as-needed | auto-fix (64fcbde4bd)
- fix(blockchain-link): blockfrost getAccountInfo details fallback (2e76785bd1)
- chore(blockchain-link): cache solana epoch (edc9a53b29)
- feat(blockchain-link): add Solana epoch info call and upgrade SDK (2a8262578d)
- chore(blockchain-link): update networks to use trezor.io proxy servers (c6d420cde0)
- fix(suite): tests network symbol (6160341b24)
- feat(connect): add support of L2 ETH networks (26ff8eada4)
- feat(blockchain-link): add Arbitrum one (6b5cdf2cb0)
- chore(blockchain-link): replace cross-fetch in workers webpack (bb1b85ff65)
- fix(blockchain-link): add stakingAccounts property to AccountInfo interface (e2e907090f)
- feat(solana): add support for Token-2022 tokens (9abc7d93dd)

# 2.3.5

- npm-prerelease: @trezor/blockchain-link 2.3.5-beta.1 (d7c82a5c70)
- chore: unify types for setTimeout return type to address the NodeJS types leak issue (3f34981e5d)
- fix(blockchain-link): update ripple default backends (0652732a54)

# 2.3.4

- npm-prerelease: @trezor/blockchain-link 2.3.4-beta.1 (b6f0602c75)
- fix(blockchain-link): solana fetch isTestnet only once (fb0a013bd8)

# 2.3.3

- npm-prerelease: @trezor/blockchain-link 2.3.3-beta.1 (bb519376e8)

# 2.3.2

- npm-prerelease: @trezor/blockchain-link 2.3.2-beta.2 (eacdfff276)
- chore: bump webpack (fc04fea1de)
- chore: get rid of '@typescript-eslint/no-unused-vars': 'off', and enforce it everywhere (1ad7b6f9b1)
- chore: enable import/order rule for whole codebase - prettier fix (12b6fb18b9)
- chore: enable import/order rule for whole codebase (e22b683733)
- chore: enforce @typescript-eslint/no-restricted-imports everywhere (5d1104bfeb)
- chore: add recommanded checks from eslint-plugin-jest (55d663ca2d)
- chore: add 'import/no-duplicates' ESLint rule (8d8beba862)
- chore: update solana lib (76519c7c16)
- chore: add 'no-case-declarations' ESLint rule (855548f686)
- fix(blockchain-link): show better message for solana expired txs (74d5365ff5)
- fix(blockchain-link): export socks-prosy-agent for browser (e9973e9117)
- feat(blockchain-link): implement ethereum rpc call (2732533db8)
- chore(libs): update @types/web 0.0.162 to 0.0.174 (30298f7c52)
- chore(blockchain-link): update proxyAgent to new socks-proxy-agent (e54f8d736e)
- chore: update socks-proxy-agent from 6.1.1 to 8.0.4 (2d3edbcc89)
- npm-prerelease: @trezor/blockchain-link 2.3.2-beta.1 (679a6dbc86)
- chore: update backends for bsc and op (458f0fe3d9)
- feat(suite): add Optimism (f98f57023f)
- fix(blockchain-link): do not fetch solana token account signatures for recipient address (171c7d6a20)
- feat(blockchain-link): add user agent to Solana requests from desktop (2109d004e2)
- feat(blockchain-link): add user agent to Cardano requests from desktop (8ec6f008bd)
- feat(blockchain-link): user agent with Suite version when req Blockbook (9f61f179a4)
- feat: change matic to pol symbol in the codebase (66427afab4)

# 2.3.1

- npm-prerelease: @trezor/blockchain-link 2.3.1-beta.1 (a77b9e96f7)
- chore(blockchain-link): replace deprecated Solana api call (c1ed11bd4c)
- chore(deps): update @types/bytebuffer @types/sharedworker @types/web (a9eaedc0a7)
- fix(blockchain-link): unify SOL connection logic (55dd2790a1)
- chore(deps): bump webpack from 5.93.0 to 5.94.0 (358b96d708)
- chore(deps): update @types/chrome; @types/web; @types/sharedworker (8e73aeb59b)

# 2.3.0

- npm-prerelease: @trezor/blockchain-link 2.2.1-beta.3 (9a0896e229)
- feat(solana): validate send amount against rent (9f1f76b994)
- npm-prerelease: @trezor/blockchain-link 2.2.1-beta.2 (ff5875c801)
- chore: update ws from 8.17.1 to 8.18.0 (f4f1aa5d6e)
- chore: update webpack-dev-server from 4.15.1 to 5.0.4 (cf90006585)
- chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
- npm-prerelease: @trezor/blockchain-link 2.2.1-beta.1 (3b74de9765)
- chore: update trends libs (70b9c112bf)

# 2.1.31-beta.2

- chore(deps): bump ws from 8.16.0 to 8.17.1 (bc5b787f3e)

# 2.1.31-beta.1

- chore(utils): move Throttler util from blockchain-link to utils (78673bd14c)

# 2.1.30

- chore: BigNumber wrapper (d18ba9a879)

# 2.1.30-beta.2

- Chore/refactor fiat rates (#11592) (f40b8bf7d8)

# 2.1.29

- chore(blockchain-link): skip failing tests (34833c4751)
- chore(blockhain-link): beta release 2.1.29-beta.0 (bf3589acc1)
- fix(blockchain-link): cache SOL token metadata (385010151a)
- chore(deps): bump @solana/web3.js from 1.90.0 to 1.90.2 (962e51f4ca)
- feat(blockchain-link): resubmit Solana transactions during confirmation (babb748eca)
- fix(blockchain-link): close blockchain link connection on error (3bf8732140)

# 2.1.28

- fix(blockchain-link): fix Solana transaction confirmation (38cd7ccdb6)
- feat(blockchain-link): add support for Solana priority fees (a6c2aa8c7d)
- fix(blockchain-link): hanging connection issue (#11516) (6cb0d99c03)
- fix: wait on solana confirmed tx (#11515) (3cb139fbd3)
- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 2.1.26

- fix: from g:tsx to local tsx in prepublish script (d21d698b2)
- chore(suite): replace `selectCoinsLegacy` by fiat rates selectors (4e3ce7367)
- chore(suite): autofix newlines (c82455e74)
- chore(utils): remove build step requirement from @trezor/utils (#11176) (6cd3d3c81)
- chore(blockchain-link): remove unused error event (4c1b8df7d)
- refactor(blockchain-link): use `createDeferredManager` (037ecfe68)
- Fix: add missing keys that eslint was complaining about (#11167) (824c8b18b)
- chore(repo): ESLint refactor + speed up 70% (#11143) (44fa12a79)
- chore: update css-loader and remove it from resolutions (953de853e)
- chore: update various dependencies (no major update) (fecd89f6e)
- chore: use global tsx (c21d81f66)
- chore: update typescript and use global tsc (84bc9b8bd)
- chore: use global rimraf (5a6759eff)
- chore: update prettier (00fe229e0)
- chore: use global jest (a7e68797d)
- chore: upgrade jest to 29.7.0 (3c656dc0b)
- chore: upgrade jest (004938e24)
- chore: update root dependencies (fac6d99ec)

# 2.1.25

- feat(suite): Rename Polygon to Polygon PoS (15a7fd38dc)
- feat(suite): add Polygon (8c569ca580)
- Revert feat(blockchain-link); get sol token metadata from coingecko (61cf93cd62)

# 2.1.23

- feat(blockchain-link); get sol token metadata from coingecko (5c901ea8f)

# 2.1.22

- fix(suite): subscribe to Solana token accounts as well (b2f85ac9e)
- fix(suite): re-enable Solana account subscriptions (still without token accounts support) (e05f8c9ed)
- fix(suite): fix subscription return values (149903f8e)
- fix(blockchain-link): no throw from ws.close (7e6e79b1c)
- chore: bump `ws` to 8.16.0 (bd1e5ec81)

# 2.1.21

- fix(blockchain-link): fix solana txs when sending to associated token account (5cb682078)
- feat(electrum): support non-batching servers (e06b9375a)
- test(blockchain-link): remove `TypedRawTransaction` (d3354fdf2)
- feat(blockchain-link): remove `TypedRawTransaction` (34d405d12)
- feat(blockchain-link): add `getTransactionHex` method (cbca5dbfd)
- refactor(blockchain-link): adjust `transformTransaction` params (2d669d72e)
- chore(blockchain-link): remove ADA `null` subtype (07161b141)
- test(blockchain-link): smaller timeouts (cd83adc61)
- test(blockchain-link): fix error testing (7995e957e)

# 2.1.20

- chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
- chore(blockchain-link): use extended top-level tsconfig (d17da1f35)
- chore: update `jest` and related dependency (b8a321c83)
- fix(blockchain-link): use timeout field of RippleApi.APIOptions (eafa4f308)
- chore(blockchain-link): use default imports from commonjs dependencies (9a81b0459)
- chore: Throttler throttling instead of debouncing in `@trezor/blockchain-link` (#10288) (f7ff0cf9f)
- fix(blockchain-link): consider only unique solana signatures when paginating (e00cf70ac)
- chore(repo): update tsx (53de3e3a8)
- feat(suite): add Solana support (f2a89b34f)

# 2.1.19

- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
- fix(blockchain-link): PR review fixes (08d84dfe6)
- chore(suite): update lockfile (761aea82b)
- feat(blockchain-link): Solana tx history (9dff5e509)
- feat(blockchain-link): Solana pushTx (e63813bb6)
- feat(blockchain-link): Solana tokens (9adc115ce)
- feat(blockchain-link): Solana getAccountInfo (248913743)
- feat(blockchain-link): Solana estimateFee (34a2f28a0)
- feat(blockchain-link): Solana worker setup (662bc092a)
- feat(blockchain-link): Solana ui config (98407f35a)
- chore(tests): cleanup jets configs (#9869) (7b68bab05)
- feat(deps): update deps without breaking changes (7e0584c51)
- chore: update prettier to v3 and reformat (4229fd483)
- chore(connect): bl workers dynamic import (74fd08389)
- chore(build): update deps related to suite app build (6ab9e6322)
- chore(desktop): update deps related to desktop packages (af412cfb5)
- fix(blockchain-link): multiple workers initialization (#9766) (3208ea280)

# 2.1.17

- feat(blockchain-link): add block filter methods (66606afc6)
- chore: adjust/unify createDeferred usage (4d724a451)

# 2.1.16

- feat(blockchain-link): ipv6 electrum support (1d4b5471c)
- fix(blockchain-link): WsWrapper default export (0c5297e56)
- feat(blockchain-link): return tx hex in blockbook transactions (6aba6f094)
- feat(blockchain-link): add baseWebsocket options (951bd3e29)

# 2.1.14

- fix(coinjoin): pending ws message closing recovery (0171cf3ef)
- chore(deps): update (a21a081ba)
- chore(blockchain-link): remove ts-loader from blockchain-link (3b117830a)
- fix(blockchain-link): browser and native Websocket error message (e160101f5)
- fix(blockchain-link): handle Websocket ping rejection (b9940b6e9)
- chore(blockchain-link): define missing extraneous dependencies (83230e063)

# 2.1.12

- 5711aa998 feat(blockchain-link): add getMempoolFilters method
- 819c019d1 chore: use workspace:\* everywhere
- 3e072b11f chore(blockchain-link): use `@trezor/e2e-utils` in tests

# 2.1.11

- chore(blockchain-link): fix ripple blocktime

# 2.1.10

- fix: remove workspace: from dependencies

# 2.1.9

- feat: add `token` param to to `GetCurrentFiatRates`, `GetFiatRatesForTimestamps` and `GetFiatRatesTickersList` methods
- chore: parts of this packages split into @trezor/blockchain-link-types and @trezor/blockchain-link-utils
- chore: token.address to token.contract, ethereum improvements
- feat: add token param to blockbook fiat methods

# 2.1.8

- fix(suite-native): cardano websocket (#7722)
- feat(blockchain-link): add getBlock method
- feat(blockchain-link): add mempool subscription

# 2.1.7

- feat: cardano preview testnet

# 2.1.6

- deps: updated typescript to 4.9
- fix: order of txs in the same block

# 2.1.5

- added Transaction.feeRate
- use Transaction.size provided by Blockbook instead of computing it from hex if available
- Electrum: fixed `joint` transaction handling

# 2.1.4

- add missing ADA types
- added `joint` transaction type to Transaction interface.
- added `isAccountOwned` field to `tx.details.vin`/`tx.details.vout`
- removed `totalSpent` field from Transaction interface

# 2.1.3

### changes

- revert part of backend selection refactoring (298e56ca992508ba0d5e1c0586d60d7a232eaa6a)

# 2.1.2

#### changes

- throttling of block events (#5093)
- backend selection refactoring (#5047)
- set proxyAgent protocol to satisfy sentry wrapper (#5033)
- Blockfrost: add withdrawal and deposits amounts to transaction

# 2.1.1

#### changes

- Proxy agent in Ripple worker is set based on `RippleAPI._ALLOW_AGENT` flag, in order not to fail in standalone `trezor-connect` implementation (#4942)

# 2.1.0

#### changes

- Added `proxy` param allowing workers to initialize SocksProxyAgent and use it for proxying communication
- Added support for `Electrum` backend
- Using common utilities from new `@trezor/utils` package
- Updated dependencies

# 2.0.0

#### changes

- Refactored architecture of workers. They may now be used as commonjs module in main context or in WebWorker context like before.
- Updated library build targets to es2017 reducing polyfills from typescript transpilation.
- Removed `build` directory from npm registry.
- Updated dependencies.

# 1.1.0

#### changes

- lower default XRP reserve
- set XRP reserve after `getInfo` call (get server info)
- added support for `Cardano` using `Blockfrost` backend
- fix blockbook transaction target when tx is sent to change address
- fix blockbook (ETH) transaction target when swapping ETH <> ERC20

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

- Added `details` to `Transaction` object (vin, vout, size)
- Fixed types in `BlockchainLink` event listeners
- Move "workersDepenedecies" to regular "dependencies" in package.json
- Update dependencies

# 1.0.14

#### changes

- Update dependencies

# 1.0.13

#### changes

- Add `AccountTransaction.target.n` (output index) field
- Fix `build/node/ripple-worker` (webpack configuration)
- Update dependencies

# 1.0.12

#### changes

- Update dependencies

# 1.0.11

#### changes

- Fixed `recv` transaction targets

# 1.0.10

#### changes

- Better clearing of `undefined` fields inside nested objects in `Response`
- Added `misc.erc20Contract` field to getAccountInfo response (fetching info about ERC20 smart contract)

# 1.0.9

#### changes

- Added new Blockbook methods for fiat rates (`getAccountBalanceHistory`, `getCurrentFiatRates`, `getFiatRatesForTimestamps`, `getFiatRatesTickersList`)

# 1.0.8

#### changes

- Fix: Ripple notification dispatched for both, sender and receiver

# 1.0.7

#### changes

- Update outdated node_modules
- Ripple worker: different reconnection schema since RippleApi@1.6.3
- Ripple worker: fixed bug with `minLedgerVersion` since RippleApi@1.6.3

# 1.0.6

#### changes

- Fix for react-native workers
- Update outdated node_modules

# 1.0.5

#### changes

- Fixed Ripple-lib transaction event transformation (missing ledger_index field in transaction object)

# 1.0.4

#### changes

- Update dependencies (ripple-lib@1.4.0) and fix reconnection issue
- Update types for ERC20 tokens

# 1.0.3

#### changes

- Add currently connected url to 'getInfo' response
- Fixed getAccountInfo 'blockbook' type: empty = (transactions === 0 && unconfirmedTransactions === 0)

# 1.0.2

#### changes

- Fixed getTransaction response

# 1.0.1

#### changes

- Fixed amount calculation in blockbook Transactions

# 1.0.0-rc3

#### changes

- Added possibility to export workers as a main thread module (using webpack build)
- ./src/workers/common.ts changed to class for multiple instance usage

# 1.0.0-rc1

- First release
