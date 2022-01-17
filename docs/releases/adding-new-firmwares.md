# Adding New Firmwares

In case we are about to release both Suite and firmwares we want to add the signed binaries during the Freeze so QA has the whole thing to test.

Binaries and release definitions are stored in `packages/connect-common/files/firmware/*` in the same data structure as they were in the past (data.trezor.io). They are used by `suite-web` and `suite-desktop` builds.

Package `@trezor/connect-common` is a public NPM package used as dependency of `trezor-connect`.

## Add firmwares

1. Complete the firmware release process including firmware signing.

2. Add firmwares to `packages/connect-common/files/firmware/*` and modify its `releases.json` file. See [90bb548](https://github.com/trezor/trezor-suite/commit/90bb548aec06c9b4816c9a87b2ffa5fcade99f29) for example.

    - To retrieve `fingerprint`, run `trezorctl firmware-update -f {path-to-the-bin}` for each binary separately (you don't have to confirm the update on device unless you want to). Look for `Firmware fingerprint:` row.

3. Remove older binaries so they are not bundled in desktop app any more, but always keep:

    - the intermediary FW for Trezor One [packages/connect-common/files/firmware/1/trezor-inter-1.10.0.bin](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/firmware/1/trezor-inter-1.10.0.bin)
    - and 2.1.1 for model T [packages/connect-common/files/firmware/2/trezor-2.1.1.bin](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/files/firmware/2/trezor-2.1.1.bin)

    See [#4262](https://github.com/trezor/trezor-suite/issues/4262) for explanation.

4. Release new version of `connect-common` package.

    - increase the package version in `packages/connect-common/package.json`
    - update [CHANGELOG](`packages/connect-common/CHANGELOG.md`)
    - publish to NPM (`npm publish --dry-run` to check and then `yarn publish`)

5. Release new Connect with updated `connect-common` package.

    - upgrade the version of `@trezor/connect-common` in `devDependencies` and `extendedDependencies` of `trezor-connect`
    - create [new beta release of Connect](https://github.com/trezor/connect/blob/83af30f73f4cfa7c099c55b2b0f8a103abc299c8/docs/deployment/index.md#beta)

6. Use new Connect in Suite

    - upgrade `trezor-connect` dependency in `packages/suite/package.json`

7. Test it locally (at least by running `yarn build:libs` to rebuild connect files and `yarn suite:dev` to use/copy them).

8. Freeze Suite. At this moment you are all good to _Freeze_ and forward to QA. They should be able to test Suite in its wholeness along with the new firmwares.
