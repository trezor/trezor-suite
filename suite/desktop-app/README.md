# @suite/desktop-app

Build target for Trezor Suite desktop application.

[Official download page](https://suite.trezor.io/)

> The @suite/desktop-app package now serves as a container for the generated/bundled code from the UI and Electron layers, and is responsible for creating the Electron app. No custom code should be added to this package, and no dependencies from the monorepo should be added to the package.json in @suite/desktop-app. Doing so would break this system.

Both `dependencies` and `devDependencies` defined in `package.json` of this package are [taken as "external" and copied into bundle without other processing](../suite-desktop-core/scripts/build.ts/#L70).

## Development

```
yarn workspace @suite/desktop-app dev
```

[Read more about development and debugging](../../docs/suite/desktop-app/index.md)

---

## Build

Prerequisites:

```
yarn
```

### Linux

```
yarn workspace @suite/desktop-app build:linux
chmod u+x ./suite/desktop-app/build-electron/Trezor-Suite[version].AppImage
./suite/desktop-app/build-electron/Trezor-Suite[version].AppImage
```

_Note: On Debian, CentOS and similar distributions you might need to add a `--no-sandbox` flag_

### MacOS

```
yarn workspace @suite/desktop-app build:mac
```

Go to `./suite/desktop-app/build-electron/mac-arm64` and open the app

or start the app from terminal:

```
./suite/desktop-app/build-electron/mac-arm64/Trezor\ Suite.app/Contents/MacOS/Trezor\ Suite
```

Drop the `-arm64` suffix if you are using an Intel Mac.

### Windows

```
yarn workspace @suite/desktop-app build:win
```

Go to `./suite/desktop-app/build-electron` and install the app

### NixOS

_Note: To run TrezorSuite.AppImage you need `appimage-run` package. `nix-env -iA nixos.appimage-run`_

```
yarn workspace @suite/desktop-app build:linux
appimage-run ./suite/desktop-app/build-electron/Trezor-Suite[version].AppImage
```

_Note: If build fails on a missing cache file *(.cache/\*\*/mksquashfsthis)* additionally run `./nixos-fix-binaries.sh` script and repeat build step._

---

## User data dir

Location of data directory depends on platform:

| Platform | User data dir path                 |
| -------- | ---------------------------------- |
| linux    | `/home/<user>/.config/`            |
| macOS    | `~/Library/Application Support/`   |
| Windows  | `C:\Users\<user>\AppData\Roaming\` |

Name of data directory [depends on environment](../../docs/suite/desktop-app/index.md/#app-id-and-name-by-environment) and it's `@suite/desktop-app`, `@suite/desktop-app-dev` or `@suite/desktop-app-local`.

You can open current user data dir directly in Suite debug settings via the link in "Wipe app data" description.

## Remove IndexedDB from local machine

To remove a database, delete following folder:

`<user data dir>/IndexedDB`

## Clearing Electron cache

To clear electron cache, delete following folder:

`<user data dir>/Cache`
