# 1.0.8

-   feat(utxo-lib): support ltc address derivation (9ac099f56)- feat: update deps in root package.json (5806d41bc)- chore: use workspace:\* everywhere (819c019d1)- npm-release: @trezor/utils 9.0.7 (b55cabe95)- chore(utxo-lib): update bs58check bitcoin lib (7fa66cb5e)- Feat/account types (#7949) (bc15e2454)- chore: update deps (97fd16bb1)- fix(utxo-lib): ltc deserialize without advanced marker (357d195a3)- chore(prettier): update formatting after prettier upgrade (3edbe0df6)- feat(desktop): update deps (79d702d59)- feat: update typescript (151f364d7)- feat(utxo-lib): add getTransactionVbytes util (b056e29e5)- feat(utxo-lib): add getAddressType util (45f8a84f2)- npm-release: @trezor/utils 9.0.5 (1e57d3a19)- npm-release: utxo-lib 1.0.3 (4b67e5f5f)- chore(utxo-lib): remove unused skipUtxoSelection (90b1cf7e2)- release: @trezor/utxo-lib 1.0.2 (7a93f7703)- release: @trezor/utils 9.0.4 (ec96cd28a)- feat(utxo-lib): de/serialize mweb peg out tx (ab10ddfcd)- feat(utxo-lib): isNetworkType for litecoin (d6dc94a56)- chore(monorepo): force workspace resolutions (d027b9763)- test(utxo-lib): move whale doge test from connect to utxo-lib (8efd42dde)- fix(utxo-lib): avoid dangerous conversion to Number when sorting outputs (780186694)- chore(npm): fix yarn publish command and prevent using npm (fbceedba2)- feat(utxo-lib): update bs58 lib (891ad0905)- chore: Upgrade to TS 4.9 (#6932) (b23f7b7bf)- release: @trezor/utxo-lib 1.0.1 (068bd5cd1)- release: @trezor/utils 9.0.3 (5d58e6fa7)- chore: use shared reverseBuffer utility in connect and utxo-lib (e7fea7429)- feat(utxo-lib): SLIP25 derivation support (27287df53)- refactor(utxo-lib): export common utils (efd26e3e6)- chore(ci): Nx for github validations (#6095) (a446583d5)- chore: upgrade to yarn 3 (#6061) (39c0ed80e)- chore(lint): enforce usage of @ts-expect-error (50ce258b0)- chore: forbid redundant eslint disable directives (1485646d8)- release: @trezor/utils 9.0.2 (fe848fc71)- fix: update public packages homepage (deb62e4b0)- chore: update READMEs for miscellaneous packages (b5ca775b8)- feat(utxo-lib): add zcash NU5 support - parse zcash NU5 transaction - removed redundant consensusBranchId from Network type/object - zcash NU5 test (a56e432c5)- chore: update trezor-utils version (b78fd2dd3)- fix(zcash): update zcash consensus branch to fix TX signing (4501afb18)- feat(utxo-lib): Allow decimal fee rates (99e669b28)- feat(utxo-lib): add getWitness method to Transaction class (b0a79620b)- chore(docs): unify readmes in packages (d49065dea)- chore: TS refactor to composite project, upgrade to TS 4.5 (#4851) (182439a7f)- chore: Prettier refactor, update, add CI check (#4950) (6253be3f9)- release: @trezor/utxo-lib 1.0.0 (19f7da99a)- release: @trezor/utils 1.0.1 (ace6ddf7a)- docs: add readme how to publish @trezor package to npm registry (d1c809ec1)- feat(utxo-lib): move discovery algo to utxo-lib (17dd1197c)- feat(utxo-lib): move derivation util to utxo-lib (0a5f957b0)- fix(utxo-lib): utxo-lib typings fix (0cc9c8c22)- chore(code): refactor eslint for utxo-lib (f91330e90)- chore(code): Upgrade Eslint (26ec44940)- fix(suite): cleanup account names and descriptions (f634404cd)- chore(suite): update trezor-connect 8.2.3-beta.3 (86b5c76e1)- tests(utxo-lib): adjusting fixtures in compose (1a8c0b675)- fix(utxo-lib): tx weight calculation in compose module (fb9eb4b4f)- utxo-lib: release 1.0.0-beta.9 (220fed40c)- fix(utxo-lib): compose - calculate txBaseLength instead of using constant (42b8c75cc)- fix(utxo-lib): use options object in dustThreshold function (ee2e875d5)- docs: update utxo-lib readme (7f536f302)- feat(utxo-lib): add compose p2tr input/output size (14ac0dcd6)- feat(utxo-lib): add p2tr/taproot payment (63fa86ab1)- feat(utxo-lib): add compose module (96d68c333)- feat(utxo-lib): add coinselect module (eb3df6462)- feat(utxo-lib): add bip32 module (8ad0c42f1)- feat(utxo-lib): add transaction module (8fec94cf6)- feat(utxo-lib): add bufferutils module (05e1d95d1)- feat(utxo-lib): add address module (28c54a946)- feat(utxo-lib): add sstx Decred payments (c5e1fe825)- feat(utxo-lib): add payments module (db687f321)- feat(utxo-lib): add crypto module (01e34337b)- feat(utxo-lib) add script module (29513dbbd)- feat(utxo-lib): add networks module (28d4ca8f8)- feat(utxo-lib): add types module (16f15085a)- feat: create @trezor/utxo-lib package (55182750e)

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
