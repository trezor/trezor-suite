# 10.0.0

- npm-prerelease: @trezor/protobuf 10.0.0-beta.3 (5ab716913a)
- npm-prerelease: @trezor/protobuf 10.0.0-beta.2 (cafd39f720)
- chore(protobuf): update protobuf definitions (fe18e1a9ed)
- chore(protobuf): update protobuf definitions (39ee18557b)
- feat(connect): sign EIP-7702 transactions via ethereumSignTransaction (6aeeda9b66)
- chore(deps): bump @bufbuild/buf to 1.72.0 (e91f0b407f)
- feat(connect): support Soroban InvokeHostFunction Stellar operation (ea9b52e440)
- chore: apply prettier changes (7de6f3e919)
- fix(protobuf): run type-aware eslint checks in definitions build (15859dca57)
- chore(protobuf): update protobuf definitions (3460cc4cc1)
- chore(connect): bump version to 10.0.0-beta.1 (aaac2abdea)
- test(protobuf): co-locate tests (ca1ffbfd90)
- chore(protobuf): update protobuf definitions (35cd3407b0)
- fix(protobuf): StellarSCVal patch (180e8ff056)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- chore(protobuf): remove unused order patch (5b7bd08179)
- chore(protobuf): remove required rule patch for TxRequest (0a0d78ecf2)
- chore(protobuf): remove required rule patch for `Features` (cfcda0d896)
- feat(protobuf): support Evolu registration rotation index (ed3d5a569d)
- feat(connect): add chunkify support to solanaSignTransaction (d5e783dd79)
- chore(protobuf): update protobuf definitions (4639d36cc9)
- chore(protobuf): update protobuf definitions (1184440b5d)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- feat(protobuf): strict wire direction types for typedCall (f81e794c75)
- chore(protobuf): update protobuf definitions (46e84252e7)
- fix(protobuf): adjust missing null normalization in Features fields (8c7d384eac)
- fix(protobuf): decode absent optional enums as `null` (3e649b6c06)
- feat(protobuf): add nostr protobufs (17b584f837)
- chore(protobuf): update protobuf definitions (c6e162365b)
- chore: drop stale libESM references from nx and depcheck configs (7e1c840bdb)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- fix: resolve noUncheckedIndexedAccess errors across the codebase (e0d8a3bd20)
- chore(protobuf): update proto (0cd99ec0ee)
- chore(jest): wire JestCustomEnv into all node-env packages (775a942d1f)
- fix(protobuf): add esm .js extension to generated definitions (db2f12d8fd)
- refactor(types): replace typeof undefined with never in discriminated unions (5e3202a974)
- chore(connect): drop redundant publishConfig.type in ESM packages (af2b73c765)
- chore: tsconfig formatting (8c60ca008d)
- chore(connect): support top-level module type in ESM packages (9aebe9cfb0)
- feat(connect): drop CommonJS output across connect ecosystem (b99609bfb8)
- chore: use type imports (b4caf7f0ac)
- chore(eslint): enable @typescript-eslint/no-empty-object-type globally (5a17fa3333)
- chore(connect): regenerate protobuf (62f44acca1)
- fix(protobuf): skip new ethereum definitions messages (42385e8b03)
- refactor(protobuf): replace `protobufjs` with `@bufbuild` (87adb8ac98)
- Revert feat(protobuf): add simultaneous `@bufbuild` encoding/decoding (87d53bcf0c)
- fix(protobuf): normalize ThpPairingRequest app_name and host_name (af8e018fa1)
- fix(protobuf): bufbuild decode optional message fallback (0934b9e366)
- chore(deps): bump @bufbuild/buf to 1.67.0 (d42ffc672e)
- fix(connect): enforce PAYTOADDRESS for external outputs in signTransaction (344051e7ef)
- chore(tests): migrate web packages to @swc/jest (15192f30ee)
- chore(protobuf): update protobufjs lib (48e93606ea)
- chore(deps): update ws, cbor, long, ts-mixer, @types/w3c-web-usb, postcss-lightningcss (ffae1b63fa)
- chore(connect-common): direct imports (9b60698bcd)
- chore: switch public client-side packages to MIT license (7b03152f66)
- chore(messages-schema): remove obsolete code (1d897895a7)
- chore(protobuf): update generated files (aa3675ed6b)
- chore(protobuf): remove obsolete code (5fb98091c6)
- feat(protobuf): bufbuild - generate types for THP messages (70e52d2d68)
- fix(protobuf): update protobuf patches (9eead789d2)
- fix(protobuf): bufbuild - skip internal messages (b99dd78ff8)
- chore: remove npmPublishAccess fields from package.json (743d2836de)
- chore: unify package.json publishConfig (216e6de7cc)
- fix(protobuf): throw error if patch is not found during definitions build (40c1f3878a)
- chore(protobuf): remove unused files (e0e356110c)
- refactor(protobuf): use message schema from definitions index (9209601549)
- feat(protobuf): add generated messages schema (2a3e75140d)
- feat(protobuf): generate message schema files using `@bufbuild` plugin (d9e104c25c)
- fix(protobuf): remove nested schema/shape from the MessageType (122426ddbe)
- feat(protobuf): add simultaneous `@bufbuild` encoding/decoding (cc26a69bf7)
- test(protobuf): add bufbuild test (ddf58d1579)
- feat(protobuf): add `@bufbuild` manager (9b6d578930)
- chore(protobuf): update definitions (a1130a4b2f)
- feat(protobuf): add special handling for transform to binary (9c60d8d8fd)
- refactor: replace custom eslint script with nx one (ad87eac457)
- chore: add type keyword to all types in imports and exports (47c184a859)
- feat(connect): add .mjs to ESM build (d1bd996295)
- feat(protobuf): add `@bufbuild` generated schema (4bd37460b2)
- feat(protobuf): create `@bufbuild` setup (94cb77a9cd)
- chore: remove unused `prepublishOnly` script (0056cb62fa)
- fix: Updated unit tests jest configs (6138839e45)
- fix(protbuf): selectively revert evolu breaking change (a6b48d710d)
- feat(protobuf): update ORDER in scripts (e5a20c60f2)
- chore(protbuf): update messages (97dc6f4627)
- chore: bump tsx version (98321960e2)
- npm-prerelease: set all @trezor/connect dependencies to 10.0.0-alpha.1 (ab01b2d889)
- chore(npm): remove prepublish.js (7559f035c3)
- feat(scripts): handle libESM in updateProjectReferences (3d71f2c20a)
- fix: update project deps (b9266f02f9)
- build(repository): Connect publishing ESM (a9e189b9a3)
- chore(protobuf): update for tron support (a1062202fa)
- feat(connect): remove NEM support (b9e7b55832)
- chore(npm): start publishing source maps (36f6e9692d)

