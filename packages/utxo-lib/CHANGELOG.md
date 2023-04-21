# 2.0.0 (not released)

BREAKING CHANGES in `composeTx` module.

renamed `composeTx` params and response.

-   request `utxo.index` > `utxo.vout`
-   request `utxo.transactionHash` > `utxo.txid`
-   request `utxo.value` > `utxo.amount`
-   request `utxo.tsize` is removed (not used)
-   request `utxo.vsize` is removed (not used)
-   request `height` and request `utxo.height` are removed. Functionality is replaced by request `utxo.confirmations`
-   request `output.type = 'complete'` > `output.type = 'payment'`

-   response `input.index` > `input.vout`
-   response `input.hash` > `input.txid`
-   response `output.value` > `output.amount`

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
