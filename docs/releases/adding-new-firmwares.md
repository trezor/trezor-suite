# Adding New Firmwares

In case we are about to release both Suite and firmwares we want to add the signed binaries during the Freeze so QA has the whole thing to test.

Binaries and release definitions are stored in `packages/connect-common/files/firmware/*` in the same data structure as they were in the past (data.trezor.io). They are used by `suite-web` and `suite-desktop` builds.

Package `@trezor/connect-common` is a public NPM package used as dependency of `trezor-connect`.

## Add firmwares

1. Complete the firmware release process including firmware signing.

1. Add firmwares to `packages/connect-common/files/firmware/*` and modify its `releases.json` file. See [90bb548](https://github.com/trezor/trezor-suite/commit/90bb548aec06c9b4816c9a87b2ffa5fcade99f29) for example.

    - To retrieve `fingerprint`, run `trezorctl firmware-update -f {path-to-the-bin}` for each binary separately (you don't have to confirm the update on device unless you want to). Look for `Firmware fingerprint:` row.

1. Remove older binaries so they are not bundled in desktop app any more, but always keep:

    - the intermediary FW for Trezor One [packages/connect-common/files/firmware/1/trezor-inter-1.10.0.bin](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/firmware/1/trezor-inter-1.10.0.bin)
    - and 2.1.1 for model T [packages/connect-common/files/firmware/2/trezor-2.1.1.bin](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/firmware/2/trezor-2.1.1.bin)

    See [#4262](https://github.com/trezor/trezor-suite/issues/4262) for explanation.

1. Release new version of `connect-common` package.

    - [follow instructions](./npm-packages.md) how to publish @trezor package to npm registry.

1. Release new Connect with updated `connect-common` package.

    - [follow instructions](./npm-packages.md) how to release and implement new version of `trezor-connect` in Suite.

1. Test it locally (at least by running `yarn build:libs` to rebuild connect files and `yarn suite:dev` to use/copy them).

1. Freeze Suite. At this moment you are all good to _Freeze_ and forward to QA. They should be able to test Suite in its wholeness along with the new firmwares.
