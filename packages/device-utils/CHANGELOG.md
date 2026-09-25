# 10.0.1

- refactor(connect): change requests dispatched (701c26f41b)

# 10.0.0

- npm-prerelease: @trezor/device-utils 10.0.0-beta.3 (6bfcc5bd7c)
- npm-prerelease: @trezor/device-utils 10.0.0-beta.2 (ec14e694fc)
- docs(connect): describe the connect and connect-core packages (9cb0bd68b3)
- feat(connect): store FW translation metadata in KnownDevice.availableTranslations (26f0cd334c)
- fix(packages): add missing repository field to published packages (fa0cff0ddd)
- chore(connect): bump version to 10.0.0-beta.1 (aaac2abdea)
- test(device-utils): preserve fixture (5b59cefbee)
- test(device-utils): co-locate tests (4f9270a7ee)
- feat(suite): Add new color (bbd12cffff)
- chore(connect): publish files as js and ts, not mjs and mts (25f0ed758f)
- chore: bump typescript to 6.0.3 (5d20986f2a)
- feat(connect): expand FW revision check with bootloader-hash-mismatch (85584e963a)
- refactor(device-utils): fold parseDeviceStaticSessionId into parseStaticSessionId (74bd0c7cd6)
- chore(scripts): rename libESM to lib (f046a3fd2b)
- chore(scripts): remove cjs support in replace-imports.sh (a1059cd8a3)
- fix: resolve noUncheckedIndexedAccess errors across the codebase (e0d8a3bd20)
- fix: widen prettier tsconfig override to match all tsconfig variants (e3eb2cff8c)
- chore(connect): drop redundant publishConfig.type in ESM packages (af2b73c765)
- chore: tsconfig formatting (8c60ca008d)
- chore(connect): support top-level module type in ESM packages (9aebe9cfb0)
- feat(connect): drop CommonJS output across connect ecosystem (b99609bfb8)
- refactor(device-utils): introduce canonical StaticSessionId parser/validator/formatter (25d0e0e38b)
- chore(tests): migrate web packages to @swc/jest (15192f30ee)
- chore: switch public client-side packages to MIT license (7b03152f66)
- chore: unify package.json publishConfig (216e6de7cc)
- refactor: replace custom eslint script with nx one (ad87eac457)
- chore: add type keyword to all types in imports and exports (47c184a859)
- feat(connect): add .mjs to ESM build (d1bd996295)
- chore: remove unused `prepublishOnly` script (0056cb62fa)
- fix: Updated unit tests jest configs (6138839e45)
- chore(device-utils): use VersionArray from utils (85fae713f4)
- chore: bump tsx version (98321960e2)
- npm-prerelease: set all @trezor/connect dependencies to 10.0.0-alpha.1 (ab01b2d889)
- chore(npm): remove prepublish.js (7559f035c3)
- feat(scripts): handle libESM in updateProjectReferences (3d71f2c20a)
- build(repository): Connect publishing ESM (a9e189b9a3)
- chore(connect): deduplicate code in firmwareInfo (3f160f1425)
- chore(device-utils): cleanup in firmwareUtils & bootloaderUtils (cfebd24603)
- chore(connect): add getVersionFromFeatures to device-utils (8050a0a6b0)
- chore(device-utils): correct FeaturesNarrowing type (1d81170956)
- chore(npm): start publishing source maps (36f6e9692d)

# 1.2.0

- npm-prerelease: @trezor/device-utils 1.1.5-beta.2 (c8bf86b47e)
- refactor(connect): new replace-imports.sh script using babel (2128d273f3)
- npm-prerelease: @trezor/device-utils 1.1.5-beta.1 (ca75efb7b4)
- fix(suite): Fix types (24e4379636)

# 1.1.4

- npm-prerelease: @trezor/device-utils 1.1.4-beta.1 (abda519429)
- fix(device-utils): removed firmware_revision and url from intermediary type (cfd4c253f6)
- fix(suite): normalize the color of the unacquired device to 1 if undefined as well as acquired device (bafeb394e3)

# 1.1.3

- npm-prerelease: @trezor/device-utils 1.1.3-beta.2 (8657afd6ce)
- fix: circular import from index (wtf) -> DeviceModelInternal (757166c1cd)
- feat(suite): Update images (28789fd3ea)
- npm-prerelease: @trezor/device-utils 1.1.3-beta.1 (02503aa637)
- feat(device-utils): add min_suite_native_version env condition (6349b6d499)
- feat(device-utils): update types to new releases JSON (d1d2f3f104)
- fix(device-utils): change firmware release config types (b116410297)

