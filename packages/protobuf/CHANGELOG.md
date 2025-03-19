# 1.3.3

-   npm-prerelease: @trezor/protobuf 1.3.3-beta.1 (3f079b57d3)

# 1.3.2

-   npm-prerelease: @trezor/protobuf 1.3.2-beta.2 (68749e6701)
-   npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)
-   fix(protobuf): fix DeviceModelInternal read patch path (3bdcbfc508)
-   chore(protobuf): exclude nostr (b18b8da051)
-   feat(protobuf): load definitions (f4f4fadcfc)
-   chore: move DeviceModelInternal to device-utils (0bcf666672)

# 1.3.1

-   npm-prerelease: @trezor/protobuf 1.3.1-beta.1 (6256d4a813)
-   fix(repo): fix generate package script (#17300) (a13f269b99)

# 1.3.0

-   chore(protobuf): update protobuf (fb892d5db8)
-   Revert chore(transport): move long dep to protobuf package and unify its version with protobufjs (4a6b98bcf3)
-   chore(transport): move long dep to protobuf package and unify its version with protobufjs (3ab195cf19)
-   npm-prerelease: @trezor/protobuf 1.3.0-beta.1 (736c4b6620)
-   npm-prerelease: @trezor/protobuf 1.2.7-beta.1 (36972ab0e7)
-   chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
-   chore: enable ESLint rule for as-needed | auto-fix (64fcbde4bd)
-   chore(protobuf): update definitions (add `ResetDevice.entropy_check`) (3737c9ea00)
-   feat(connect): introduce internal_model UNKNOWN for non-standard models (289ebe9dde)

# 1.2.6

-   npm-prerelease: @trezor/protobuf 1.2.6-beta.1 (d2bc8b3b1a)

# 1.2.5

-   npm-prerelease: @trezor/protobuf 1.2.5-beta.1 (a3f1b9247e)
-   chore(protobuf): update protobuf definitions (display type enum added) (3818a30d06)

# 1.2.4

-   npm-prerelease: @trezor/protobuf 1.2.4-beta.1 (cf18864248)

# 1.2.3

-   npm-prerelease: @trezor/protobuf 1.2.3-beta.2 (c965336138)
-   chore: add recommanded checks from eslint-plugin-jest (55d663ca2d)
-   chore: add no-empty as it will became part of recommanded (ef2dd42a5e)
-   feat(protobuf): add t3w1 internal_model (1f8a09066a)
-   feat(suite): images, logic, videos for T3W1 (9ef409912d)
-   feat(protobuf): add message for LoadDevice (950a3d04ef)
-   feat(protobuf): stop skipping LoadDevice (3419d536e4)
-   chore(protobuf): remove `MessageType_` prefix from `MessageType` enum (f620e40f2a)
-   chore(protobuf): build types script as module (324ba30921)
-   fix(protobuf): skip benchmark messages (888774fc19)
-   fix(protobuf): repo path in build script (5396d67588)
-   npm-prerelease: @trezor/protobuf 1.2.3-beta.1 (0b4f84fa7d)
-   chore(protobuf): remove unused definitions (monero, webauthn) (66ae488690)
-   chore(protobuf): build types scripts and patches `js` > `ts` (326260c73c)
-   feat(protobuf): build definitions using protobufjs package (000870b9ab)
-   chore(protobuf): update messages.json (71bbde850b)

# 1.2.1

-   npm-prerelease: @trezor/protobuf 1.2.1-beta.1 (3cfd038db1)
-   chore(connect): update @sinclair/typebox-codegen 0.8.13=>0.10.4 (6cd1fdc8af)
-   chore(deps): update protobuf-js 7.2.6=>7.4.0 (0b937d6fe7)
-   chore(deps): update various patch versions deps (ed3e9bfda7)

# 1.2.0

-   npm-prerelease: @trezor/protobuf 1.1.1-beta.2 (0639cf5bdb)
-   chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
-   npm-prerelease: @trezor/protobuf 1.1.1-beta.1 (8c9f17688c)
-   chore(connect): add basic types support for T3B1 (131c4af73a)
-   feat(protobuf): update protobuf messages for newest version (f8d8a23a85)

# 1.0.14-beta.2

-   chore(suite): unused package dependencies removed (f7907e1496)
-   chore(suite): depcheck enabled (2206f19f2e)

# 1.0.14-beta.1

-   feat(suite): Add adding a new shamir group into an existing setup (e9a0425183)
-   feat(connect): Conway certificates (ab003ce04f)
-   fix(suite): make default 1:1 for adding backup from settings + sync protobuffs (b08d5602fb)

# 1.0.13-beta.1

-   fix(protobuf): deterministic protobuf order in generated file (7bdc2ebecc)
-   fix(scripts): probuf update separate repository + fix situation when someone force-pushes the FW branch (9bdad31d67)
-   fix(protobuf): add git fetch to update script (be86c395ad)
-   feat(connect): update protobuf messages (41bff13bc1)

# 1.0.12

-   chore(protobuf): ability to build protobuf messages from the specified branch (7a6babb818)
-   feat(protobuf): add T3T1 internal_model patch (6a6aea725e)
-   fix(protocol): encoding repeated enum (eaac0b12e8)
-   feat(protocol): encode/decode messageType as string (ae3211ab6a)
-   fix(protobuf): clean up type of `backup_type` in schema (19b7bb27c1)

# 1.0.11

-   chore(connect-explorer-nextra): code cleanup, yarn resolutions (a0e511f1fd)
-   feat(connect-explorer-nextra): params table for viewing schemas (2ed3a5b366)
-   chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
-   chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.0.10

-   fix(protobuf): undefined in messageToJSON (5fa61491e)
-   chore(connect): format json after re-generation (350daea70)
-   feat(connect): update protobuf (450acf915)

# 1.0.9

-   fix: from g:tsx to local tsx in prepublish script (d21d698b2)
-   chore(repo): remove build from protobuf (#11288) (11ffd941e)
-   chore(suite): autofix newlines (c82455e74)
-   chore(protobuf): update with Stellar related messages (22babdcf6)
-   chore(protobuf): add language related messages (36ca33a67)
-   chore(protobuf): recreate messages files (c06b3ee47)
-   chore(protobuf): add eslint --fix to update:protobuf (db58d01b4)
-   fix(protobuf): codegen devdependencies (0632e9ced)
-   chore(repo): ESLint refactor + speed up 70% (#11143) (44fa12a79)
-   chore: update various dependencies (no major update) (fecd89f6e)
-   chore: use global tsx (c21d81f66)
-   chore: update typescript and use global tsc (84bc9b8bd)
-   chore: use global rimraf (5a6759eff)
-   chore: remove test scripts for packages without tests (01e33b714)
-   chore: use global jest (a7e68797d)
-   chore: upgrade jest to 29.7.0 (3c656dc0b)
-   chore: upgrade jest (004938e24)
-   chore: update root dependencies (fac6d99ec)

# 1.0.8

-   fix(suite): navbar positioning (icons) (123882a387)

# 1.0.6

-   chore(protobuf): lint fix (cebcf0256)
-   fix(protobuf): inaccuracy in `TxOutputType` (c78cd9ad2)
-   refactor(connect): validation in API methods (0c035c26a)
-   feat(protobuf): support sint in proto codegen (4fd7808ac)
-   feat(connect): assert message schema in every typedCall (44430e47f)
-   test(protobuf): check equivalence of generated Protobuf messages types (25420c4e8)
-   feat(protobuf): use protobuf messages based on schema chore(protobuf): remove `bytebuffer` dependency fix(connect): use assert, update TS references, lint issue fix(connect-explorer): remove old references in tsconfig fix: update yarn, schema after rebase fix: update yarn lock after rebase (ad086e462)

# 1.0.4

-   chore: remove `bytebuffer` dependency (9b2f9def0)
-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
-   chore(repo): update tsx (53de3e3a8)
-   feat(suite): add Solana support (f2a89b34f)

# 1.0.3

-   feat(connect): add support for solana FW interactions (3d9c703a5)
-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   feat(deps): update deps without breaking changes (7e0584c51)
-   chore(desktop): update deps related to desktop packages (af412cfb5)

# 1.0.2

-   chore(transport): update protobuf (3ecb44412)

# 1.0.1

-   chore(protobuf): update protobuf messages (9a9b193e7)
-   chore(protobuf,protocol): missing fields in package.json (27a5e8ab4)

# 1.0.0

-   chore(protobuf): update messages.json (d4542de357)
-   deps(protobuf): add protobufjs-cli package (b7b5f8005a)
-   chore: introduce protobuf and protocol packages (072042e772)
