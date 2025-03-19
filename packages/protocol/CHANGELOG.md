# 1.2.5

-   npm-prerelease: @trezor/protocol 1.2.5-beta.1 (fe8f4dc278)

# 1.2.4

-   npm-prerelease: @trezor/protocol 1.2.4-beta.2 (5ea9011fdb)
-   npm-release: @trezor/connect 9.5.2-beta.1 (#17529) (3d7542843b)
-   feat(protocol): add `protocol-v2` (7ff4f19571)

# 1.2.3

-   npm-prerelease: @trezor/protocol 1.2.3-beta.1 (71c1cd7ee3)
-   fix(repo): fix generate package script (#17300) (a13f269b99)

# 1.2.2

-   npm-prerelease: @trezor/protocol 1.2.2-beta.1 (7bfeed7f69)
-   chore: remove glboal nx/workspace link scripts (it shall be run only globally) + resolve ugly igonores for devDependencies in import/no-extraneous-dependencies (abb41f8033)

# 1.2.1

-   npm-prerelease: @trezor/protocol 1.2.1-beta.1 (52acb3950c)
-   feat(protocol): add `name` to TransportProtocol (5bf4c0138e)

# 1.2.0

-   npm-prerelease: @trezor/protocol 1.1.1-beta.1 (cdd837ba2b)
-   chore: update txs from 4.7.0 to 4.16.2 (59c856fd0f)
-   chore(protocol): accept Buffer in decode function (858837bb2a)

# 1.0.10-beta.2

-   chore(suite): depcheck enabled (2206f19f2e)

# 1.0.10-beta.1

-   chore(protocol): add a logging message in case of empty buffer (c5dd5749a7)

# 1.0.8

-   feat(protocol): separate chunking from encoding (2f445ba734)
-   feat(protocol): encode/decode messageType as string (ae3211ab6a)
-   chore(protocol): rename decode response fields (1db2916fed)

# 1.0.7

-   chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
-   chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 1.0.6

-   fix: from g:tsx to local tsx in prepublish script (d21d698b2)
-   chore(repo): remove build:lib for some simple packages (#11276) (7febd10cf)
-   chore: use global tsx (c21d81f66)
-   chore: update typescript and use global tsc (84bc9b8bd)
-   chore: use global rimraf (5a6759eff)
-   chore: use global jest (a7e68797d)
-   chore: upgrade jest to 29.7.0 (3c656dc0b)
-   chore: upgrade jest (004938e24)
-   chore: update root dependencies (fac6d99ec)
-   chore(repo): config cleanups and improvements (TS, Nx...) (#11096) (acf9a7f19)

# 1.0.4

-   chore: remove `bytebuffer` dependency (9b2f9def0)
-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
-   feat(transport): allow custom chunkSize in protocol-v1.encode (ba855c980)
-   feat(transport): unify protocol encode/decode functions (b4f08409c)
-   tests(protocols): add unit tests for @trezor/protocols package (5073f4921)
-   chore(repo): update tsx (53de3e3a8)

# 1.0.3

-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   feat(deps): update deps without breaking changes (7e0584c51)
-   chore(desktop): update deps related to desktop packages (af412cfb5)

# 1.0.1

-   chore(protobuf,protocol): missing fields in package.json (27a5e8ab4)

# 1.0.0

-   chore(transport): reorganize protocol related logic (cbabe2e2c5)
-   chore: introduce protobuf and protocol packages (072042e772)
