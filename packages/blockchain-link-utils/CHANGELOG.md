# 10.0.1

- fix(blockchain-link): treat cardano deregistration with rewards as unstake (53565832f6)
- fix(blockchain-link): correct cardano withdrawal amount on stake deregistration (c9056f0b26)

# 10.0.0

- npm-prerelease: @trezor/blockchain-link-utils 10.0.0-beta.3 (afced14fa3)
- npm-prerelease: @trezor/blockchain-link-utils 10.0.0-beta.2 (f2a4c43454)
- fix(blockchain-link): classify solana program interactions as sent or recv (1ed317e2b8)
- fix(blockchain-link): show solana balance changes from contract transactions (10db1ad073)
- feat(suite-core): improve displaying of spent gas for L2 networks (ea3cfd9262)
- fix(stellar): handle fee-bump transactions in account history (3cc14702bc)
- fix(packages): add missing repository field to published packages (fa0cff0ddd)
- chore(connect): bump version to 10.0.0-beta.1 (aaac2abdea)
- test(blockchain-link-utils): preserve fixtures (4c90d37f97)
- test(blockchain-link-utils): co-locate tests (05b1ea6e00)
- feat(networks): add @trezor/network-tron package with shared TRON constants (6e71f2ec7d)
- refactor(networks): centralize more chain constants in network packages (6ea67d3809)
- refactor(networks): centralize constants in network packages (77d7adc77a)
- chore(networks): rename sdk packages (18fa2fa279)
- chore(networks): adjust relative paths (b0af094307)
- chore(networks): rename coins-xrpl to coins-ripple (080a06af77)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- feat(suite): report tron staking tx ids before broadcast (74aeaaa24b)
- feat(wallet-core): resolve EVM nonce from local txs and blockbook confirmedNonce (65cd4e6a28)
- chore: refined unknown btc tx diagnostics (f81e4bac63)
- feat(blockchain-link): evm specific data for gas (f5ae99c78b)
- feat(blockchain-link): classify tron staking transactions in history (09f2666eca)
- chore: update more solana types due SDK update (2e94364b01)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- fix(blockchain-link): default token decimals to 18 when missing (ec8a2444b9)
- chore(xrpl): remove unused deps (abe28a77db)
- chore(xrpl): use code from @trezor/coins-xrpl (2042397735)
- chore(xrpl): add @trezor/coins-xrpl deps (60e9ef3f66)
- chore(stellar): remove unused deps (8cf3fe95f6)
- chore(stellar): remove old utils (71c48f05a4)
- chore(stellar): use code from @trezor/coins-stellar (ce324b1f0a)
- chore(stellar): add @trezor/coins-stellar deps (d218a24716)
- chore(wallet): add diagnostic logs for unknown BTC pending tx (f163bcfb36)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- fix: resolve noUncheckedIndexedAccess errors across the codebase (e0d8a3bd20)
- refactor: adopt filter predicates (isNotNull, isNotNullOrUndefined, isNotUndefined) from @trezor/utils (bc72363c9b)
- chore(jest): wire JestCustomEnv into all node-env packages (775a942d1f)
- chore(connect): drop redundant publishConfig.type in ESM packages (af2b73c765)
- refactor: replace .some(x => x === y) with .includes(y) (1c8ecd2081)
- refactor(solana): reorder imports (ccb3cfa3f1)
- refactor(solana): rename to @trezor/coins-solana (cf46b52fd1)
- chore(solana): remove unused deps (36b24a79c1)
- chore(solana): remove old utils (1f99803fa6)
- chore(solana): remove old type definitions (f15987e1ce)
- chore(solana): use utils from @connect-coins/solana (310700efae)
- chore(solana): use types and constants from @connect-coins/solana (016ce57eb8)
- chore(solana): add @connect-coins/solana deps (810c89861f)
- chore: tsconfig formatting (8c60ca008d)
- chore(connect): support top-level module type in ESM packages (9aebe9cfb0)
- feat(blockchain-link-utils): add computeSorobanAssetContractId to compute the SAC contract address. (80365de777)
- feat(connect): drop CommonJS output across connect ecosystem (b99609bfb8)
- refactor: replace indexOf comparisons with Array.includes (99cca423fe)
- refactor(solana): fix nits (afd168ad71)
- feat(solana): show memo in tx detail and sign modals (fd84db30d6)
- chore(tests): migrate web packages to @swc/jest (15192f30ee)
- chore: make all blockchain-link-types import direct, no imports (d073ff12e6)
- chore: unify package.json publishConfig (216e6de7cc)
- feat(suite-common): add Tron walletconnect adapter (a62cc97243)
- feat(suite): display tron energy and bandwidth usage in transaction detail (8cd5c969f7)
- feat(suite): add contract address warning for tron send (f39b0b102a)
- fix(blockchain-link-utils): add base58check checksum verification to tron address decoding (06feca8d5f)
- feat(suite-common): implement tron TRC-20 compose and sign thunks (c1eaa83ccc)
- feat(connect): add tronComposeTransaction API and protobuf encoding (68bc2f585c)
- chore(blockchain-link-utils): remove ts-belt dependency (1973521ac4)
- chore(blockchain-link-types): add tron types (ad7b0ec6dd)
- chore(blockchain-link): import direction cleanup, backend specific imports from common, not other way round (e676e2fdd6)
- refactor: replace custom eslint script with nx one (ad87eac457)
- chore: add type keyword to all types in imports and exports (47c184a859)
- feat(connect): add .mjs to ESM build (d1bd996295)
- chore: bump xrpl (566505be9e)
- chore: remove unused `prepublishOnly` script (0056cb62fa)
- fix: Updated unit tests jest configs (6138839e45)
- fix(suite): revert publishable npm packages paths (d71e46eb17)
- chore(suite): bignumber imports, trezor/utils (c40f6ded6b)
- chore: bump xrpl (75aaca51f3)
- chore: bump @stellar/stellar-sdk (7c50951a5f)
- feat(blockchain-link): change stake type (7eede71ad0)
- chore: bump tsx version (98321960e2)
- npm-prerelease: set all @trezor/connect dependencies to 10.0.0-alpha.1 (ab01b2d889)
- chore(npm): remove prepublish.js (7559f035c3)
- feat(scripts): handle libESM in updateProjectReferences (3d71f2c20a)
- build(repository): Connect publishing ESM (a9e189b9a3)
- chore(blockchain-link-utils): do not shorten token symbols in fixtures (5ca84eccf7)
- chore(blockchain-link): remove symbol shortening (7d662d1a4a)
- feat(suite): do not uppercase erc token symbols (e45c09d3da)
- chore(npm): start publishing source maps (36f6e9692d)