# 1.5.1

- npm-prerelease: @trezor/protobuf 1.5.1-beta.1 (2bd0d9483c)

# 1.5.0

- npm-prerelease: @trezor/protobuf 1.5.0-beta.2 (107675da4a)
- refactor(connect): new replace-imports.sh script using babel (2128d273f3)
- fix(connect): PaymentRequest amount (c19c043570)
- npm-prerelease: @trezor/protobuf 1.5.0-beta.1 (2a18d21102)
- fix(protobuf): add patch for ThpDeviceProperties.pairing_methods (161406226b)
- feat: update protobuf (4740d1637d)
- feat(suite): add additional calls to connect for evolu (4e5f1fecbb)
- fix(protobuf): update protobuf for monero (ca9dbb3525)
- npm-prerelease: @trezor/protobuf 1.4.5-beta.1 (75adbf16e2)
- feat(connect): monero support (7e4e42c9da)
- chore(protobuf): update payment request amount (c9d8b3ee0b)
- docs(packages): remove link to non-existing document (9291fe7872)

# 1.4.4

- npm-prerelease: @trezor/protobuf 1.4.4-beta.1 (2a3c8588b8)
- feat(protobuf): replace special chars when protobuf encoding (d4c9b88c9e)
- chore(protobuf): update protobuf (295afab848)

# 1.4.3

- npm-prerelease: @trezor/protobuf 1.4.3-beta.1 (789d9d2d29)
- chore(protobuf): add battery SoC to Features (dac0254a25)
- feat: add evoluGetKeys method (a371a88940)
- chore(protobuf): update, reorder (d054ce6435)
- fix(protobuf): patch CoinPurchaseMemo.amount (740f93ce7d)
- chore(protobuf): update THP protobuf messages (94267f36aa)
- fix(trading): receive display amount (d27646a3d3)
- chore(protobuf): update `THP` MessageType enum (3270d50505)
- chore(protobuf): rename proto TxAckPaymentRequest > PaymentRequest (cd0f551fb8)

# 1.4.2

- npm-prerelease: @trezor/protobuf 1.4.2-beta.1 (6a61f26191)
- feat(protobuf): add build script for `THP` protobuf messages (b13115e870)
- chore(protobuf): update protobuf messages (161663b6a2)

# 1.4.1

- npm-prerelease: @trezor/protobuf 1.4.1-beta.1 (d232ee31da)
- chore(protobuf): update protobuf messages (8f794d5575)

# 1.4.0

