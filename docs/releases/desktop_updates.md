# Desktop Updates

The desktop build of Trezor Suite uses an auto-updating feature to keep the application up to date with our latest published release.

## Internals

The package `electron-updater` (part of `electron-builder`) is used to manage updates. Information about updates is displayed in our UI and the user can perform actions related to them (trigger update, skip, etc...).

In addition of what `electron-updater` provides us, we check signatures of downloaded files. For this to work, all files uploaded on Github need to have a signature attached with them. The signature will be checked against the SL signing key which is included in the application at build time. The key is located in `packages/suite-desktop-core/build/app-key.asc` and should be updated if the private key is changed.

## Development

How to mock app update configuration for Suite desktop DEV build:

1. In any folder, run:

```
curl https://data.trezor.io/suite/releases/desktop/latest/latest.yml > latest.yml
curl https://data.trezor.io/suite/releases/desktop/latest/latest-mac.yml > latest-mac.yml
curl https://data.trezor.io/suite/releases/desktop/latest/latest-linux.yml > latest-linux.yml
npm i -g http-server
http-server -p 8989
```

2. Edit the files any way you want them.
   Note that "latest" without suffix is for Windows.
3. Go to `packages/suite-desktop-core/src/modules/auto-updater.ts` and replace this constant:

```javascript
const defaultFeedURL = {
    latest: 'http://localhost:8989',
    preRelease: 'http://localhost:8989',
};
```

4. Change this line in the same file:

```javascript
autoUpdater.forceDevUpdateConfig = true;
```

5. Run `yarn suite:dev:desktop`<br />
   But on Linux, run `APPIMAGE=true yarn suite:dev:desktop`

Explanation: to turn on the updater in dev build, `forceDevUpdateConfig` overrides it in `electron-builder`
[AppUpdater](https://github.com/electron-userland/electron-builder/blob/106640dd42a3db08bfbe3a3a32fe333e93ba5c10/packages/electron-updater/src/AppUpdater.ts#L330-L337),
but on Linux you also have to fool [AppImageUpdater](https://github.com/electron-userland/electron-builder/blob/106640dd42a3db08bfbe3a3a32fe333e93ba5c10/packages/electron-updater/src/AppImageUpdater.ts#L18-L28).
