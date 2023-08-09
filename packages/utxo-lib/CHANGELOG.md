# 2.0.0 (not released)

BREAKING CHANGES in `composeTx` module.

renamed `composeTx` request parameters and response.

-   request `utxo.tsize` is removed
-   request `utxo.vsize` is removed
-   request `utxo.addressPath` is removed
-   request `utxo.height` > `utxo.confirmations`
-   request `utxo.value` > `utxo.amount`
-   request `utxo.index` > `utxo.vout`
-   request `utxo.transactionHash` > `utxo.txid`
-   request `output.type = 'complete'` > `output.type = 'payment'`
-   request `output.type = 'noaddress'` > `output.type = 'payment-noaddress'`
-   request `changeAddress: string` > `changeAddress: { address: string }`
-   request `height` is removed
-   request `basePath` is removed (not used)
-   request `changeId` is removed (not used)

-   response nested `transaction` object is removed. Final result contains fields `inputs`, `outputs` and `outputsPermutation`
-   response `nonfinal` result contains `inputs`
-   response `transaction.input.index` > `input.vout`
-   response `transaction.input.hash` > `input.txid`
-   response `transaction.output.value` > `output.amount`
-   response `transaction.output.opReturnData: Buffer` > `output.dataHex: string`
-   response `transaction.output.type` added (only for final output types: `payment`, `opreturn` and `send-max` which becomes `payment` after amount calculation)
-   response `transaction.output.type` added (only for final output types: `payment`, `opreturn` and `send-max` which becomes `payment` after amount calculation)
-   response `type = 'error'` is strongly typed

-   request `utxo` is generic and should be equal to `response.input` (ComposeInput)
-   request `output` is generic and should be equal to `response.output` (ComposeOutput + ComposeChangeAddress)
-   request `changeAddress` is generic and should be equal to `response.output.type = 'change'`

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
