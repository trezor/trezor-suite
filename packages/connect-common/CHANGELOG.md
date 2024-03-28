# 0.0.31

-   fix(connect): webextension save sessions (efed18e4ea)
-   chore(suite): remove goerli (8eb6b271a5)
-   chore: TS project references for build:libs + buildless utxo-lib (#11526) (4d857722fe)
-   chore(connect-common): add firmware binaries 2.7.0 (4c14b45bd6)
-   chore(repo): mostly buildless monorepo (#11464) (637ad88dcf)

# 0.0.30

-   fix(connect): fix build of connect-web (50f35cb2a)

# 0.0.29

-   fix: from g:tsx to local tsx in prepublish script (d21d698b2)
-   fix(connect-common): remove confusing log in AbstractMessageChannel (6d3b60c73)
-   chore(repo): remove build:lib for some simple packages (#11276) (7febd10cf)
-   chore(suite): autofix newlines (c82455e74)
-   chore(utils): remove build step requirement from @trezor/utils (#11176) (6cd3d3c81)
-   fix(connect-web): workaround to work with older content-script (5da505b02)
-   fix(connect-web): reconnect message channel (ee98bb51c)
-   chore(connect-web): refactor popupmanager (af1723e4f)
-   chore: use global tsx (c21d81f66)
-   chore: update typescript and use global tsc (84bc9b8bd)
-   chore: use global rimraf (5a6759eff)
-   chore: use global jest (a7e68797d)
-   chore: upgrade jest to 29.7.0 (3c656dc0b)
-   chore: upgrade jest (004938e24)
-   chore: update root dependencies (fac6d99ec)

# 0.0.28

-   feat(suite): Rename Polygon to Polygon PoS (15a7fd38dc)
-   feat(suite): add Polygon (8c569ca580)
-   chore(connect-common): remove es5 target (fails with TypedEmitter) (0a19580f63)
-   feat(connect-common): store is event emitter, saves permissions and preferred device (db0e9631da)

# 0.0.27

-   feat(connect-common): message channel to allow lazy handshake (79be923e67)

# 0.0.26

-   feat(connect-common): add resolve messages promises to abstract (f9e6f304f)
-   fix(connect-common): when init always create new deferred (70c6c0048)

# 0.0.24

-   feat(connect-common): add more backend urls for solana (29f042470)
-   chore(connect): use `tslib` as dependency in all public libs (606ecc63b)
-   chore: update `jest` and related dependency (b8a321c83)
-   chore(connect-common): update fw binaries to 2.6.4 (398509788)
-   chore(repo): update tsx (53de3e3a8)
-   feat(suite): add Solana support (f2a89b34f)
-   chore(suite): unify support config for eth coins (8776bb79c)
-   chore(suite): add Holesky (175707861)
-   chore(connect-webextension): postMessage useQueue param (4e626e758)

# 0.0.23

-   feat(connect): update solana backend urls (876f60939)
-   chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f)
-   chore(jest): update in connect-common package (5801d2595)
-   chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80)
-   chore(tests): cleanup jets configs (#9869) (7b68bab05)
-   feat(deps): update deps without breaking changes (7e0584c51)
-   feat(connect-common): add T2T1 & T2B1 firmware binaries 2.6.3 bootloader 2.1.4 (9cca8b14f)
-   chore(desktop): update deps related to desktop packages (af412cfb5)

# 0.0.22

-   chore(connect): update coins.json support format (95f270fec)
-   fix(connect-common): fix bootloader version in T2B1 release config (4e698091b)
-   feat(suite): support t2b1 firmware installation (9ef2bf627)
-   chore(connect): fix local storage check (#9547) (b9ac84446)

# 0.0.19

-   chore(connect): update coins.json (trezor-common f2374ae) (3b21c4308)
-   chore(connect-\*): change model to internal model (8edb0a59d)
-   feat(suite): add Sepolia (bc2236c1c)
-   fix(connect-common): put back goerli and etc records for suite/blockchain-link (23783a3ef)
-   chore(connect): remove unused rskip60 field from coininfo (e686e143c)
-   chore(connect): update coins.json (ebcb36d75)

# 0.0.17

-   chore: forgotten renaming to T1/TT (5decd0839)
-   chore: unify trezor names in docs/comments (74290aab3)

# 0.0.15

-   a926901a6 chore: unify T1 and TT names
-   211ac5ef3 chore(coins.json): remove old eth testnets

# 0.0.14

-   chore(connect): move systemInfo to connect-common

# 0.0.13

-   2.6.0 FW

# 0.0.12

-   feat: cardano preview testnet

# 0.0.11

-   refactor storage
    -   `storage.load(key)` -> `storage.load().key`
    -   `storage.save(key, value)` -> `storage.save(state => ({ ...state, key: value }))`
-   versioning of storage

# 0.0.10

### Added

-   2.5.3 FW

### Removed

-   2.5.2 FW

# 0.0.9

### Added

-   1.11.2 & 2.5.2

# 0.0.6

### Added

-   1.11.1 & 2.5.1 FW, (1.11.0 BL)
-   [storage utils](./src/storage) moved from standalone Connect repository
-   [coins.json](./files/coins.json) moved from standalone Connect repository

### Removed

-   1.11.0 & 2.5.0 FW

# 0.0.5

### Added

-   1.11.0 & 2.5.0 FW

# 0.0.4

### Added

-   1.10.5 FW
