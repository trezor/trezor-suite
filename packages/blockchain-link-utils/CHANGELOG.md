# 1.0.16

-   chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
-   chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.0.15

-   fix: from g:tsx to local tsx in prepublish script (d21d698b2)
-   feat(eth-staking): add unstake pending state, pool stats, stake data from blockbook (27e463e04)
-   fix(suite): `fromWei` and `toWei`check errors (#11266) (99bb3324d)
-   chore(suite): autofix newlines (c82455e74)
-   chore: update various dependencies (no major update) (fecd89f6e)
-   chore: use global tsx (c21d81f66)
-   chore: update typescript and use global tsc (84bc9b8bd)
-   chore: use global rimraf (5a6759eff)
-   chore: use global jest (a7e68797d)
-   chore: upgrade jest to 29.7.0 (3c656dc0b)
-   chore: upgrade jest (004938e24)
-   chore: update root dependencies (fac6d99ec)

# 1.0.14

-   Revert feat(blockchain-link); get sol token metadata from coingecko (61cf93cd62)

# 1.0.13

-   feat(blockchain-link); get sol token metadata from coingecko (5c901ea8f)

# 1.0.12

-   fix(blockchain-link-utils): support `multisigAuthority` in solana txs (dfd96d23b)
-   fix(blockchain-link-utils): use `some` instead of `find` in solana tx type predcicates (1d58f980d)
-   fix(blockchain-link-utils): parse solana transfers originating from exchanges (58b125fb2)
-   fix(blockchain-link): correct import in solana using @trezor/ prefix (3a4895d6b)

# 1.0.11

-   fix(blockchain-link): gasPrice null fallback (34d612a06)
-   fix(blockchain-link): fix solana txs when sending to associated token account (5cb682078)
-   feat(blockchain-link-utils): add meta for solana BONK token (c8e1762ed)
-   fix(blockchain-link): filter out non-spl tokens (de631248e)
-   feat(blockchain-link): remove `TypedRawTransaction` (34d405d12)
-   refactor(blockchain-link-utils): improve `transformTransaction` params (a28a90142)
-   chore(blockchain-link): remove ADA `null` subtype (07161b141)

# 1.0.10

-   fix(blockchain-link): add solana vout for self txs (ab6f0acf0)
-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
-   chore(repo): update tsx (53de3e3a8)
-   feat(suite): add Solana support (f2a89b34f)

# 1.0.9

-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   chore(jest): update jest in packages without issues (7458ab20f)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   fix(blockchain-link): PR review fixes (08d84dfe6)
-   feat(blockchain-link): Solana tx history (9dff5e509)
-   feat(blockchain-link): Solana tokens (9adc115ce)
-   feat(deps): update deps without breaking changes (7e0584c51)
-   chore(desktop): update deps related to desktop packages (af412cfb5)

# 1.0.7

-   chore: replace deprecated String.subst with Sting.substing (57f45d4cd)
-   chore: replace deprecated Buffer.slice with Buffer.subarray (814caeaa9)

# 1.0.6

-   feat(blockchain-link): return tx hex in blockbook transactions (6aba6f094)

# 1.0.5

-   fix(blockchain-link): use tx `rbf` flag from backend (c5f7a5033)

# 1.0.4

-   chore(blockchain-link): add addrTxCount (2d6e12535)
-   feat: update deps in root package.json (5806d41bc)

# 1.0.3

-   819c019d1 chore: use workspace:\* everywhere

# 1.0.2

-   chore(blockchain-link): fix ripple blocktime

# 1.0.1

-   fix: remove workspace: from dependencies

# 1.0.0

-   package created
