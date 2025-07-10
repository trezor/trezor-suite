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
