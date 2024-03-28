# 9.0.23

-   chore(connect): move logs to @trezor/utils (28c2b9fe57)
-   feat(connect-explorer-nextra): scaffolding (b216443045)
-   chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
-   chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 9.0.22

-   fix: from g:tsx to local tsx in prepublish script (d21d698b2)
-   fix(suite): allow for N screens to be shown on suite (not just hardcoded 2) (a0f1b3c4d)
-   chore(suite): autofix newlines (c82455e74)
-   chore(utils): remove build step requirement from @trezor/utils (#11176) (6cd3d3c81)
-   chore(repo): ESLint refactor + speed up 70% (#11143) (44fa12a79)
-   chore: use global tsx (c21d81f66)
-   chore: update typescript and use global tsc (84bc9b8bd)
-   chore: use global rimraf (5a6759eff)
-   chore: update prettier (00fe229e0)
-   chore: use global jest (a7e68797d)
-   chore: upgrade jest to 29.7.0 (3c656dc0b)
-   chore: upgrade jest (004938e24)
-   chore: update root dependencies (fac6d99ec)
-   chore: updated deprecated jest syntax (d3f8043f0)

# 9.0.21

-   chore(suite): make better mapping for colors (481c82f56e)

# 9.0.20

-   fix(mobile): fix broken formatting on iOS (#10893) (4e5d028907)

# 9.0.19

-   fix(utils): correct `getSynchronize` return type (4bc47d794)

# 9.0.18

-   fix(suite): fix label drop for RBG transactions (96d12a424)

# 9.0.16

-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
-   chore: update `jest` and related dependency (b8a321c83)
-   chore(repo): update tsx (53de3e3a8)

# 9.0.15

-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   chore(jest): update jest in packages without issues (7458ab20f)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   chore(connect): improve error message (07d504662)
-   feat(deps): update deps without breaking changes (7e0584c51)
-   feat(utils): addDashesToSpaces utils (116c3a927)
-   chore: update prettier to v3 and reformat (4229fd483)
-   chore(desktop): update deps related to desktop packages (af412cfb5)

# 9.0.13

-   test(utils): mock timer in createCooldown (99c6394f5)
-   fix(utils): versionUtils.isVersionArray strict validation (b61d52c1d)
-   fix(utils): createDeferred arg and return type (7ca2fd07c)
-   chore(utils): add `getChunkSize` to bufferUtils (2d6341005)

# 9.0.12

-   feat(utils): add parseElectrumUrl util (61dce520d)
-   feat(utils): add urlToOnion util (37251e0bc)

# 9.0.10

-   chore(utils): optimized promiseAllSequence (971fd1d8b)
-   feat(utils): add createCooldown util (8294ffaf0)
-   fix(suite): deep-clone form values before assignment in reducer to prevent RHF bug (dc8de1075)
-   fix(utils): getSynchronize concurrency (a8074a5f6)
-   chore(utils): remove unused abortable promise (f5e57314f)
-   feat(utils): getSynchronize (0b988ff59)

# 9.0.9

-   feat(utils): add TypedEmitter class (12ef63319)

# 9.0.8

-   63bc156f2 fix(suite-common): allow long decimals with localizeNumber
-   19360addf chore: move resolveStaticPath from utils to suite-common

# 9.0.7

-   feat(utils): add arrayShuffle util

# 9.0.6

-   fix(utils): scheduleAction readonly param
-   feat(utils): scheduleAction with variable timeouts

# 9.0.5

-   feat(utils): add promiseAllSequence util
-   feat(utils): arrayToDictionary strongly typed keys, optional keys
-   feat(utils): arrayPartition type predicate support
-   feat(utils): arrayToDictionary support multiple

# 9.0.4

-   add enum utils
-   add `topologicalSort` util
-   fix retroactive abort in `scheduleAction`

# 9.0.3

-   add `redactUserPathFromString`
-   add `xssFilters.inHTML`, `xssFilters.inSingleQuotes`, `xssFilters.inDoubleQuotes`
-   add `bufferUtils.reverseBuffer`
-   add `scheduleAction`

# 1.0.1

-   add `arrayToDictionary`, `arrayDistinct`, `isNotUndefined`, `objectPartition`, `throwError` utilities.
