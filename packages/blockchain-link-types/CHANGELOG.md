# 1.4.2

- npm-prerelease: @trezor/blockchain-link-types 1.4.2-beta.3 (2e111bc027)
- fix: BaseCurrency moved to Blockchain-link (f2ef89b758)
- npm-prerelease: @trezor/blockchain-link-types 1.4.2-beta.2 (730c207698)
- fix: types for FiatRatesBySymbol, add typedObjectFromEntries util (61e33e5410)
- npm-prerelease: @trezor/blockchain-link-types 1.4.2-beta.1 (570d0a4967)

# 1.4.1

- npm-prerelease: @trezor/blockchain-link-types 1.4.1-beta.1 (3de1dddc3f)

# 1.4.0

- npm-prerelease: @trezor/blockchain-link-types 1.4.0-beta.1 (1009fe288d)
- fix(blockchain-link): display fee on the Stellar tx list page. (d155f356d6)
- feat(blockchain-link): Add basic support for Stellar. (48b5ca0b38)

# 1.3.5

- npm-prerelease: @trezor/blockchain-link-types 1.3.5-beta.2 (003b282c48)
- fix(connect): add @trezor/type-utils to dependencies (4dbd53281b)
- npm-prerelease: @trezor/blockchain-link-types 1.3.5-beta.1 (9f72b0f8e7)
- chore: apply latest prettier (eb758acea9)

# 1.3.4

- npm-prerelease: @trezor/blockchain-link-types 1.3.4-beta.1 (fa0a4d511d)
- feat(blockchain-link): migrate wallet-sdk-solana staking accounts (995ed63410)
- feat(blockchain-link): migrate ripple-lib to xrpl.js (422c175f4f)
- chore(blockchain-link): update blockbook-api types (5ca901a0e3)
- chore(blockchain-link): move solana types (b3dfcb0de0)

# 1.3.3

- npm-prerelease: @trezor/blockchain-link-types 1.3.3-beta.1 (577577afd4)

# 1.3.2

- npm-prerelease: @trezor/blockchain-link-types 1.3.2-beta.2 (4234d28ca6)
- chore: replace `@solana/web3.js` with `@solana/kit` (6356bafe6d)
- npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)

# 1.3.1

