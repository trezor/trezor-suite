# 10.0.0

- npm-prerelease: @trezor/utxo-lib 10.0.0-beta.3 (6c3d1d9209)
- npm-prerelease: @trezor/utxo-lib 10.0.0-beta.2 (11b37d4c40)
- feat(utxo-lib): add `psbt` tx parser (b665659598)
- chore(utxo-lib): defer multisig weight fix (86b35727f7)
- chore(eslint): adopt remaining v10 recommended rules (e5916c5f13)
- chore: apply prettier changes (7de6f3e919)
- refactor(utxo-lib): remove Decred support (26498b8b2d)
- refactor(utxo-lib): remove Dash support (6b4c3c7e24)
- feat(eslint): enable @typescript-eslint/prefer-string-starts-ends-with (60f642047b)
- test(utxo-lib): co-locate tests (101cdac028)
- chore(connect): bump version to 10.0.0-beta.1 (aaac2abdea)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- refactor(utxo-lib): remove unnecessary type assertions (ca0ee7604b)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- refactor: prefer typedObject* helpers over casted Object.keys/entries/values (a408dd20e7)
- chore(utxo-lib): `composeTx` - remove unused floorBaseFee param (46e22f873d)
- refactor(utxo-lib): `composeTx` - add feePolicy (408c1f0cbd)
- feat(connect): remove Peercoin (PPC) support (73b5d3330e)
- chore(utxo-lib): remove obsolete `vsize` module (6629fb8819)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- refactor(utxo-lib): remove `minimaldata` dependency (fd733e8d4b)
- chore(utxo-lib): replace int64-buffer with native Buffer BigInt (685dfeaf96)
- fix: resolve noUncheckedIndexedAccess errors across the codebase (e0d8a3bd20)
- chore(utxo-lib): rename bignumberOrNaN => `parseBigInt` (b5f52b5d49)
- test(utxo-lib): cover coinselect modules (629f077a19)
- refactor(utxo-lib): replace bn.js with BigInt (90e440370c)
- fix: widen prettier tsconfig override to match all tsconfig variants (e3eb2cff8c)
- chore(utxo-lib): inline bitcoin-ops and pushdata-bitcoin (d347d4922e)
- test(utxo-lib): cover writeUInt64LEasString and writeInt64LE (647c99476e)
- chore: remove blake-hash (d54bd1e320)
- test(utxo-lib): cover script.compile/toStack/decompile edge cases (1f455c03b3)
- chore(utxo-lib): replace bip66 with @noble/curves DER utils (d0355159e7)
- test(utxo-lib): cover scriptSignature.toDER and noble-compatibility guards (7843e0aa63)
- chore(jest): wire JestCustomEnv into all node-env packages (775a942d1f)
- refactor(types): replace typeof undefined with never in discriminated unions (5e3202a974)
- refactor(utxo-lib): convert (x && x.y) checks to optional chaining (c4b51d45a9)
- refactor: use throwError where possible (32383ee4b7)
- chore(connect): drop redundant publishConfig.type in ESM packages (af2b73c765)
- chore(utxo-lib): separate module declarations (0f0d0fc5ed)
- chore: tsconfig formatting (8c60ca008d)
- chore(connect): support top-level module type in ESM packages (9aebe9cfb0)
- chore(deps): unify @scure/base on v2 across the monorepo (a9902c10c7)
- feat(connect): drop CommonJS output across connect ecosystem (b99609bfb8)
- refactor(utxo-lib): drop node crypto for @noble/hashes (177f7b654c)
- chore: use type imports (b4caf7f0ac)
- refactor: replace indexOf comparisons with Array.includes (99cca423fe)
- chore(deps): bump @sinclair/typebox and typebox-codegen (e9d028e88b)
- fix: broaden Buffer types (fcf8d95b9b)
- chore(tests): migrate web packages to @swc/jest (15192f30ee)
- ci(test-misc): reduce unit-test log noise with --silent and drop --verbose (0ca849c648)
- feat(utxo-lib): output descriptors utilities BIP380 (1c011c4268)
- chore(utxo-lib): remove parity tests (383fbaa3a0)
- chore: Replace cryptography dependencies with @noble/hashes, @noble/curves, and @scure/base (19276ace93)
- chore: switch public client-side packages to MIT license (7b03152f66)
- chore: narrow imports, do not use direct paths for utxo-lib (26370fea69)
- chore: remove npmPublishAccess fields from package.json (743d2836de)
- chore: unify package.json publishConfig (216e6de7cc)
- chore: update bn.js (12402cac36)
- refactor: replace custom eslint script with nx one (ad87eac457)
- chore: ignore TS circular references (c0e48c9a63)
- chore: add type keyword to all types in imports and exports (47c184a859)
- feat(connect): add .mjs to ESM build (d1bd996295)
- chore(utxo-lib): replace typeforce with typebox (68fdbb289d)
- chore: bump bn.js (8a9a9b63d4)
- chore: remove unused `prepublishOnly` script (0056cb62fa)
- fix: Updated unit tests jest configs (6138839e45)
- chore: bump tsx version (98321960e2)
- npm-prerelease: set all @trezor/connect dependencies to 10.0.0-alpha.1 (ab01b2d889)
- chore(npm): remove prepublish.js (7559f035c3)
- build(repository): Connect publishing ESM (a9e189b9a3)
- feat(blockchain-link): cache addresses by Electrum worker (c1fcbfb36b)
- chore(npm): start publishing source maps (36f6e9692d)

