# Desktop Updates

The desktop build of Trezor Suite uses an auto-updating feature to keep the application up to date with our latest published release.

## Internals

The package `electron-updater` (part of `electron-builder`) is used to manage updates. Information about updates is displayed in our UI and the user can perform actions related to them (trigger update, skip, etc...).

In addition of what `electron-updater` provides us, we check signatures of downloaded files. For this to work, all files uploaded on Github need to have a signature attached with them. The signature will be checked against the SL signing key which is included in the application at build time. The key is located in `packages/suite-desktop-core/build/app-key.asc` and should be updated if the private key is changed.