- npm-prerelease: @trezor/blockchain-link-types 1.3.1-beta.1 (183dc685f7)
- feat(blockchain-link-type): change bigint to string in persist (3ecc87c3a5)
- feat(fee): logic for rent fee calculation (2650f6b510)
- fix(repo): fix generate package script (#17300) (a13f269b99)

# 1.3.0

- refactor(connect): separate bitcoin and misc fee levels (73ba107ee4)
- feat(blockchain-link): add support for Solana v2 staking (f12b0240c8)
- npm-prerelease: @trezor/blockchain-link-types 1.3.0-beta.1 (ae9fbcf120)
- chore(suite): sync types with blockbook (8e843a36d7)
- chore: update solana and everstake deps (cf806ff3d0)
- npm-prerelease: @trezor/blockchain-link-types 1.2.6-beta.1 (6e5413cfec)
- chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
- feat(suite): add Destination tag into TxDetail (c46de7a9c3)
- feat(blockchain-link): support solana stake types and calculate amounts (b10e27ed77)
- fix(blockchain-link): CustomError with message passed as code (5285872b3f)
- fix: make types strict to prevent accidental deletion via unused types, the optionality is a trap, they are required (184ebbb7f4)
- Revert chore(suite): remove unused types in token (f588fa36a7)
- chore(blockchain-link-types): extend token standard type by bep (44358cbc8c)
- feat(blockchain-link): add Solana epoch info call and upgrade SDK (2a8262578d)
- feat(blockchain-link-types): update blockfrost staking types (d27b94b2e3)
- feat(connect): add support of L2 ETH networks (26ff8eada4)
- chore(suite): remove unused types in token (efed0f9922)
- feat(suite): expand TokenInfo type to work with NFT (6c7b1ab731)
- fix(blockchain-link): add stakingAccounts property to AccountInfo interface (e2e907090f)
- feat(solana): add support for Token-2022 tokens (9abc7d93dd)

# 1.2.4

- npm-prerelease: @trezor/blockchain-link-types 1.2.4-beta.1 (32d2ef7bab)
- chore(blockchain-link): solana optimized getAccountInfo (88b9c6de14)
- chore: Update the Solana types in `@trezor/blockchain-link-types` (d8fe398c07)
- chore: Update `@solana/web3.js` to 2.0.0 (f1eac69733)

# 1.2.3

- npm-prerelease: @trezor/blockchain-link-types 1.2.3-beta.1 (d7636062ed)

# 1.2.2

- npm-prerelease: @trezor/blockchain-link-types 1.2.2-beta.2 (33407a3dcf)
- chore: update solana lib (76519c7c16)
- feat(blockchain-link): implement ethereum rpc call (2732533db8)
- chore(blockchain-link-types): remove socks-proxy-agent dependency (327ed789cf)
- chore(blockchain-link-types): keep legacy type SocksProxyAgentOptions (4a4d439aab)
- chore: update socks-proxy-agent from 6.1.1 to 8.0.4 (2d3edbcc89)
- npm-prerelease: @trezor/blockchain-link-types 1.2.2-beta.1 (552d5487f3)
- feat(suite-common): add pol and bnb to graph (013c786250)
- chore(blockchain-link): Update Blockbook types (06d54d6aa9)

# 1.2.1

- chore: remove prettier-eslint dependency, upgrade @typescript-eslint (77576f5bea)

# 1.2.0

- npm-prerelease: @trezor/blockchain-link-types 1.1.1-beta.3 (2be3a59462)
- chore(suite): get rid of NETWORKS reexport (02bd51829a)
- feat(solana): validate send amount against rent (9f1f76b994)
- feat(staking): instant staking/unstaking success (6f42f9f86b)
- npm-prerelease: @trezor/blockchain-link-types 1.1.1-beta.2 (67e3933906)
- chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
- npm-prerelease: @trezor/blockchain-link-types 1.1.1-beta.1 (83c91308b5)
- fix(suite): transaction search with token name, symbol or contract (#13410) (986032c736)
- chore: update trends libs (70b9c112bf)
- chore(blockchain-link): cardano using unit as contract address again (0e58ab32b3)

# 1.0.18-beta.2

- chore(suite): unused package dependencies removed (f7907e1496)
- chore(suite): depcheck enabled (2206f19f2e)

# 1.0.18-beta.1

- refactor(suite): signed transaction data stored in redux send form state (2ea31ab5d6)

# 1.0.17-beta.2

- Chore/refactor fiat rates (#11592) (f40b8bf7d8)

# 1.0.16

- chore(deps): bump @solana/web3.js from 1.90.0 to 1.90.2 (962e51f4ca)
- refactor(connect): optional token symbol (#10762) (47a7de17c6)

# 1.0.15

- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.0.14

- fix: from g:tsx to local tsx in prepublish script (d21d698b2)
- feat(eth-staking): add unstake pending state, pool stats, stake data from blockbook (27e463e04)
- fix(suite): `fromWei` and `toWei`check errors (#11266) (99bb3324d)
- chore(suite): replace `selectCoinsLegacy` by fiat rates selectors (4e3ce7367)
- chore(blockchain-link): remove unused error event (4c1b8df7d)
- chore: update various dependencies (no major update) (fecd89f6e)
- chore: use global tsx (c21d81f66)
- chore: update typescript and use global tsc (84bc9b8bd)
- chore: use global rimraf (5a6759eff)
- chore: update root dependencies (fac6d99ec)

# 1.0.12

- feat(suite-native): modals renderer (#10801) (a9b4d1e8fe)
- chore(blockchain-link-types): move deps from dev to dependencies (b77caf9715)

# 1.0.11

- fix(suite): subscribe to Solana token accounts as well (b2f85ac9e)
- chore(blokchain-link-types): import type from @trezor/type-utils (a2087ebf7)

# 1.0.10

- fix(blockchain-link): fix solana txs when sending to associated token account (5cb682078)
- feat(blockchain-link): remove `TypedRawTransaction` (34d405d12)
- feat(blockchain-link): add `getTransactionHex` method (cbca5dbfd)
- chore(blockchain-link): remove ADA `null` subtype (07161b141)
- fix(blockchain-link-types): ADA getTransaction type (02e6194ef)

# 1.0.9

- chore(repo): update tsx (53de3e3a8)
- feat(suite): add Solana support (f2a89b34f)

# 1.0.8

- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
- chore(suite): update lockfile (761aea82b)
- feat(blockchain-link): Solana tx history (9dff5e509)
- feat(blockchain-link): Solana tokens (9adc115ce)
- feat(blockchain-link): Solana getAccountInfo (248913743)
- feat(blockchain-link): Solana estimateFee (34a2f28a0)
- feat(blockchain-link): Solana worker setup (662bc092a)
- feat(deps): update deps without breaking changes (7e0584c51)
- chore(desktop): update deps related to desktop packages (af412cfb5)

# 1.0.6

- feat(blockchain-link-types): add block filters (78dd71d4c)
- chore: replace deprecated String.subst with Sting.substing (57f45d4cd)

# 1.0.5

- feat(blockchain-link): return tx hex in blockbook transactions (6aba6f094)

# 1.0.3

- chore(blockchain-link): add addrTxCount (2d6e12535)
- feat: update deps in root package.json (5806d41bc)

# 1.0.2

- 5711aa998 feat(blockchain-link): add getMempoolFilters method
- 819c019d1 chore: use workspace:\* everywhere

# 1.0.1

- fix: remove workspace: from dependencies

# 1.0.0

- package created