# 1.5.1

- npm-prerelease: @trezor/blockchain-link-utils 1.5.1-beta.1 (2662cd1ed3)

# 1.5.0

- chore(blockchain-link-utils): remove dependency to protobuf (2f3d880b50)
- npm-prerelease: @trezor/blockchain-link-utils 1.5.0-beta.2 (57de3cac26)
- refactor(connect): new replace-imports.sh script using babel (2128d273f3)
- chore(blockchain-link-types): remove TokenInfo.type (11ae574860)
- fix(blockchain-link-utils): properly type TokenInfo standard (35c52365fe)
- npm-prerelease: @trezor/blockchain-link-utils 1.5.0-beta.1 (8a7a4dcad3)
- chore: change fail in test names to error to find fails easier (2393763310)
- feat(blockchain-link-utils): Add support for change trust operations in transaction processing (3ab9ae7e76)
- feat(blockchain-link-utils): add asset code and address validation functions (64d2ebe5d5)
- chore: bump xrpl (70df85521c)
- npm-prerelease: @trezor/blockchain-link-utils 1.4.5-beta.1 (a5a25d31c4)
- refactor(blockchain-link-utils): switch Stellar transaction builders to params objects (4344c8f4f1)
- feat(blockchain-link): refactor base reserve handling and add trustline transaction builders (2b32cef13c)

# 1.4.4

- npm-prerelease: @trezor/blockchain-link-utils 1.4.4-beta.1 (4d1585e947)

# 1.4.3