# 2.5.0

- npm-prerelease: @trezor/utxo-lib 2.4.5-beta.2 (07d8754a61)
- refactor(connect): new replace-imports.sh script using babel (2128d273f3)
- chore: change fail in test names to error to find fails easier (2393763310)
- npm-prerelease: @trezor/utxo-lib 2.4.5-beta.1 (b8337f1bdb)
- fix(suite): correct max amount behavior for ETH and SOL staking (912efab4b5)
- chore(suite): update network backends (74e276011e)
- docs(packages): remove link to non-existing document (9291fe7872)

# 2.4.4

- npm-prerelease: @trezor/utxo-lib 2.4.4-beta.1 (0b5bda5a62)

# 2.4.3

- fix: remove all dependenices that are unused (found by added depcheck script to package.json) (ecae55a2ea)
- fix: missing deptchecks in packages (0d4633e159)
- npm-prerelease: @trezor/utxo-lib 2.4.3-beta.1 (68a86332a5)
- chore(utxo-lib): remove deprecated bchaddr dependency, add own implementation (adcf5db457)

# 2.4.2

- npm-prerelease: @trezor/utxo-lib 2.4.2-beta.2 (c89f7a536a)
- chore(utxo-lib): bump tiny-secp256k1 (537477e655)
- npm-prerelease: @trezor/utxo-lib 2.4.2-beta.1 (a8d201bb17)
- chore: bump @types/bn.js (245f181344)

# 2.4.1

- npm-prerelease: @trezor/utxo-lib 2.4.1-beta.1 (7e78bd7016)
- chore: update jest to v30 (6d27a2ca35)

# 2.4.0

- npm-prerelease: @trezor/utxo-lib 2.4.0-beta.1 (d378869f2d)

# 2.3.5

- npm-prerelease: @trezor/utxo-lib 2.3.5-beta.1 (d68cce61ea)
- chore: apply latest prettier (eb758acea9)
- chore: remove unnecessary @types libs (2b92d08706)
- chore(utxo-lib): move TxWeightCalculator to src (d349a5d05b)

# 2.3.3

- npm-prerelease: @trezor/utxo-lib 2.3.3-beta.1 (c31bf677a4)

# 2.3.2

- npm-prerelease: @trezor/utxo-lib 2.3.2-beta.1 (d2bcdc8348)

# 2.3.1

