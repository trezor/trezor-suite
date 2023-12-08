# Adding New Firmwares

In case we are about to release both Suite and firmwares we want to add the signed binaries during the Freeze so QA has the whole thing to test.

Binaries and release definitions are stored in `packages/connect-common/files/firmware/*` in the same folder structure as they are in [https://github.com/trezor/webwallet-data](https://github.com/trezor/webwallet-data) deployed on [https://data.trezor.io](https://data.trezor.io).

Latest and intermediary firmware binaries are bundled in `suite-desktop` and `suite-web` so the whole onboarding process in desktop app – including FW installation – can be completed offline. It means that only the latest and intermediary Firmware binaries are currently available in Suite (both web and desktop). There is no fallback on [https://data.trezor.io](https://data.trezor.io).

Package `@trezor/connect-common` is a public NPM package used as dependency of `@trezor/connect`.

## Add firmwares

1. Complete the firmware release process including firmware signing.

1. Add firmwares to `packages/connect-common/files/firmware/*` and modify its `releases.json` file. See [Firmware `releases.json` files structure](#firmware-releasesjson-files-structure) for an explanation and [90bb548](https://github.com/trezor/trezor-suite/commit/90bb548aec06c9b4816c9a87b2ffa5fcade99f29) for an example.

1. Remove older binaries so they are not bundled in the desktop app any more, but always keep:

    - the intermediary FW for T1B1 [packages/connect-common/files/firmware/t1b1/trezor-inter-v{1 | 2 | 3}.bin](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/firmware/t1b1/trezor-inter-v1.bin)
    - and 2.1.1 for T2T1 [packages/connect-common/files/firmware/t2t1/trezor-2.1.1.bin](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/firmware/t2t1/trezor-2.1.1.bin)

    See [#4262](https://github.com/trezor/trezor-suite/issues/4262) for explanation.

1. Test it locally (at least by running `yarn build:libs` to rebuild connect files and `yarn suite:dev` to use/copy them).

1. Freeze Suite. At this moment you are all good to _Freeze_ and forward to QA. They should be able to test Suite in its wholeness along with the new firmwares.

## Release for 3rd party users of @trezor/connect

After Suite is released, distribute new firmware by releasing new `@trezor/connect` with an updated `@trezor/connect-common` package.

[Follow instructions](../packages/connect/deployment.md) on how to release a new version of `@trezor/connect`.

---

### Firmware `releases.json` files structure

Firmware `releases.json` files provide data about all available firmware versions and they are used to offer the correct firmware version for the user to update depending on the current version of firmware, bootloader and bridge. See the table below for a description of every param.

Those `releases.json` files are bundled inside `@trezor/connect` in `/static/connect/data` folder. Therefore, `suite-web` takes if from [`https://suite.trezor.io/web/static/connect/data/firmware/{t1b1|t2t1|t2b1}/releases.json?r={timestamp to prevent caching}`](https://suite.trezor.io/web/static/connect/data/firmware/t1b1/releases.json?r=1654786865680) and `suite-desktop` has it on `file:///static/connect/data/firmware/{t1b1|t2t1|t2b1}/releases.json`. Neither the `suite-web` nor the `suite-desktop` take it from [https://data.trezor.io](https://data.trezor.io).

| key                     | type                     | example value                                                                     | description                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| required                | boolean                  | `false`                                                                           | If `true`, user will be forced to update older FW in order to continue using Suite.                                                                                                                                                                 |
| version                 | [number, number, number] | `[1, 11, 1]`                                                                      | Firmware version. Has to be unique.                                                                                                                                                                                                                 |
| bootloader_version      | [number, number, number] | `[1, 11, 0]`                                                                      | Bootloader version. If you are adding new firmwares, ask & verify if there is new BL included (by running it on the device and checking the version shown)                                                                                          |
| min_bridge_version      | [number, number, number] | `[2, 0, 25]`                                                                      | Minimal supported bridge version. See [getInfo](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.ts/#L107) for the usage.                                                                                 |
| min_firmware_version    | [number, number, number] | `[1, 6, 2]`                                                                       | Minimal supported FW version. See [getInfo](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.ts/#L107) for the usage.                                                                                     |
| min_bootloader_version  | [number, number, number] | `[1, 5, 0]`                                                                       | Minimal supported bootloader version. See [getInfo](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/firmwareInfo.ts/#L107) for the usage.                                                                             |
| url                     | string                   | `firmware/t1b1/trezor-t1b1-1.11.1".bin"`                                          | Where to find the binary. Depends on the filename. While adding new FW, keep the structure, just update the version number. `suite-web` downloads binaries from [https://data.trezor.io](https://data.trezor.io), `suite-desktop` has them bundled. |
| url_bitcoinonly         | string                   | `firmware/t1b1/trezor-t1b1-1.11.1-bitcoinonly.bin"`                               | Same as `url`, just for Bitcoin only FW.                                                                                                                                                                                                            |
| fingerprint             | string                   | `"f7c60d0b8c2853afd576867c6562aba5ea52bdc2ce34d0dbb8751f52867c3665"`              | Fingerprint of FW binary. Run `trezorctl firmware-update -f {path-to-the-bin}` to retrieve it (you don't have to confirm the update on device unless you want to). Look for `Firmware fingerprint:` row.                                            |
| fingerprint_bitcoinonly | string                   | `"8e17b95b5d302f203de3a8fe27959efd25e3d5140ac9b5e60412f1b3f624995d"`              | Same as `fingerprint`, just for Bitcoin only FW.                                                                                                                                                                                                    |
| notes                   | string                   | `https://blog.trezor.io/trezor-suite-and-firmware-updates-may-2022-b1af60742291"` | Link to blog with info about the changes in this FW version. You could find it on [internal Notion page for the release](https://www.notion.so/satoshilabs/Release-process-499d6feadc74426fb7b0bffb7effd444) even before it's published.            |
| changelog               | string                   | `"* Remove Lisk.\n* Re-enabled Firo support."`                                    | Short description of main changes, displayed to the user on FW update page. Split lines by `*` sign. You can find it on [internal Notion page for the release](https://www.notion.so/satoshilabs/Release-process-499d6feadc74426fb7b0bffb7effd444). |
