# 10.0.0

- npm-prerelease: @trezor/schema-utils 10.0.0-beta.3 (4ca8e6aa4a)
- npm-prerelease: @trezor/schema-utils 10.0.0-beta.2 (faef8cd8e8)
- fix(packages): add missing repository field to published packages (fa0cff0ddd)
- chore(build): centralize library test exclusions (51989aff9c)
- chore(connect): bump version to 10.0.0-beta.1 (aaac2abdea)
- test(schema-utils): preserve codegen fixture (de0a5732ee)
- test(schema-utils): co-locate tests (809bb625f1)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- fix(schema-utils): refactor KeyofEnumBuilder for TS7 compatibility (4fa5e3fbef)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- fix: resolve noUncheckedIndexedAccess errors across the codebase (e0d8a3bd20)
- fix: widen prettier tsconfig override to match all tsconfig variants (e3eb2cff8c)
- chore(jest): wire JestCustomEnv into all node-env packages (775a942d1f)
- chore(connect): drop redundant publishConfig.type in ESM packages (af2b73c765)
- chore: tsconfig formatting (8c60ca008d)
- test(schema-utils): cover codegen CLI entry point (46e37be174)
- chore(connect): support top-level module type in ESM packages (9aebe9cfb0)
- feat(connect): drop CommonJS output across connect ecosystem (b99609bfb8)
- chore: use type imports (b4caf7f0ac)
- feat(connect): inline devDep types via per-package vendor files (d6fad4c219)
- chore(deps): bump @sinclair/typebox and typebox-codegen (e9d028e88b)
- chore(tests): migrate web packages to @swc/jest (15192f30ee)
- chore(deps): update ws, cbor, long, ts-mixer, @types/w3c-web-usb, postcss-lightningcss (ffae1b63fa)
- chore: switch public client-side packages to MIT license (7b03152f66)
- chore(messages-schema): remove obsolete code (1d897895a7)
- chore: remove npmPublishAccess fields from package.json (743d2836de)
- chore: unify package.json publishConfig (216e6de7cc)
- refactor(schema-utils): codegen with optional file creation and imports (939154c5f2)
- refactor: replace custom eslint script with nx one (ad87eac457)
- chore: add type keyword to all types in imports and exports (47c184a859)
- feat(connect): add .mjs to ESM build (d1bd996295)
- chore(utxo-lib): replace typeforce with typebox (68fdbb289d)
- chore(type-utils): unify scattered UnionToIntersection type (782361c2a2)
- chore: remove unused `prepublishOnly` script (0056cb62fa)
- feat(connect): Replace AssertWeak with Assert in altcoin signing methods (2fa5d40824)
- chore: bump tsx version (98321960e2)
- npm-prerelease: set all @trezor/connect dependencies to 10.0.0-alpha.1 (ab01b2d889)
- chore(npm): remove prepublish.js (7559f035c3)
- build(repository): Connect publishing ESM (a9e189b9a3)
- chore: bump prettier (3e33cbeee4)

# 1.4.0

- npm-prerelease: @trezor/schema-utils 1.3.5-beta.1 (9743a91e0f)
- refactor(connect): new replace-imports.sh script using babel (2128d273f3)

# 1.3.4

- npm-prerelease: @trezor/schema-utils 1.3.4-beta.1 (db7e1e88c0)
- chore(suite): Update tsx (1a1786a1ab)

# 1.3.3

- npm-prerelease: @trezor/schema-utils 1.3.3-beta.1 (446091065a)
- chore: apply latest prettier (eb758acea9)

# 1.3.2

- npm-prerelease: @trezor/schema-utils 1.3.2-beta.1 (ba0d60c261)
- fix(protobuf): improve message type and schema generating (c3f1750def)

# 1.3.1

- npm-prerelease: @trezor/schema-utils 1.3.1-beta.1 (4bb2472d7a)
- fix(repo): fix generate package script (#17300) (a13f269b99)

# 1.3.0

- npm-prerelease: @trezor/schema-utils 1.3.0-beta.1 (5c1f9a994d)
- npm-prerelease: @trezor/schema-utils 1.2.4-beta.1 (e7c2a7c410)
- chore(packages): autofix for sort-imports eslint rule (b96c899ebb)

# 1.2.3

- npm-prerelease: @trezor/schema-utils 1.2.3-beta.1 (9500133ffe)

# 1.2.2

- npm-prerelease: @trezor/schema-utils 1.2.2-beta.1 (0cd41d78cd)
- fix(schema-utils): typescript + typebox package resolution issue (cc22068b2a)

# 1.2.1

- npm-prerelease: @trezor/schema-utils 1.2.1-beta.1 (557eefaa0d)
- chore: remove prettier-eslint dependency, upgrade @typescript-eslint (77576f5bea)
- feat(repo): TS 5.5 (198c91f3c4)
- chore(connect): update @sinclair/typebox-codegen 0.8.13=>0.10.4 (6cd1fdc8af)
- chore(connect): update @sinclair/typebox 0.31.28=>0.33.7 (43ae2975b3)

# 1.2.0

- npm-prerelease: @trezor/schema-utils 1.1.1-beta.1 (2d695ff6e0)
- chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)

# 1.0.5-beta.1

- chore(suite): depcheck enabled (2206f19f2e)
- feat(suite): Add adding a new shamir group into an existing setup (e9a0425183)

# 1.0.4-beta.1

- feat(connect-explorer-nextra): method json params editor (09086d0f1a)

# 1.0.3

- feat(connect-explorer-nextra): complex/nested types handling, refactor (905756a4a5)
- fix(connect-explorer-nextra): base path, disable dark mode, unit test update (5a8c4a9f39)
- feat(connect-explorer-nextra): params table for viewing schemas (2ed3a5b366)
- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.0.2

- fix: from g:tsx to local tsx in prepublish script (d21d698b2)
- chore(repo): remove build:lib for some simple packages (#11276) (7febd10cf)
- chore(suite): autofix newlines (c82455e74)
- feat(connect): add support for StellarClaimClaimableBalanceOp. (51a3e294d)
- fix(protobuf): codegen devdependencies (0632e9ced)
- chore: use global tsx (c21d81f66)
- chore: update typescript and use global tsc (84bc9b8bd)
- chore: use global prettier (a416bc2e6)
- chore: update prettier (00fe229e0)
- chore: use global jest (a7e68797d)
- chore: upgrade jest to 29.7.0 (3c656dc0b)
- chore: upgrade jest (004938e24)
- chore(repo): config cleanups and improvements (TS, Nx...) (#11096) (acf9a7f19)
- chore(schema-utils): add missing tsx dev dependency (459374dc7)

# 1.0.1

- fix(schema-utils): add autocast string -> number (aaa0cd784)
- fix(schema-utils): improve union errors, add weak assert (23b664a89)
- chore(connect-web): reduce bundle size (b41ce8e43)
- chore(schema-utils): prepare for npm release (7e286ad7d)
- docs(schema-utils): add readme (f996d69db)
- refactor(connect): validation in API methods (0c035c26a)
- feat(protobuf): support sint in proto codegen (4fd7808ac)
- feat(connect): assert message schema in every typedCall (44430e47f)
- feat(schema-utils): add better error handling (5280cd619)
- feat(protobuf): use protobuf messages based on schema chore(protobuf): remove `bytebuffer` dependency fix(connect): use assert, update TS references, lint issue fix(connect-explorer): remove old references in tsconfig fix: update yarn, schema after rebase fix: update yarn lock after rebase (ad086e462)
- feat(schema-utils): typebox with custom types and codegen (d6a6aeb3c)

# 1.0.0

- initial release
