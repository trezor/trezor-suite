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
