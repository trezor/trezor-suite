# @trezor/suite-desktop

Trezor Suite desktop application.

[Official download page](https://suite.trezor.io/)

## Development

```
yarn workspace @trezor/suite-desktop dev
```

[Read more about development and debugging](../../docs/packages/suite-desktop.md)

---

## Build

Prerequisites:

```
yarn && yarn build:libs
yarn message-system-sign-config
```

### Linux

```
yarn workspace @trezor/suite-desktop build:linux
chmod u+x ./packages/suite-desktop/build-electron/Trezor-Suite[version].AppImage
./packages/suite-desktop/build-electron/Trezor-Suite[version].AppImage
```

_Note: On Debian, CentOS and similar distributions you might need to add a `--no-sandbox` flag_

### MacOS

```
yarn workspace @trezor/suite-desktop build:mac
```

Go to `./packages/suite-desktop/build-electron/mac` and open the app

or start the app from terminal:

```
./packages/suite-desktop/build-electron/mac/Trezor\ Suite.app/Contents/MacOS/Trezor\ Suite
```

### Windows

```
yarn workspace @trezor/suite-desktop build:win
```

Go to `./packages/suite-desktop/build-electron` and install the app

### NixOS

_Note: To run TrezorSuite.AppImage you need `appimage-run` package. `nix-env -iA nixos.appimage-run`_

```
yarn workspace @trezor/suite-desktop build:linux
appimage-run ./packages/suite-desktop/build-electron/Trezor-Suite[version].AppImage
```

_Note: If build fails on a missing cache file _(.cache/\*\*/mksquashfsthis)_ additionally run `./nixos-fix-binaries.sh` script and repeat build step._

---

## Remove IndexedDB from local machine

To remove a database, delete following folder:

### Linux

`/home/<user>/.config/@trezor/suite-desktop/IndexedDB`

### macOS

`/Users/<user>/Library/Application Support/@trezor/suite-desktop/IndexedDB`

### Windows

`C:\Users\<user>\AppData\Roaming\@trezor\suite-desktop\IndexedDB`

## Clearing Electron cache

To clear electron cache, delete following folder:

### Linux

`/home/<user>/.config/@trezor/suite-desktop/Cache`

### macOS

`/Users/<user>/Library/ApplicationSupport/@trezor/suite-desktop/Cache`

### Windows

`C:\Users\<user>\AppData\Roaming\@trezor\suite-desktop\Cache`
