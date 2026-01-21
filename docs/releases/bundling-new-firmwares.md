# Bundling new firmware

1. Complete the firmware release process including firmware signing.

1. After the signing FW has been tested by QA in Test Signed environment.

1. Add new firmwares along with each firmware release JSON file from repository [trezor/data](https://github.com/trezor/data) to `packages/connect-data/files/firmware/*` and remove the current ones

1. Remove older binaries so they are not bundled in the desktop app any more, but always keep:
    - the intermediary FW for T1B1 [packages/connect-data/files/firmware/t1b1/trezor-inter-v{1 | 2 | 3}.bin](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-data/files/firmware/t1b1/trezor-inter-v1.bin)
    - and 2.1.1 for T2T1 [packages/connect-data/files/firmware/t2t1/trezor-2.1.1.bin](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-data/files/firmware/t2t1/trezor-2.1.1.bin)

1. Once new firmwares and releases JSON are added and old firmwares are removed you can proceed with running script `yarn tsx packages/connect-data/scripts/generate-firmware-index.ts` that will update the file `packages/connect-data/src/map-releases.ts`.

1. Update `packages/connect-data/files/firmware/release/releases.v1.json` to be mapped to the latest FW. Make sure the sequence is higher than the one in `https://github.com/trezor/trezor-suite-firmware-release/blob/main/releases/production/releases.v1.json` if you want it to be used.

1. If you have completed the points above you should have something like [19be9a7](https://github.com/trezor/trezor-suite/commit/19be9a7521699a6b3c05c220cc8a1850a2c963fa).

1. Test it locally by running `yarn suite:dev` and/or `yarn suite:dev:desktop`

1. Freeze Suite. At this moment you are all good to _Freeze_ and forward to QA. They should be able to test Suite in its wholeness along with the new firmwares.