- npm-prerelease: @trezor/protobuf 1.4.0-beta.1 (731bca229d)
- feat(protobuf): update protobuf messages (07e13c1f50)
- chore(protobuf): update protobuf definitions (b97fae5cf5)

# 1.3.5

- npm-prerelease: @trezor/protobuf 1.3.5-beta.1 (884f7764d8)
- chore: apply latest prettier (eb758acea9)
- fix(protobuf): order of EthereumDefinitions (1cfc6a3e25)
- chore(protobuf): minor changes in build scripts (7951ed9c76)
- fix(protobuf): use Failure enum as a string key (15336dbbe6)
- chore(protobuf): update protobuf definitions (926ffa355c)
- fix(protobuf): remove manual changes in generated code (9beef38d7c)

# 1.3.4

- npm-prerelease: @trezor/protobuf 1.3.4-beta.1 (4664dfed22)
- fix(connect): Failure code properly typed (fb14734ac4)

# 1.3.3

- npm-prerelease: @trezor/protobuf 1.3.3-beta.1 (3f079b57d3)

# 1.3.2

- npm-prerelease: @trezor/protobuf 1.3.2-beta.2 (68749e6701)
- npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)
- fix(protobuf): fix DeviceModelInternal read patch path (3bdcbfc508)
- chore(protobuf): exclude nostr (b18b8da051)
- feat(protobuf): load definitions (f4f4fadcfc)
- chore: move DeviceModelInternal to device-utils (0bcf666672)

# 1.3.1

