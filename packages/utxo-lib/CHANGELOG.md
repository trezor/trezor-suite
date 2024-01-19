# 2.0.4

-   chore(utxo-lib): replace global.d.ts with global.ts (57b9b4fee)

# 2.0.3

-   refactor(utxo-lib): use spread instead of Object.assign (55eecd28b)
-   refactor(utxo-lib): coinselect VinVout values/amounts as BN (ab1dae3fd)

# 2.0.2

-   refactor(utxo-lib): composeTx merge `coinselect` modules (7a8dff467)
-   refactor(utxo-lib): composeTx result in one place (831d31688)
-   refactor(utxo-lib): composeTx request validation in one place (ecb87bccd)
-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
-   chore: update `jest` and related dependency (b8a321c83)
-   chore(utxo-lib): use default imports from commonjs dependencies (466e10e4c)
-   refactor(utxo-lib): do not use direct `typeforce` import (96d97c312)
-   chore(repo): update tsx (53de3e3a8)

# 2.0.1

BREAKING CHANGES in `composeTx` module.
renamed `composeTx` request parameters and response.

-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   chore(tests): cleanup jets configs (#9869) (7b68bab05)
-   feat(deps): update deps without breaking changes (7e0584c51)
-   chore: update prettier to v3 and reformat (4229fd483)
-   chore(desktop): update deps related to desktop packages (af412cfb5)
-   chore(utxo-lib): export all ComposeResult types (993dbf628)
-   chore(utxo-lib): version 2.0.0 (4d3495358)
-   refactor(utxo-lib): `composeTx` nonfinal result with inputs (6107d8d82)
-   refactor(utxo-lib): `composeTx` final result without nested transaction object (bb379b47d)
-   chore(utxo-lib): `composeTx` remove `basePath` and `changeId` params (8a6dacfc6)
-   refactor(utxo-lib): `composeTx` make changeAddress param generic (9f91c0911)
-   refactor(utxo-lib): `composeTx` make ComposeOutput and ComposedTransaction.output generic (2e4b3563a)
-   chore(utxo-lib): `composeTx` simplify processing result from `coinselect` (af7ca4837)
-   refactor(utxo-lib): `composeTx` strongly typed errors (3d8ce504a)
-   chore(utxo-lib): `composeUtils` simplify outputs sorting (e78afec83)
-   chore(utxo-lib): `composeUtils` remove unnecessary function (a6d54e443)
-   refactor(utxo-lib): `composeUtils` use payments module to create `script` used in `CoinSelectOutput` (2180ea28a)
-   refactor(utxo-lib): `coinselect` add changeOutput to CoinSelectOptions (1ba5f0aad)
-   refactor(utxo-lib): `composeTx` replace Permutation class with simple function (a1ccae45f)
-   refactor(utxo-lib): `composeTx` ComposedTxOutput rename `opReturnData` to `dataHex` (6c36de145)
-   refactor(utxo-lib): `composeTx` ComposeOutput rename `type` field (d3c6c82e0)
-   refactor(utxo-lib): `composeTx` make ComposeInput and ComposedTransaction.input generic (3e3d2a601)
-   refactor(utxo-lib): `composeTx` ComposeInput and ComposedTxInput rename `transactionHash` and `hash` to `txid` (939c153ff)
-   refactor(utxo-lib): `composeTx` ComposeInput and ComposedTxInput rename `index` to `vout` (f0a434698)
-   refactor(utxo-lib): `composeTx` ComposeInput and ComposedTxOutput rename `value` to `amount` (22414faaa)
-   refactor(utxo-lib): `composeTx` ComposeInput: rename `height` to `confirmations` (070f3d06f)
-   chore(utxo-lib): `composeTx` ComposeInput: remove `addressPath`, `tsize` and `vsize` fields (4e1d79151)

# 1.0.11

-   test(utxo-lib): zip-317 (140018dde)
-   feat(utxo-lib): zip-317 (93ef15656)
-   test(utxo-lib): add fee policies (725c2c32f)
-   chore(utxo-lib): add fee policies (1e4435098)
-   refactor(utxo-lib): reworked getFee params (65cb7f6ce)
-   chore: replace deprecated String.subst with Sting.substing (57f45d4cd)
-   chore: replace deprecated Buffer.slice with Buffer.subarray (814caeaa9)
-   chore: use `getChunkSize` from @trezor/utils package (a6fb8ea98)

# 1.0.10

-   fix(utxo-lib): `coinselect` bnb algorithm (c3c9ccd15)
-   tests(utxo-lib): add/adjust coinselect fixtures (af695672e)
-   fix(utxo-lib): dustThreshold calculation (4066080d5)
-   chore(utxo-lib): rename coinselect and compose `utils` files to corresponding prefix (206a8bc03)
-   chore(utxo-lib): unify coinselect result/response interface (07e4dfa5b)
-   chore(utxo-lib): move coinselect and compose related types (e90841c78)
-   chore(utxo-lib): move payments related types (127dba929)
-   chore(utxo-lib): move typeforce related types (35be1f33b)
-   chore: remove some unecessary build:lib (0a5d8267c)

# 1.0.8

-   feat(utxo-lib): support ltc address derivation (9ac099f56)

# 1.0.6

-   819c019d1 chore: use workspace:\* everywhere

# 1.0.5

chore(utxo-lib): update deps, update bs58check bitcoin lib

# 1.0.4

-   fix(utxo-lib): ltc deserialize without advanced marker
-   feat(utxo-lib): add getTransactionVbytes util
-   feat(utxo-lib): add getAddressType util

# 1.0.3

-   chore: remove unused skipUtxoSelection

# 1.0.2

-   fix output sorting with amount above MAX_SAFE_INTEGER
-   add (litecoin): support for spending mweb pegout outputs

# 1.0.1

-   add `TransactionBase.getWitness` method
-   add zcash NU5 support
-   add SLIP25 address derivation support
-   allow decimal fee rates

# 1.0.0