# 1.1.2

- refactor: from regular to universal firmware-type (9e0c95d36b)
- npm-prerelease: @trezor/device-utils 1.1.2-beta.1 (1f9fcb1c07)
- chore(device-utils): add new firmware release types (90c903824e)

# 1.1.1

- npm-prerelease: @trezor/device-utils 1.1.1-beta.2 (d9e1e9816d)
- chore: prune dead code from suite-common and utils (40754b1f15)
- npm-prerelease: @trezor/device-utils 1.1.1-beta.1 (9f0e37f780)

# 1.1.0

- npm-prerelease: @trezor/device-utils 1.1.0-beta.1 (ae6a53931b)

# 1.0.3

- npm-prerelease: @trezor/device-utils 1.0.3-beta.1 (698a6f0191)
- chore: apply latest prettier (eb758acea9)
- fix(suite): change isOfficialFw to firmwareSource (a888040dbb)
- feat(suite): add customFw to event device-update-firmware and device-connect (91970a2e8e)

# 1.0.2

- npm-prerelease: @trezor/device-utils 1.0.2-beta.1 (608436928d)

# 1.0.1

- fix(device-utils): add tsx as dev dependency (75e2cf82af)
- npm-prerelease: @trezor/device-utils 1.0.1-beta.1 (65fb5950b5)
- chore(device-utils): prepare setup for npm release (e4c32edb37)
- chore: more refactorign to remove connect from components (3736dec0a5)
- chore: move DeviceModelInternal to device-utils (0bcf666672)
- chore(monorepo): remove dependency on connect in components and device-utils (465f40a072)
- chore(packages): autofix for sort-imports eslint rule (b96c899ebb)
- chore(device-utils, suite): add FirmwareVersionString type (94a4485b9f)
- chore: remove glboal nx/workspace link scripts (it shall be run only globally) + resolve ugly igonores for devDependencies in import/no-extraneous-dependencies (abb41f8033)
- chore(device-utils): acccept only PartialDevice as param (4764484da9)
- chore(device-utils): stricter getFirmwareVersion return type (7b5d0b3de0)
- test(device-utils): add unit tests for pickByDeviceModel (cc6a036954)
- feat(device-utils): allow passing null as an option value to pickByDeviceModel (0df7a3b455)
- chore(suite): depcheck enabled (2206f19f2e)
- chore(connect): improve type for releases and pick model (996e96de14)
- feat(connect): basic T3T1 support in types (1bc4569136)
- chore(suite): autofix newlines (c82455e746)
- chore: update typescript and use global tsc (84bc9b8bd3)
- chore: remove test scripts for packages without tests (01e33b7145)
- chore(repo): config cleanups and improvements (TS, Nx...) (#11096) (acf9a7f19c)
- fix(device-utils): fix firmware version array util (d1c3c056fe)
- chore(repo): Upgrade TS 5.3 (#10017) (7277f9d0f8)
- chore(repo): upgrade to TS 5.2 (#9989) (bf8d0fe80f)
- feat(suite-native): device info detail (#9979) (74faef71bd)
- fix(suite): change condition so that btc-only device with universal fw updates to universal (a0c39feaf7)
- feat(device-utils): bitcoin only device helper (184647a939)
- feat(connect): trezor name in device object (a0ecb66390)
- chore(device-utils): use connect Device type (19309be6d7)
- chore(connect): change FirmwareType from type to enum (45bf58946c)
- chore(suite): move getFirmwareType from device-utils to Suite (be17cf8231)
- chore(suite): bitcoin-only fw util (0e26840d8f)
- chore: remove some unecessary build:lib (0a5d8267c4)
- chore(device-utils): remove DeviceModel enum and getDeviceModel (82a0db70db)
- feat(connect): reexport device model internal enum and use (a832fde9ff)
- feat(device-utils): internal_model, display name utility in device-utils (d39278cfd9)
- chore(suite): name model R to model T2B1 (abe486b471)
- chore(deps): unify typescript to 4.9.5 in all packages (66a50fcdd7)
- feat(suite): device model utils + config changes (6baf231ed0)
- chore: build:lib 3 connect deps to fix desktop app build (1f5fa637aa)
- feat(connect): send analytics data from connect core (f7b5e27ce7)
- feat(@trezor/device-utils): move device utils from suite to separate pkg (c755aeecbe)