- fix: add TON of missing dependecies in package.json (7027213e3f)
- npm-prerelease: @trezor/blockchain-link-utils 1.4.3-beta.1 (664db5fb37)
- fix(blockchain-link-utils): filter pending txs with same nonce as mined (69303fdc6d)
- fix(blockchain-link-utils): do not use pending EVM balance (07f9a2a5a8)
- fix: cardano deregister stake deposit (24c4b68434)
- fix(blockchain-link): Use `stellar.advanced.coin.definitions.v1.json` instead of `stellar.advanced.coin.definitions.v1.jws (93431531c0)
- fix(blockchain-link): fix circular dependency in Stellar utils. (a7d6c46d8c)
- feat(blockchain-link): add Stellar token metadata handling. (56e7e07e08)
- chore(suite): bump trends deps (4eb03b8e23)
- chore: update @solana/kit (d681087f42)

# 1.4.2

- npm-prerelease: @trezor/blockchain-link-utils 1.4.2-beta.2 (728da7ab21)
- npm-prerelease: @trezor/blockchain-link-utils 1.4.2-beta.1 (3109f127e0)

# 1.4.1

- npm-prerelease: @trezor/blockchain-link-utils 1.4.1-beta.1 (ffe79aba3c)
- chore: update trends deps (a9f09975f2)
- chore(blockchain-link-utils): add block height to solana txs (196d993caf)

# 1.4.0

- npm-prerelease: @trezor/blockchain-link-utils 1.4.0-beta.1 (a8c0bd5e29)
- fix(blockchain-link): display fee on the Stellar tx list page. (d155f356d6)
- feat(blockchain-link): Add support for Stellar testnet. (2509e54ab4)
- chore: update solana libs (f58d9b6e44)
- feat(blockchain-link): Add basic support for Stellar. (48b5ca0b38)

# 1.3.5

- npm-prerelease: @trezor/blockchain-link-utils 1.3.5-beta.1 (c55a427303)
- chore: apply latest prettier (eb758acea9)
- chore(blockchain-link): update xrpl.js to 4.2.5 due to security issues in previous compromised versions (f49497d046)

# 1.3.4

- npm-prerelease: @trezor/blockchain-link-utils 1.3.4-beta.1 (94c6c8d06c)
- feat(blockchain-link): migrate ripple-lib to xrpl.js (422c175f4f)
- chore(blockchain-link): move solana types (b3dfcb0de0)

# 1.3.3

- npm-prerelease: @trezor/blockchain-link-utils 1.3.3-beta.1 (e84ac565b8)

# 1.3.2

- npm-prerelease: @trezor/blockchain-link-utils 1.3.2-beta.2 (9e84c16e80)
- fix(blockchain-link-utils): ignore incomplete type in unit test (b82c1b36ec)
- npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)

# 1.3.1

- npm-prerelease: @trezor/blockchain-link-utils 1.3.1-beta.1 (8f776478e3)
- fix(repo): fix generate package script (#17300) (a13f269b99)

# 1.3.0

- feat(blockchain-link): add support for Solana v2 staking (f12b0240c8)
- npm-prerelease: @trezor/blockchain-link-utils 1.3.0-beta.1 (e9235027ca)
- chore(suite): fix tests (b646159ec2)
- chore(suite): sync types with blockbook (8e843a36d7)
- chore: update solana and everstake deps (cf806ff3d0)
- npm-prerelease: @trezor/blockchain-link-utils 1.2.7-beta.1 (86cb20a5a2)
- chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
- fix(blockchain-link): change success status in failed transactions with missing destination tag (dd6d496fd3)
- feat(suite): add Destination tag into TxDetail (c46de7a9c3)
- fix(solana): whitelist Serum's Asset Owner program (e6af2c1471)
- feat(solana): more generic transaction parsing (89bc5a54fd)
- feat(blockchain-link): support solana stake types and calculate amounts (b10e27ed77)
- Revert chore(suite): remove unused types in token (f588fa36a7)
- chore: enable ESLint rule for as-needed | auto-fix (64fcbde4bd)
- feat(blockchain-link): add Solana epoch info call and upgrade SDK (2a8262578d)
- feat(connect): add support of L2 ETH networks (26ff8eada4)
- chore(suite): remove unused types in token (efed0f9922)
- fix(blockchain-link): add stakingAccounts property to AccountInfo interface (e2e907090f)
- feat(solana): add support for Token-2022 tokens (9abc7d93dd)

# 1.2.5

- npm-prerelease: @trezor/blockchain-link-utils 1.2.5-beta.1 (6af3be92af)

# 1.2.3

- npm-prerelease: @trezor/blockchain-link-utils 1.2.3-beta.1 (0b0670f5ea)
- fix(blockchain-link-utils): solana with negative tx amount (2af67c50f9)

# 1.2.2

- npm-prerelease: @trezor/blockchain-link-utils 1.2.2-beta.2 (225a260c34)
- chore: update solana lib (76519c7c16)
- npm-prerelease: @trezor/blockchain-link-utils 1.2.2-beta.1 (54ab781bf9)
- fix(blockchain-link-utils): fix solana self txs info in history (f53d31e47f)

# 1.2.1

- npm-prerelease: @trezor/blockchain-link-utils 1.2.1-beta.1 (58d60c48c7)

# 1.2.0

- npm-prerelease: @trezor/blockchain-link-utils 1.1.1-beta.3 (20a2fe6372)
- feat(staking): instant staking/unstaking success (6f42f9f86b)
- npm-prerelease: @trezor/blockchain-link-utils 1.1.1-beta.2 (a4ebac3e6f)
- chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
- npm-prerelease: @trezor/blockchain-link-utils 1.1.1-beta.1 (bc36f6ecfa)
- chore: update trends libs (70b9c112bf)
- chore(blockchain-link): cardano using unit as contract address again (0e58ab32b3)

# 1.0.19-beta.1

- fix(blockchain-link): omit solana foreign tx effects (80836ddb90)
- chore(suite): depcheck enabled (2206f19f2e)

# 1.0.18

- chore: BigNumber wrapper (d18ba9a879)

# 1.0.18-beta.1

- fix: unify solana and cardano missing symbol name length (2698f935aa)
- fix(blockchain-link-utils): fix solana token definitions url (5b29898216)

# 1.0.17

- feat(blockchain-link-utils): solana using data.trezor.io token metadata (9bd73e9d36)
- fix(blockchain-link): cache SOL token metadata (385010151a)
- chore(deps): bump @solana/web3.js from 1.90.0 to 1.90.2 (962e51f4ca)

# 1.0.16

- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.0.15

- fix: from g:tsx to local tsx in prepublish script (d21d698b2)
- feat(eth-staking): add unstake pending state, pool stats, stake data from blockbook (27e463e04)
- fix(suite): `fromWei` and `toWei`check errors (#11266) (99bb3324d)
- chore(suite): autofix newlines (c82455e74)
- chore: update various dependencies (no major update) (fecd89f6e)
- chore: use global tsx (c21d81f66)
- chore: update typescript and use global tsc (84bc9b8bd)
- chore: use global rimraf (5a6759eff)
- chore: use global jest (a7e68797d)
- chore: upgrade jest to 29.7.0 (3c656dc0b)
- chore: upgrade jest (004938e24)
- chore: update root dependencies (fac6d99ec)

# 1.0.14

- Revert feat(blockchain-link); get sol token metadata from coingecko (61cf93cd62)

# 1.0.13

- feat(blockchain-link); get sol token metadata from coingecko (5c901ea8f)

# 1.0.12

- fix(blockchain-link-utils): support `multisigAuthority` in solana txs (dfd96d23b)
- fix(blockchain-link-utils): use `some` instead of `find` in solana tx type predcicates (1d58f980d)
- fix(blockchain-link-utils): parse solana transfers originating from exchanges (58b125fb2)
- fix(blockchain-link): correct import in solana using @trezor/ prefix (3a4895d6b)

# 1.0.11

- fix(blockchain-link): gasPrice null fallback (34d612a06)
- fix(blockchain-link): fix solana txs when sending to associated token account (5cb682078)
- feat(blockchain-link-utils): add meta for solana BONK token (c8e1762ed)
- fix(blockchain-link): filter out non-spl tokens (de631248e)
- feat(blockchain-link): remove `TypedRawTransaction` (34d405d12)
- refactor(blockchain-link-utils): improve `transformTransaction` params (a28a90142)
- chore(blockchain-link): remove ADA `null` subtype (07161b141)

# 1.0.10

- fix(blockchain-link): add solana vout for self txs (ab6f0acf0)
- chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
- chore(repo): update tsx (53de3e3a8)
- feat(suite): add Solana support (f2a89b34f)

# 1.0.9

- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
- chore(jest): update jest in packages without issues (7458ab20f)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
- fix(blockchain-link): PR review fixes (08d84dfe6)
- feat(blockchain-link): Solana tx history (9dff5e509)
- feat(blockchain-link): Solana tokens (9adc115ce)
- feat(deps): update deps without breaking changes (7e0584c51)
- chore(desktop): update deps related to desktop packages (af412cfb5)

# 1.0.7

- chore: replace deprecated String.subst with Sting.substing (57f45d4cd)
- chore: replace deprecated Buffer.slice with Buffer.subarray (814caeaa9)

# 1.0.6

- feat(blockchain-link): return tx hex in blockbook transactions (6aba6f094)

# 1.0.5

- fix(blockchain-link): use tx `rbf` flag from backend (c5f7a5033)

# 1.0.4

- chore(blockchain-link): add addrTxCount (2d6e12535)
- feat: update deps in root package.json (5806d41bc)

# 1.0.3

- 819c019d1 chore: use workspace:\* everywhere

# 1.0.2

- chore(blockchain-link): fix ripple blocktime

# 1.0.1

- fix: remove workspace: from dependencies

# 1.0.0

- package created
