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
