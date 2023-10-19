# Desktop Updates

The desktop build of Trezor Suite uses an auto-updating feature to keep the application up to date with our latest published release.

## Internals

The package `electron-updater` (part of `electron-builder`) is used to manage updates. Information about updates is displayed in our UI and the user can perform actions related to them (trigger update, skip, etc...).

In addition of what `electron-updater` provides us, we check signatures of downloaded files. For this to work, all files uploaded on Github need to have a signature attached with them. The signature will be checked against the SL signing key which is included in the application at build time. The key is located in `packages/suite-desktop-core/build/app-key.asc` and should be updated if the private key is changed.

## How to publish an update

1. Set the `GH_TOKEN` environment variable to a personal access token with access on the project repo scope. See [Github documentation](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) for more information.
1. Check the version you want to publish is correct.
1. Build all or a platform specific desktop build using `yarn workspace @trezor/suite-desktop run build:desktop` (all) or `yarn workspace @trezor/suite-desktop run build:linux` (platform specific/linux).
1. Publish all builds or a platform specific build using `yarn workspace @trezor/suite-desktop run publish:all` (all) or `yarn workspace @trezor/suite-desktop run publish:linux` (platform specific/linux).
1. Go to the Github Releases page, you should see a drafted release.
1. Update the content (which will be displayed in app as a change log) and publish the release.