- npm-prerelease: @trezor/utxo-lib 2.3.1-beta.1 (d1159a83e5)
- fix(repo): fix generate package script (#17300) (a13f269b99)

# 2.3.0

- npm-prerelease: @trezor/utxo-lib 2.3.0-beta.1 (ee41d6d1a8)
- npm-prerelease: @trezor/utxo-lib 2.2.7-beta.1 (3225f30622)
- chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
- chore: rbf-fee calculation (BIP-125) archeology and documentation (1c875caa7e)
- chore: bump int64-buffer (00cb7c42f0)
- feat(connect): rename bnb to bsc (cc18737edc)
- fix: show proper info for unspendable coinbase transactions (610108e4da)

# 2.2.3

- npm-prerelease: @trezor/utxo-lib 2.2.3-beta.1 (5927d5b080)

# 2.2.2

- npm-prerelease: @trezor/utxo-lib 2.2.2-beta.1 (ca494efcb0)
- chore: get rid of '@typescript-eslint/no-unused-vars': 'off', and enforce it everywhere (1ad7b6f9b1)
- chore: enable import/order rule for whole codebase - prettier fix (12b6fb18b9)
- chore: enable import/order rule for whole codebase (e22b683733)
- chore: add recommanded checks from eslint-plugin-jest (55d663ca2d)
- fix(utxo-lib): add types bn.js and events (7cc53975ba)
- chore: rename bnb to branchAndBound to be more explicit & remove conllision with BNB token (2223463b66)
- chore: use interface (type) for coinselection algorithymns (5707a4d267)
- fix: make reandom mocks work in Karma (ed4c9e02ce)
- feat: implement random strategy for utxo sorting (6c3137fdf8)
- chore: improve fixture for compose.test (add strict types) (d3a4fe51d3)
- feat: add sortingStrategy param to connect, deprecate skipPermitationparam in composeTransaction (283d3f1eae)
- chore: default-export code improvement (f64440fe99)
- feat: introduce sortingStrategy into utxo-lib so we can have more strategies (bip69, none, and later the random) (3dace574c0)

# 2.2.1

- npm-prerelease: @trezor/utxo-lib 2.2.1-beta.1 (42a5868328)
- chore(suite): update mission dependencies: varuint-bitcoin (e8e2e59355)
- chore: update crypto libs (a304dd56a1)
- chore(utxo-lib): remove unused util (affd7d20c3)

# 2.2.0

- npm-prerelease: @trezor/utxo-lib 2.1.1-beta.1 (7173ccf5fe)
- chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)

# 2.0.11-beta.1

- chore(utxo-lib): remove create-hash dependency (840ecb5b0f)

# 2.0.9

- fix(utxo-lib): support checksums in descriptor parsing (4db4c2e903)

# 2.0.8

