# 10.0.0

- npm-prerelease: @trezor/type-utils 10.0.0-beta.3 (e5e521d706)
- npm-prerelease: @trezor/type-utils 10.0.0-beta.2 (83af1717eb)
- refactor(redux): remove AnyAction (3241a4e196)
- chore: apply prettier changes (7de6f3e919)
- refactor(redux): replace injected selectors with getters (50a126cb11)
- chore(build): centralize library test exclusions (51989aff9c)
- chore(connect): bump version to 10.0.0-beta.1 (aaac2abdea)
- test(type-utils): co-locate object type test (645975263c)
- refactor(suite): simplify router test state overrides (8041924deb)
- test: reduce type-test declaration sizes (6bf13a1b3e)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- chore(type-utils): use PropertyKey in PartialRecord (029285bd31)
- chore(connect): drop redundant publishConfig.type in ESM packages (af2b73c765)
- chore: tsconfig formatting (8c60ca008d)
- chore(connect): support top-level module type in ESM packages (9aebe9cfb0)
- feat(connect): drop CommonJS output across connect ecosystem (b99609bfb8)
- refactor(type-utils): add RequireAtLeastOne, dedupe Keys/KeysOfUnion (a5f1a21975)
- chore: switch public client-side packages to MIT license (7b03152f66)
- chore: remove npmPublishAccess fields from package.json (743d2836de)
- chore: unify package.json publishConfig (216e6de7cc)
- refactor: replace custom eslint script with nx one (ad87eac457)
- chore: add type keyword to all types in imports and exports (47c184a859)
- feat(connect): add .mjs to ESM build (d1bd996295)
- chore(type-utils): unify scattered UnionToIntersection type (782361c2a2)
- chore: remove unused `prepublishOnly` script (0056cb62fa)
- refactor(blockchain-link): use blockbook api types (16a38e1560)
- fix: type + add type test (f28dd0d991)
- chore: add test for createEnsureStorage (d9e440f288)
- chore: bump tsx version (98321960e2)
- npm-prerelease: set all @trezor/connect dependencies to 10.0.0-alpha.1 (ab01b2d889)
- chore(npm): remove prepublish.js (7559f035c3)
- feat(scripts): handle libESM in updateProjectReferences (3d71f2c20a)
- fix: update project deps (b9266f02f9)
- fix(ci): disable Nx tsc cache again (e966a2f5bf)
- build(repository): Connect publishing ESM (a9e189b9a3)
- fix: ensure that the suite sync is turned on even when titles are just updated (6ad9752e26)
- chore: Result type more compatible with Connect (81fea61216)
- chore: improve ResultType (73d8c1f536)
- fix(ci): reenable Nx cache on unit tests & typecheck (73dd977c65)
- fix(ci): temporarily disable Nx cache on unit tests & typecheck (89c4179160)
- chore(npm): start publishing source maps (36f6e9692d)

# 1.2.0

- feat: add propperly typed hasOwn util (972d021017)
- feat(suite): implement Quota Manager reducers, actions and thunks (510aa62c78)
- npm-prerelease: @trezor/type-utils 1.2.0-beta.2 (8501d0af66)
- refactor(connect): new replace-imports.sh script using babel (2128d273f3)
- npm-prerelease: @trezor/type-utils 1.2.0-beta.1 (350c039cc6)
- chore: refactor initEvoluThunk from redux toolkit, to simple Resut<OK,ERR> pattern (939581ee34)
- chore: improve Result<T, Err> Types (8201108523)
- feat(suite): support a delegated key-based retrieval of evolu node without the user confirmation (bfdd7fa1b6)

# 1.1.9

- npm-prerelease: @trezor/type-utils 1.1.9-beta.1 (00a0110ac7)
- feat(wallet-core): implement persistentDeviceData and related thunks (209d0d938c)

# 1.1.8

- npm-prerelease: @trezor/type-utils 1.1.8-beta.2 (1f6de86240)
- chore: make-naming of Sats<->BTC conversion utils sane, add Branded for it (f25d5da9af)
- npm-prerelease: @trezor/type-utils 1.1.8-beta.1 (4d38a22dc2)

# 1.1.7

- npm-prerelease: @trezor/type-utils 1.1.7-beta.1 (df073166ad)
- chore: better error message for exhaustive (a046a64b91)

# 1.1.6

- fix(type-utils): add tsx as dev dependency (76bfc4ae30)
- npm-prerelease: @trezor/type-utils 1.1.6-beta.2 (c3e1508100)
- chore(type-utils): prepare for publishing (79b8797dc9)
- npm-prerelease: @trezor/type-utils 1.1.6-beta.1 (79009c9dd1)
- chore: use exhausetive util for switches instead of manual :never typing (0cec08c6da)
- chore: add exhaustive util (b1a81fd630)
- chore: apply latest prettier (eb758acea9)
- chore(type-utils): only allow known properties in Without (19b10f8c16)

# 1.1.5

- npm-prerelease: @trezor/type-utils 1.1.5-beta.1 (a8b9793a64)
- chore: improve Typescript magic of (credit to @Lemonexe) (fbe8426fb8)
- fix: Add some exclusion to types to better handle remmaped DeviceEvent type to Redux Actions (d9615e6c17)

# 1.1.4

- npm-prerelease: @trezor/type-utils 1.1.4-beta.1 (3c010626c3)

# 1.1.3

- npm-prerelease: @trezor/type-utils 1.1.3-beta.1 (3b29f41596)
- chore: unify types for setTimeout return type to address the NodeJS types leak issue (3f34981e5d)
- chore(suite): organize FW check errors to scenario maps (5de4a6032a)
- chore: Update the Solana types in `@trezor/blockchain-link-types` (d8fe398c07)

# 1.1.2

- npm-prerelease: @trezor/type-utils 1.1.2-beta.1 (5a4c171eaf)

# 1.1.1

- npm-prerelease: @trezor/type-utils 1.1.1-beta.2 (9d8523cbd9)
- chore(utils): move isArrayMember to utils (0be00e9571)
- chore(suite): isArrayMember TS improvement (ff927e1724)
- npm-prerelease: @trezor/type-utils 1.1.1-beta.1 (49887bb666)
- feat(type-utils): isArrayMember (cc33611be9)

# 1.1.0

- fix(type-utils): add build:lib command (3fdffb2578)

# 1.0.6-beta.1

- chore(suite): depcheck enabled (2206f19f2e)

# 1.0.5

- chore: update typescript and use global tsc (84bc9b8bd)
- chore: update prettier (00fe229e0)
- chore: use global jest (a7e68797d)
- chore: upgrade jest to 29.7.0 (3c656dc0b)
- chore: upgrade jest (004938e24)

# 1.0.3

- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f8)
- chore(jest): update jest (7458ab20f0)
- feat(type-utils): add DefinedUnionMember type util