- npm-prerelease: @trezor/protobuf 1.3.1-beta.1 (6256d4a813)
- fix(repo): fix generate package script (#17300) (a13f269b99)

# 1.3.0

- chore(protobuf): update protobuf (fb892d5db8)
- Revert chore(transport): move long dep to protobuf package and unify its version with protobufjs (4a6b98bcf3)
- chore(transport): move long dep to protobuf package and unify its version with protobufjs (3ab195cf19)
- npm-prerelease: @trezor/protobuf 1.3.0-beta.1 (736c4b6620)
- npm-prerelease: @trezor/protobuf 1.2.7-beta.1 (36972ab0e7)
- chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
- chore: enable ESLint rule for as-needed | auto-fix (64fcbde4bd)
- chore(protobuf): update definitions (add `ResetDevice.entropy_check`) (3737c9ea00)
- feat(connect): introduce internal_model UNKNOWN for non-standard models (289ebe9dde)

# 1.2.6

- npm-prerelease: @trezor/protobuf 1.2.6-beta.1 (d2bc8b3b1a)

# 1.2.5

- npm-prerelease: @trezor/protobuf 1.2.5-beta.1 (a3f1b9247e)
- chore(protobuf): update protobuf definitions (display type enum added) (3818a30d06)

# 1.2.4

- npm-prerelease: @trezor/protobuf 1.2.4-beta.1 (cf18864248)

# 1.2.3

- npm-prerelease: @trezor/protobuf 1.2.3-beta.2 (c965336138)
- chore: add recommanded checks from eslint-plugin-jest (55d663ca2d)
- chore: add no-empty as it will became part of recommanded (ef2dd42a5e)
- feat(protobuf): add t3w1 internal_model (1f8a09066a)
- feat(suite): images, logic, videos for T3W1 (9ef409912d)
- feat(protobuf): add message for LoadDevice (950a3d04ef)
- feat(protobuf): stop skipping LoadDevice (3419d536e4)
- chore(protobuf): remove `MessageType_` prefix from `MessageType` enum (f620e40f2a)
- chore(protobuf): build types script as module (324ba30921)
- fix(protobuf): skip benchmark messages (888774fc19)
- fix(protobuf): repo path in build script (5396d67588)
- npm-prerelease: @trezor/protobuf 1.2.3-beta.1 (0b4f84fa7d)
- chore(protobuf): remove unused definitions (monero, webauthn) (66ae488690)
- chore(protobuf): build types scripts and patches `js` > `ts` (326260c73c)
- feat(protobuf): build definitions using protobufjs package (000870b9ab)
- chore(protobuf): update messages.json (71bbde850b)

# 1.2.1

- npm-prerelease: @trezor/protobuf 1.2.1-beta.1 (3cfd038db1)
- chore(connect): update @sinclair/typebox-codegen 0.8.13=>0.10.4 (6cd1fdc8af)
- chore(deps): update protobuf-js 7.2.6=>7.4.0 (0b937d6fe7)
- chore(deps): update various patch versions deps (ed3e9bfda7)

# 1.2.0

- npm-prerelease: @trezor/protobuf 1.1.1-beta.2 (0639cf5bdb)
- chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
- npm-prerelease: @trezor/protobuf 1.1.1-beta.1 (8c9f17688c)
- chore(connect): add basic types support for T3B1 (131c4af73a)
- feat(protobuf): update protobuf messages for newest version (f8d8a23a85)

# 1.0.14-beta.2

- chore(suite): unused package dependencies removed (f7907e1496)
- chore(suite): depcheck enabled (2206f19f2e)

# 1.0.14-beta.1

- feat(suite): Add adding a new shamir group into an existing setup (e9a0425183)
- feat(connect): Conway certificates (ab003ce04f)
- fix(suite): make default 1:1 for adding backup from settings + sync protobuffs (b08d5602fb)

# 1.0.13-beta.1

- fix(protobuf): deterministic protobuf order in generated file (7bdc2ebecc)
- fix(scripts): probuf update separate repository + fix situation when someone force-pushes the FW branch (9bdad31d67)
- fix(protobuf): add git fetch to update script (be86c395ad)
- feat(connect): update protobuf messages (41bff13bc1)

# 1.0.12

- chore(protobuf): ability to build protobuf messages from the specified branch (7a6babb818)
- feat(protobuf): add T3T1 internal_model patch (6a6aea725e)
- fix(protocol): encoding repeated enum (eaac0b12e8)
- feat(protocol): encode/decode messageType as string (ae3211ab6a)
- fix(protobuf): clean up type of `backup_type` in schema (19b7bb27c1)

# 1.0.11

- chore(connect-explorer-nextra): code cleanup, yarn resolutions (a0e511f1fd)
- feat(connect-explorer-nextra): params table for viewing schemas (2ed3a5b366)
- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.0.10

- fix(protobuf): undefined in messageToJSON (5fa61491e)
- chore(connect): format json after re-generation (350daea70)
- feat(connect): update protobuf (450acf915)

# 1.0.9

- fix: from g:tsx to local tsx in prepublish script (d21d698b2)
- chore(repo): remove build from protobuf (#11288) (11ffd941e)
- chore(suite): autofix newlines (c82455e74)
- chore(protobuf): update with Stellar related messages (22babdcf6)
- chore(protobuf): add language related messages (36ca33a67)
- chore(protobuf): recreate messages files (c06b3ee47)
- chore(protobuf): add eslint --fix to update:protobuf (db58d01b4)
- fix(protobuf): codegen devdependencies (0632e9ced)
- chore(repo): ESLint refactor + speed up 70% (#11143) (44fa12a79)
- chore: update various dependencies (no major update) (fecd89f6e)
- chore: use global tsx (c21d81f66)
- chore: update typescript and use global tsc (84bc9b8bd)
- chore: use global rimraf (5a6759eff)
- chore: remove test scripts for packages without tests (01e33b714)
- chore: use global jest (a7e68797d)
- chore: upgrade jest to 29.7.0 (3c656dc0b)
- chore: upgrade jest (004938e24)
- chore: update root dependencies (fac6d99ec)

# 1.0.8

- fix(suite): navbar positioning (icons) (123882a387)

# 1.0.6

- chore(protobuf): lint fix (cebcf0256)
- fix(protobuf): inaccuracy in `TxOutputType` (c78cd9ad2)
- refactor(connect): validation in API methods (0c035c26a)
- feat(protobuf): support sint in proto codegen (4fd7808ac)
- feat(connect): assert message schema in every typedCall (44430e47f)
- test(protobuf): check equivalence of generated Protobuf messages types (25420c4e8)
- feat(protobuf): use protobuf messages based on schema chore(protobuf): remove `bytebuffer` dependency fix(connect): use assert, update TS references, lint issue fix(connect-explorer): remove old references in tsconfig fix: update yarn, schema after rebase fix: update yarn lock after rebase (ad086e462)

# 1.0.4

- chore: remove `bytebuffer` dependency (9b2f9def0)
- chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
- chore(repo): update tsx (53de3e3a8)
- feat(suite): add Solana support (f2a89b34f)

# 1.0.3

- feat(connect): add support for solana FW interactions (3d9c703a5)
- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
- feat(deps): update deps without breaking changes (7e0584c51)
- chore(desktop): update deps related to desktop packages (af412cfb5)

# 1.0.2

- chore(transport): update protobuf (3ecb44412)

# 1.0.1

- chore(protobuf): update protobuf messages (9a9b193e7)
- chore(protobuf,protocol): missing fields in package.json (27a5e8ab4)

# 1.0.0

- chore(protobuf): update messages.json (d4542de357)
- deps(protobuf): add protobufjs-cli package (b7b5f8005a)
- chore: introduce protobuf and protocol packages (072042e772)