- chore(utxo-lib): lint fix (b43bb65ed9)
- chore(ci): speedup connect tests + explorer build (#11523) (17d9c0f4fb)
- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 2.0.7

- fix: from g:tsx to local tsx in prepublish script (d21d698b2)
- chore(suite): autofix newlines (c82455e74)
- chore(repo): ESLint refactor + speed up 70% (#11143) (44fa12a79)
- chore: update various dependencies (no major update) (fecd89f6e)
- chore: use global tsx (c21d81f66)
- chore: update typescript and use global tsc (84bc9b8bd)
- chore: use global rimraf (5a6759eff)
- chore: update prettier (00fe229e0)
- chore: use global jest (a7e68797d)
- chore: upgrade jest to 29.7.0 (3c656dc0b)
- chore: upgrade jest (004938e24)
- chore: update root dependencies (fac6d99ec)

# 2.0.4

- chore(utxo-lib): replace global.d.ts with global.ts (57b9b4fee)

# 2.0.3

- refactor(utxo-lib): use spread instead of Object.assign (55eecd28b)
- refactor(utxo-lib): coinselect VinVout values/amounts as BN (ab1dae3fd)

# 2.0.2

- refactor(utxo-lib): composeTx merge `coinselect` modules (7a8dff467)
- refactor(utxo-lib): composeTx result in one place (831d31688)
- refactor(utxo-lib): composeTx request validation in one place (ecb87bccd)
- chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
- chore: update `jest` and related dependency (b8a321c83)
- chore(utxo-lib): use default imports from commonjs dependencies (466e10e4c)
- refactor(utxo-lib): do not use direct `typeforce` import (96d97c312)
- chore(repo): update tsx (53de3e3a8)

# 2.0.1

BREAKING CHANGES in `composeTx` module.
renamed `composeTx` request parameters and response.

- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
- chore(tests): cleanup jets configs (#9869) (7b68bab05)
- feat(deps): update deps without breaking changes (7e0584c51)
- chore: update prettier to v3 and reformat (4229fd483)
- chore(desktop): update deps related to desktop packages (af412cfb5)
- chore(utxo-lib): export all ComposeResult types (993dbf628)
- chore(utxo-lib): version 2.0.0 (4d3495358)
- refactor(utxo-lib): `composeTx` nonfinal result with inputs (6107d8d82)
- refactor(utxo-lib): `composeTx` final result without nested transaction object (bb379b47d)
- chore(utxo-lib): `composeTx` remove `basePath` and `changeId` params (8a6dacfc6)
- refactor(utxo-lib): `composeTx` make changeAddress param generic (9f91c0911)
- refactor(utxo-lib): `composeTx` make ComposeOutput and ComposedTransaction.output generic (2e4b3563a)
- chore(utxo-lib): `composeTx` simplify processing result from `coinselect` (af7ca4837)
- refactor(utxo-lib): `composeTx` strongly typed errors (3d8ce504a)
- chore(utxo-lib): `composeUtils` simplify outputs sorting (e78afec83)
- chore(utxo-lib): `composeUtils` remove unnecessary function (a6d54e443)
- refactor(utxo-lib): `composeUtils` use payments module to create `script` used in `CoinSelectOutput` (2180ea28a)
- refactor(utxo-lib): `coinselect` add changeOutput to CoinSelectOptions (1ba5f0aad)
- refactor(utxo-lib): `composeTx` replace Permutation class with simple function (a1ccae45f)
- refactor(utxo-lib): `composeTx` ComposedTxOutput rename `opReturnData` to `dataHex` (6c36de145)
- refactor(utxo-lib): `composeTx` ComposeOutput rename `type` field (d3c6c82e0)
- refactor(utxo-lib): `composeTx` make ComposeInput and ComposedTransaction.input generic (3e3d2a601)
- refactor(utxo-lib): `composeTx` ComposeInput and ComposedTxInput rename `transactionHash` and `hash` to `txid` (939c153ff)
- refactor(utxo-lib): `composeTx` ComposeInput and ComposedTxInput rename `index` to `vout` (f0a434698)
- refactor(utxo-lib): `composeTx` ComposeInput and ComposedTxOutput rename `value` to `amount` (22414faaa)
- refactor(utxo-lib): `composeTx` ComposeInput: rename `height` to `confirmations` (070f3d06f)
- chore(utxo-lib): `composeTx` ComposeInput: remove `addressPath`, `tsize` and `vsize` fields (4e1d79151)

# 1.0.11

- test(utxo-lib): zip-317 (140018dde)
- feat(utxo-lib): zip-317 (93ef15656)
- test(utxo-lib): add fee policies (725c2c32f)
- chore(utxo-lib): add fee policies (1e4435098)
- refactor(utxo-lib): reworked getFee params (65cb7f6ce)
- chore: replace deprecated String.subst with Sting.substing (57f45d4cd)
- chore: replace deprecated Buffer.slice with Buffer.subarray (814caeaa9)
- chore: use `getChunkSize` from @trezor/utils package (a6fb8ea98)

# 1.0.10

- fix(utxo-lib): `coinselect` bnb algorithm (c3c9ccd15)
- tests(utxo-lib): add/adjust coinselect fixtures (af695672e)
- fix(utxo-lib): dustThreshold calculation (4066080d5)
- chore(utxo-lib): rename coinselect and compose `utils` files to corresponding prefix (206a8bc03)
- chore(utxo-lib): unify coinselect result/response interface (07e4dfa5b)
- chore(utxo-lib): move coinselect and compose related types (e90841c78)
- chore(utxo-lib): move payments related types (127dba929)
- chore(utxo-lib): move typeforce related types (35be1f33b)
- chore: remove some unecessary build:lib (0a5d8267c)

# 1.0.8

- feat(utxo-lib): support ltc address derivation (9ac099f56)

# 1.0.6

- 819c019d1 chore: use workspace:\* everywhere

# 1.0.5

chore(utxo-lib): update deps, update bs58check bitcoin lib

# 1.0.4

- fix(utxo-lib): ltc deserialize without advanced marker
- feat(utxo-lib): add getTransactionVbytes util
- feat(utxo-lib): add getAddressType util

# 1.0.3

- chore: remove unused skipUtxoSelection

# 1.0.2

- fix output sorting with amount above MAX_SAFE_INTEGER
- add (litecoin): support for spending mweb pegout outputs

# 1.0.1

- add `TransactionBase.getWitness` method
- add zcash NU5 support
- add SLIP25 address derivation support
- allow decimal fee rates

# 1.0.0
