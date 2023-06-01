# 9.0.10

-   feat(utils): getSynchronize (0b988ff59)- feat: update deps in root package.json (5806d41bc)- feat(utils): add TypedEmitter class (12ef63319)- fix(suite-common): allow long decimals with localizeNumber (63bc156f2)- chore: move resolveStaticPath from utils to suite-common (19360addf)- chore: update deps (97fd16bb1)- feat(utils): add arrayShuffle util (bd8e29f53)- fix(utils): scheduleAction readonly param (798553511)- chore(prettier): update formatting after prettier upgrade (3edbe0df6)- feat(desktop): update deps (79d702d59)- feat: update typescript (151f364d7)- feat(utils): scheduleAction with variable timeouts (278ebbea2)- feat(utils): add AbortablePromise util (df449daa2)- feat(utils): add promiseAllSequence util (100015c45)- feat(utils): arrayToDictionary strongly typed keys, optional keys (bd585aa41)- fix: correct extra dependencies for mobile app (#7235) (279580cd8)- feat(utils): arrayPartition type predicate support (e70b4cbc8)- feat(utils): arrayToDictionary support multiple (78e918337)- release: @trezor/utils 9.0.4 (ec96cd28a)- fix(utils): no retroactive abort in scheduleAction (4d57d5dee)- feat(utils): add topologicalSort util (605e12808)- chore(npm): fix yarn publish command and prevent using npm (fbceedba2)- chore: Upgrade to TS 4.9 (#6932) (b23f7b7bf)- feat(utils): add enum utils (59a697aca)- release: @trezor/utils 9.0.3 (5d58e6fa7)- feat(utils): add scheduleAction util (6ca677ff6)- chore(utils): add shared bufferUtils set (3713ba6a0)- chore(lint): disallow shadowing (9751d9e09)- chore(suite): move normalizeVersion from suite pkg to utils pkg (0651e2dbe)- feat(utils): add basic but sufficient XSS filters (2ef349fbf)- refactor(utils): arrayToDictionary numeric keys (cc1de6063)- fix(suite): redact username from application log (644da487b)- chore(ci): Nx for github validations (#6095) (a446583d5)- chore: upgrade to yarn 3 (#6061) (39c0ed80e)- chore: mock store utils with extra (#6067) (2736706f0)- chore(test): unit tests config simplification (#5883) (3913febc3)- release: @trezor/utils 9.0.2 (fe848fc71)- fix: update public packages homepage (deb62e4b0)- chore: update READMEs for miscellaneous packages (b5ca775b8)- chore: update trezor-utils version (b78fd2dd3)- chore(utils): util for parsing hostname (7728574f1)- chore(connect): move @trezor/rollout into connect (daec35c27)- feat: timeoutPromise to @trezor/utils (b2f223451)- feat(utils): improved and typed deep merge util (030b309fd)- feat(utils): add resolveStaticPath method (161aff7c8)- feat: Add Yup, implement a Yup schema for the SignVerify form (#4957) (554a4780f)- chore(docs): unify readmes in packages (d49065dea)- chore: TS refactor to composite project, upgrade to TS 4.5 (#4851) (182439a7f)- chore: Prettier refactor, update, add CI check (#4950) (6253be3f9)- release: @trezor/utils 1.0.1 (ace6ddf7a)- docs: add readme how to publish @trezor package to npm registry (d1c809ec1)- feat(utils): add utils from blockchain-link (1f3f214fe)- chore: move version utils to @trezor/utils (ca6e56cb6)- feat: add validators utilities to utils package (45016a252)- feat: add strings utils from suite to utils package (88def7bf8)- feat: add random funtions to utils package (7fb84864c)- feat: object utilities merge object (7f4e34787)- feat: add file humanReadable function to utils package (f023c8135)- feat: add array partition from suite utils (e463f064b)- feat: unify promise utils (88651b062)- feat: add @trezor/utils package (8da28fcf4)

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
