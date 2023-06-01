# 0.0.17

-   feat: update deps in root package.json (5806d41bc)- chore: unify Trezor T and 1 names (a926901a6)- chore(coins.json): remove old eth testnets (211ac5ef3)- chore(connect): move systemInfo to connect-common (ea9bfc978)- fix(connect-common): path to bitcoin-only firmware binary 2.6.0 (f91dd2b89)- feat(connect-common): add firmware binaries 2.6.0 bootloader 2.1.0 (7fe9d35d0)- chore: update deps (97fd16bb1)- chore(connect-common,devkit): remove downgrade devkit binaries (77d55ec42)- feat(connect-common): add firmware binaries 1.12.1 with new multiple intermediaries (6b36807fc)- feat(connect): support multiple intermediary FWs for model 1 and devkit binaries (80d11452f)- npm-release: @trezor/connect 9.0.7 (d8ba49936)- feat(desktop): update deps (79d702d59)- feat: update typescript (151f364d7)- chore(coinjoin): unify coinjoin naming - small caps in comments (02479ae0b)- feat: cardano preview testnet (4c8e4dccd)- release: @trezor/connect-common 0.0.11 (4ce37d0ce)- chore(npm): fix yarn publish command and prevent using npm (fbceedba2)- chore: Correct November blog post (e56687b65)- feat(connect-common): modify storage (4d6e5144e)- chore: Upgrade to TS 4.9 (#6932) (b23f7b7bf)- release: @trezor/connect-common 0.0.10 (a7b6753d9)- chore(connect-common): add firmware binary 2.5.3 (5a94fbeee)- chore: update coins.json from firmware (2cf5617fb)- chore(connect-popup): remove cookie fallback (3322c7436)- chore(ci): Nx for github validations (#6095) (a446583d5)- chore: upgrade to yarn 3 (#6061) (39c0ed80e)- release: @trezor/connect-common 0.0.9 (e36212c36)- feat(connect-common): add firmware binaries 1.11.2/2.5.2 (71dd11ec7)- chore(docs): describe FW releases.json files (107cb8eef)- chore(suite): get rid off data/ prefix for FW binaries urls (5327c7296)- release: @trezor/connect-common 0.0.8 (32bf733f3)- release: @trezor/connect-common 0.0.7 (65feedf97)- fix: update public packages homepage (deb62e4b0)- chore(connect): update connect readmes (ff615db16)- chore(connect): remove redundant fields from CoinInfo (19bb01ea3)- fix(zcash): update zcash consensus branch to fix TX signing (4501afb18)- chore(connect-common): mention also removing of unused FW versions in changelog (3d16aee2e)- release(connect-common): @trezor/connect-common@0.0.6 (74dd481ec)- chore(connect-common): add firmware binaries 1.11.1/2.5.1 (989da7810)- chore(connect-common): do not publish storage util to NPM (590c85d5b)- chore(connect-common): move storage dir from origin (990bc8d55)- chore(connect-common): migrate files from trezor-connect (6d39a6f09)- Revert release(connect): update @trezor/connect-common@0.0.5 and trezor-connect@8.2.9-beta.1 (34a7cae73)- Revert chore(connect-common): add firmware binaries 1.11.0/2.5.0 (796252d94)- release(connect): update @trezor/connect-common@0.0.5 and trezor-connect@8.2.9-beta.1 (a3c8b6190)- chore(connect-common): add firmware binaries 1.11.0/2.5.0 (a7e078626)- chore: TS refactor to composite project, upgrade to TS 4.5 (#4851) (182439a7f)- chore: Prettier refactor, update, add CI check (#4950) (6253be3f9)- docs: add readme how to publish @trezor package to npm registry (d1c809ec1)- chore(code): refactor eslint for connect packages (ecbfdcae8)- feat(connect-common): add firmware binary 1.10.5 (e64cd01e8)- connect 8.2.3-beta.6 (176eba812)- feat(connect-common): add firmware binaries 1.10.4/2.4.3 (1e1c195e9)- chore(connect-common) bump version 0.0.2 (761195a60)- fix(connect-common): do not publish firmware binaries (e62f97434)- chore(connect-common): add missing firmware binary 2.1.1 (d59b479f6)- chore(connect-common): add repository and bugs links for npm (8fdade881)- chore(connect-common): set initial version for npm 0.0.1 (7217051a2)- chore(connect-common): add firmware binaries 1.10.3/2.4.2 (90bb548ae)- feat(connect-common): add firmware binaries (266b9e5bd)- feat(connect-common): add firmware and bridge releases (d8428bd3f)- chore: create @trezor/connect-common package (ec61d75da)

# 0.0.15

-   a926901a6 chore: unify Trezor T and 1 names
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
