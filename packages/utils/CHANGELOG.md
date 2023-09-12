# 9.0.13

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
