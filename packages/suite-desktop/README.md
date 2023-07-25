# @trezor/suite-desktop

Build target for Trezor Suite desktop application.

[Official download page](https://suite.trezor.io/)

> The @trezor/suite-desktop package now serves as a container for the generated/bundled code from the UI and Electron layers, and is responsible for creating the Electron app. No custom code should be added to this package, and no dependencies from the monorepo should be added to the package.json in @trezor/suite-desktop. Doing so would break this system.

Both `dependencies` and `devDependencies` defined in `package.json` of this package are [taken as "external" and copied into bundle without other processing](../suite-desktop-core/scripts/build.ts/#L70).

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

## User data dir

Location of data directory depends on platform:
| Platform | User data dir path |
| --------------------- | ------------------------------------------------------------------- |
| linux | `/home/<user>/.config/` |
| macOS | `~/Library/Application Support/` |
| Windows | `C:\Users\<user>\AppData\Roaming\` |

Name of data directory [depends on environment](../../docs/packages/suite-desktop.md/#app-id-and-name-by-environment) and it's `@trezor/suite-desktop`, `@trezor/suite-desktop-dev` or `@trezor/suite-desktop-local`.

You can open current user data dir directly in Suite debug settings via the link in "Wipe app data" description.

## Remove IndexedDB from local machine

To remove a database, delete following folder:

`<user data dir>/IndexedDB`

## Clearing Electron cache

To clear electron cache, delete following folder:

`<user data dir>/Cache`
