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
