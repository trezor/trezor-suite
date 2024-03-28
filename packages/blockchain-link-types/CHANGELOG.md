# 1.0.15

-   chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
-   chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.0.14

-   fix: from g:tsx to local tsx in prepublish script (d21d698b2)
-   feat(eth-staking): add unstake pending state, pool stats, stake data from blockbook (27e463e04)
-   fix(suite): `fromWei` and `toWei`check errors (#11266) (99bb3324d)
-   chore(suite): replace `selectCoinsLegacy` by fiat rates selectors (4e3ce7367)
-   chore(blockchain-link): remove unused error event (4c1b8df7d)
-   chore: update various dependencies (no major update) (fecd89f6e)
-   chore: use global tsx (c21d81f66)
-   chore: update typescript and use global tsc (84bc9b8bd)
-   chore: use global rimraf (5a6759eff)
-   chore: update root dependencies (fac6d99ec)

# 1.0.12

-   feat(suite-native): modals renderer (#10801) (a9b4d1e8fe)
-   chore(blockchain-link-types): move deps from dev to dependencies (b77caf9715)

# 1.0.11

-   fix(suite): subscribe to Solana token accounts as well (b2f85ac9e)
-   chore(blokchain-link-types): import type from @trezor/type-utils (a2087ebf7)

# 1.0.10

-   fix(blockchain-link): fix solana txs when sending to associated token account (5cb682078)
-   feat(blockchain-link): remove `TypedRawTransaction` (34d405d12)
-   feat(blockchain-link): add `getTransactionHex` method (cbca5dbfd)
-   chore(blockchain-link): remove ADA `null` subtype (07161b141)
-   fix(blockchain-link-types): ADA getTransaction type (02e6194ef)

# 1.0.9

-   chore(repo): update tsx (53de3e3a8)
-   feat(suite): add Solana support (f2a89b34f)

# 1.0.8

-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   chore(suite): update lockfile (761aea82b)
-   feat(blockchain-link): Solana tx history (9dff5e509)
-   feat(blockchain-link): Solana tokens (9adc115ce)
-   feat(blockchain-link): Solana getAccountInfo (248913743)
-   feat(blockchain-link): Solana estimateFee (34a2f28a0)
-   feat(blockchain-link): Solana worker setup (662bc092a)
-   feat(deps): update deps without breaking changes (7e0584c51)
-   chore(desktop): update deps related to desktop packages (af412cfb5)

# 1.0.6

-   feat(blockchain-link-types): add block filters (78dd71d4c)
-   chore: replace deprecated String.subst with Sting.substing (57f45d4cd)

# 1.0.5

-   feat(blockchain-link): return tx hex in blockbook transactions (6aba6f094)

# 1.0.3

-   chore(blockchain-link): add addrTxCount (2d6e12535)
-   feat: update deps in root package.json (5806d41bc)

# 1.0.2

-   5711aa998 feat(blockchain-link): add getMempoolFilters method
-   819c019d1 chore: use workspace:\* everywhere

# 1.0.1

-   fix: remove workspace: from dependencies

# 1.0.0

-   package created
