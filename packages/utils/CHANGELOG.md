# 9.4.1

- npm-prerelease: @trezor/utils 9.4.1-beta.2 (73e565cc0f)
- feat(utils): stringToIntegerInRange (6d9116d6bd)
- chore: prune dead code from suite-common and utils (40754b1f15)
- npm-prerelease: @trezor/utils 9.4.1-beta.1 (f30377d0c0)
- chore: update jest to v30 (6d27a2ca35)
- fix(suite): scroll to selected option in select (9513e1d6de)
- chore: add missing workspace libs (bc6a681c27)
- Revert Feat: update fee rate options regularly (26069e28b5)

# 9.4.0

- npm-prerelease: @trezor/utils 9.4.0-beta.1 (b74682fbb7)

# 9.3.5

- npm-prerelease: @trezor/utils 9.3.5-beta.1 (a43b771a13)
- fix(suite): accept query parameters of custom backend URL (6d4d440e50)
- chore: apply latest prettier (eb758acea9)
- fix(suite): make the explorer build passing (3422038376)
- fix(suite): properly handled deadline and timeout error in getConnectFiatRatesForTimestamp call (#18405) (b62f339e69)

# 9.3.4

- npm-prerelease: @trezor/utils 9.3.4-beta.1 (c81ed9b806)
- feat(ds): Replace lottie colors in Spinner (#18001) (8131c8d039)

# 9.3.3

- npm-prerelease: @trezor/utils 9.3.3-beta.1 (d3cf2f59a9)

# 9.3.2

- npm-prerelease: @trezor/utils 9.3.2-beta.2 (f3abb09122)
- npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)
- chore: more refactorign to remove connect from components (3736dec0a5)

# 9.3.1

- npm-prerelease: @trezor/utils 9.3.1-beta.1 (9b166f8e30)
- fix(repo): fix generate package script (#17300) (a13f269b99)

# 9.3.0

- chore(utils): typedObjectKeys (30f8f4fc59)
- npm-prerelease: @trezor/utils 9.3.0-beta.1 (31f09abf19)
- chore(utils): remove createTimeoutPromise (1087ec266e)
- refactor(utils): add abort to resolveAfter (fecb9a1ccc)
- npm-prerelease: @trezor/utils 9.2.7-beta.2 (4062e3a490)
- npm-prerelease: @trezor/utils 9.2.7-beta.1 (b47005fb74)
- feat: UI facelift of the Affected transactions in the RBF flow (49fd2cba42)
- build(utils): buid for esm (82b3c420ce)
- chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
- feat(utils): include stackTrace in serializeError (fb496b7f19)
- chore(utils): improve `scheduleAction` stack trace (2f01d07c34)
- feat(utils): add serializeError helper (d391fde59d)
- feat(utils): new isWhitelistedHost (95c1640ef6)
- feat(utils): cache with ttl (3c07bce818)
- fix: show h instead of apostrophe in taproot xpub to be consistent with firmware (82e7d84f8c)
- feat(utils): add create zip util (a640272964)
- test(utils): test resolveAfter utils (89fffd0fab)
- feat(utils): add resolveAfter util (5913011798)

# 9.2.6

- npm-prerelease: @trezor/utils 9.2.6-beta.1 (6db4f59670)

# 9.2.5

- npm-prerelease: @trezor/utils 9.2.5-beta.1 (c2b275daae)
- chore: unify types for setTimeout return type to address the NodeJS types leak issue (3f34981e5d)

# 9.2.4

- npm-prerelease: @trezor/utils 9.2.4-beta.1 (75412b5b8c)
- feat(utils): cloneCyclcicObject new util (a65cc86086)

# 9.2.3

- npm-prerelease: @trezor/utils 9.2.3-beta.1 (a70e059c89)

# 9.2.2

- npm-prerelease: @trezor/utils 9.2.2-beta.2 (cedfd2710f)
- fix: additional fixes after jest/recommanded introduction (17f74166ca)
- chore: no-control-regex as it becames recommanded (a8c4a9f34c)
- chore: add recommanded checks from eslint-plugin-jest (55d663ca2d)
- feat(product-components): add utils to detect non-ASCII chars (b1d9fb0d49)
- chore: enable 'prefet-const' ESLint rule (ff5fe34e9e)
- test(utils): add test for isArrayMember (67391fce70)
- chore(utils): move isArrayMember to utils (0be00e9571)
- feat: implement strong randomInt that works in browser without need for polyfill lib (3f4312e834)
- npm-prerelease: @trezor/utils 9.2.2-beta.1 (f3fd24f0d6)
- chore: allow passing of the source of randomness for arrayShuffle (e1fe4b85d4)
- chore: add better naming for random function which is not using strong source of randomness (4f66613553)
- chore: code improvement for arrayShuffle (b52bfba948)
- feat(utils): implement `getMutex` (1835c1731d)
- feat(utils): add `lockId` to `getSynchronize` (ba3580aeeb)
- test(utils): use mocked timers everywhere (621eb66acb)

# 9.2.1

- npm-prerelease: @trezor/utils 9.2.1-beta.1 (dfe200874b)
- fix(utils): correctly removing event listeners (aa2857c305)
- fix(utils): ignore semver labels in version utils (e6077ac3d1)

# 9.2.0

- npm-prerelease: @trezor/utils 9.1.1-beta.3 (f44360e077)
- test(transport): unit tests now fail when eventlisteners memory leak is detected (e602689079)
- feat(utils): new util isFullPath (5c5a14a220)
- chore(utils): introduce new test for PEPE2.0 token (91d819cc9b)
- npm-prerelease: @trezor/utils 9.1.1-beta.2 (e39de7010b)
- chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
- feat(utils): add extractUrlsFromText util (15e03f9cf2)
- npm-prerelease: @trezor/utils 9.1.1-beta.1 (bd593189f6)
- fix(utils): adjust scheduleAction to stricter tests (cc5641f9b8)
- chore(utils): catch leaking listeners in unit tests (7c960dc1ed)
- feat(utils): scheduleAction with attempt failure handler (3e342aaa5b)

# 9.0.25-beta.2

- chore(connect-web): refactor into classes (fc7a45b19d)

# 9.0.25-beta.1

- feat(utils): mergeDeepObject with dot notation (1a5b0e2a0f)
- chore(utils): move Throttler util from blockchain-link to utils (78673bd14c)

# 9.0.24

- chore: BigNumber wrapper (d18ba9a879)
- chore(utils): silence eslint in logs util (9d4324dc24)

# 9.0.23

- chore(connect): move logs to @trezor/utils (28c2b9fe57)
- feat(connect-explorer-nextra): scaffolding (b216443045)
- chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
- chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 9.0.22

- fix: from g:tsx to local tsx in prepublish script (d21d698b2)
- fix(suite): allow for N screens to be shown on suite (not just hardcoded 2) (a0f1b3c4d)
- chore(suite): autofix newlines (c82455e74)
- chore(utils): remove build step requirement from @trezor/utils (#11176) (6cd3d3c81)
- chore(repo): ESLint refactor + speed up 70% (#11143) (44fa12a79)
- chore: use global tsx (c21d81f66)
- chore: update typescript and use global tsc (84bc9b8bd)
- chore: use global rimraf (5a6759eff)
- chore: update prettier (00fe229e0)
- chore: use global jest (a7e68797d)
- chore: upgrade jest to 29.7.0 (3c656dc0b)
- chore: upgrade jest (004938e24)
- chore: update root dependencies (fac6d99ec)
- chore: updated deprecated jest syntax (d3f8043f0)

# 9.0.21

- chore(suite): make better mapping for colors (481c82f56e)

# 9.0.20

- fix(mobile): fix broken formatting on iOS (#10893) (4e5d028907)

# 9.0.19

- fix(utils): correct `getSynchronize` return type (4bc47d794)

# 9.0.18

- fix(suite): fix label drop for RBG transactions (96d12a424)

# 9.0.16

- chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
- chore: update `jest` and related dependency (b8a321c83)
- chore(repo): update tsx (53de3e3a8)

# 9.0.15

- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
- chore(jest): update jest in packages without issues (7458ab20f)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
- chore(connect): improve error message (07d504662)
- feat(deps): update deps without breaking changes (7e0584c51)
- feat(utils): addDashesToSpaces utils (116c3a927)
- chore: update prettier to v3 and reformat (4229fd483)
- chore(desktop): update deps related to desktop packages (af412cfb5)

# 9.0.13

- test(utils): mock timer in createCooldown (99c6394f5)
- fix(utils): versionUtils.isVersionArray strict validation (b61d52c1d)
- fix(utils): createDeferred arg and return type (7ca2fd07c)
- chore(utils): add `getChunkSize` to bufferUtils (2d6341005)

# 9.0.12

- feat(utils): add parseElectrumUrl util (61dce520d)
- feat(utils): add urlToOnion util (37251e0bc)

# 9.0.10

- chore(utils): optimized promiseAllSequence (971fd1d8b)
- feat(utils): add createCooldown util (8294ffaf0)
- fix(suite): deep-clone form values before assignment in reducer to prevent RHF bug (dc8de1075)
- fix(utils): getSynchronize concurrency (a8074a5f6)
- chore(utils): remove unused abortable promise (f5e57314f)
- feat(utils): getSynchronize (0b988ff59)

# 9.0.9

- feat(utils): add TypedEmitter class (12ef63319)

# 9.0.8

- 63bc156f2 fix(suite-common): allow long decimals with localizeNumber
- 19360addf chore: move resolveStaticPath from utils to suite-common

# 9.0.7

- feat(utils): add arrayShuffle util

# 9.0.6

- fix(utils): scheduleAction readonly param
- feat(utils): scheduleAction with variable timeouts

# 9.0.5

- feat(utils): add promiseAllSequence util
- feat(utils): arrayToDictionary strongly typed keys, optional keys
- feat(utils): arrayPartition type predicate support
- feat(utils): arrayToDictionary support multiple

# 9.0.4

- add enum utils
- add `topologicalSort` util
- fix retroactive abort in `scheduleAction`

# 9.0.3

- add `redactUserPathFromString`
- add `xssFilters.inHTML`, `xssFilters.inSingleQuotes`, `xssFilters.inDoubleQuotes`
- add `bufferUtils.reverseBuffer`
- add `scheduleAction`

# 1.0.1

- add `arrayToDictionary`, `arrayDistinct`, `isNotUndefined`, `objectPartition`, `throwError` utilities.
