# Desktop Updates
The desktop build of Trezor Suite uses an auto-updating feature to keep the application up to date with our latest published release.

## Internals
The package `electron-updater` (part of `electron-builder`) is used to manage updates. We 

## How to publish an update
1. Set the `GH_TOKEN` environment variable to a personal access token with access on the project repo scope. See [Github documentation](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token) for more information.
2. Check the version you want to publish is correct.
3. Build all or a platform specific desktop build using `yarn workspace @trezor/suite-desktop run build:desktop` (all) or `yarn workspace @trezor/suite-desktop run build:linux` (platform specific/linux).
4. Publish all builds or a platform specific build using `yarn workspace @trezor/suite-desktop run publish:all` (all) or `yarn workspace @trezor/suite-desktop run publish:linux` (platform specific/linux).
5. Go to the Github Releases page, you should see a drafted release. 
6. Update the content (which will be displayed in app as a change log) and publish the release.
