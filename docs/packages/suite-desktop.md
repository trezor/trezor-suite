# Suite Desktop

## Main differences between suite-web and suite-desktop builds

### - @trezor/connect API

- suite-web

    `@trezor/connect` is part of the JavaScript bundle as a regular module.

    `@trezor/connect` imports from `@trezor/suite` are replaced to `@trezor/connect-web` see [webpack config](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-build/configs/web.webpack.config.ts)

- suite-desktop

    `@trezor/connect` is installed as regular node_module and works in nodejs context (electron main process).

    `@trezor/connect` files are **not** hosted on the electron renderer context.

    On the renderer context all `@trezor/connect` methods from are replaced by `@trezor/ipc-proxy` methods. see [index](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop/src/Main.tsx)

### - Firmware binaries

- suite-web

    newest firmware binaries are hosted at `[url]/build/static/connect/data/firmware` and they are downloaded using regular `fetch` API.

- suite-desktop

    firmware binaries are bundled as application resources in `bin` directory, full path depends on OS but it could be found on the as level as `app.asar` file, and they are downloaded using `fs.readFile` API. see @trezor/connect/src/utils/assets

### - Trezor Bridge (trezord)

### - Tor

## App ID and name by environment

| Environment           | App ID                 | App name             | User data dir name            |
| --------------------- | ---------------------- | -------------------- | ----------------------------- |
| production (codesign) | `com.trezor.suite`     | `Trezor Suite`       | `@trezor/suite-desktop`       |
| development (sldev)   | `com.trezor.suite.dev` | `Trezor Suite Dev`   | `@trezor/suite-desktop-dev`   |
| local dev server      | `com.github.Electron`  | `Trezor Suite Local` | `@trezor/suite-desktop-local` |

Suite app name and ID are set by the environment so that Suite uses different user data dir and it's not mixed between environments. The main benefit is that you can switch back and forth between Suite dev versions without losing your remembered production wallets. One disadvantage of this solution is checking of other instance running is not so straightforward between environments.

Same concept (user data separated by environment) works on web out of the box (storage per domain name).

Note that locally built Suite is "development (sldev)", while "local dev server" is for `yarn suite:dev:desktop`.

## Debugging main process (Chrome dev tools)

[Source](https://www.electronjs.org/docs/latest/tutorial/debugging-main-process)

Open chrome and go to `chrome://inspect`

In "Devices" tab make sure that "Discover network targets" is enabled and "localhost:5858" is added (use Configure button)

### dev mode

modify packages/suite-desktop/package.json

```
"dev:run": "electron ."
// to
"dev:run": "electron --inspect=5858 ."
```

### prod mode

Run production build with `--inspect=5858` runtime flag

## Logging

Logging can be enabled by running Suite with the command line flag `--log-level=LEVEL` (replace _LEVEL_ with _error_, _warn_, _info_ or _debug_ based on the logging you wish to display). Additional command line flags can be found [below](#runtime-flags).

More technical information can be found on the [Desktop Logger page](../features/desktop-logger.md).

## Shortcuts

Available shortcuts as provided by Electron:

| name            | commands                                             |
| --------------- | ---------------------------------------------------- |
| Reload app      | F5, Ctrl+R, Cmd+R                                    |
| Hard Reload app | Shift+F5, Shift+Ctrl+R, Shift+Cmd+R                  |
| Restart app     | Alt+F5, Option+F5, Alt+Shift+R, Option+Shift+R       |
| Open DevTools   | F12, Cmd+Shift+I,Ctrl+Shift+I, Cmd+Alt+I, Ctrl+Alt+I |

## Runtime flags

Runtime flags can be used when running the Suite Desktop executable, enabling or disabling certain features. For example: `./Trezor-Suite-22.7.2.AppImage --open-devtools` will run with this flag turned on, which will result in opening DevTools on app launch.
The table below lists only the custom flags defined by Suite. For a full list, see also flags exposed by
[Electron](https://www.electronjs.org/docs/latest/api/command-line-switches) and [Chromium](https://peter.sh/experiments/chromium-command-line-switches/)

Available flags:

| name                          | description                                                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--open-devtools`             | Open DevTools on app launch                                                                                                                                                            |
| `--tor`                       | Start with Tor enabled in settings                                                                                                                                                     |
| `--pre-release`               | Tells the auto-updater to fetch pre-release updates.                                                                                                                                   |
| `--enable-updater`            | Enables the auto updater (if disabled in feature flags)                                                                                                                                |
| `--disable-updater`           | Disables the auto updater (if enabled in feature flags)                                                                                                                                |
| `--updater-url=URL`           | Set custom URL for auto-updater (default is github)                                                                                                                                    |
| `--bridge-legacy`             | Use Legacy (trezord-go) Bridge implementation                                                                                                                                          |
| `--bridge-test`               | Use Legacy (trezord-go) Bridge implementation in Testing mode                                                                                                                          |
| `--bridge-dev`                | Instruct Bridge to support emulator on port 21324                                                                                                                                      |
| `--skip-new-bridge-rollout`   | Always use Node Bridge if applicable to your environment (skip random assignment into test/control group)                                                                              |
| `--bridge-daemon`             | Start Suite in daemon mode (no UI initially)                                                                                                                                           |
| `--bridge-daemon-show-ui`     | Start Suite in daemon mode with UI right away                                                                                                                                          |
| `--log-level=NAME`            | Set the logging level. Available levels are [name (value)]: error (1), warn (2), info(3), debug (4). All logs with a value equal or lower to the selected log level will be displayed. |
| `--log-write`                 | Write log to disk                                                                                                                                                                      |
| `--log-ui`                    | Enables printing of UI console messages in the console.                                                                                                                                |
| `--log-file=FILENAME`         | Name of the output file (defaults to `trezor-suite-log-%tt.txt`)                                                                                                                       |
| `--log-path=PATHNAME`         | Path for the output file (defaults to `/logs` subfolder of Suite data directory or current working directory)                                                                          |
| `--log-no-print`              | Suppress console logs                                                                                                                                                                  |
| `--remove-user-data-on-start` | Removes user data directory on start (used for E2E testing)                                                                                                                            |
| `--expose-connect-ws`         | Expose Connect websocket even on production build                                                                                                                                      |

## Debugging build

#### Linux

`./Trezor-Suite-22.7.2.AppImage --log-level=debug`

#### MacOS

`./Trezor\ Suite.app/Contents/MacOS/Trezor\ Suite --log-level=debug`

#### NixOS

`appimage-run ./Trezor-Suite.AppImage --log-level=debug`

#### Windows

`"C:\Users\[user-name]\AppData\Local\Programs\Trezor Suite\Trezor Suite.exe" --log-level=debug`

## Extract application

#### MacOS

`npx @electron/asar extract ./Trezor\ Suite.app/Contents/Resources/app.asar ./decompiled`

#### NixOS

Run application to get mount-id like:

```
Trezor-Suite.AppImage installed in ~/.cache/appimage-run/e4f67ae8624c4079527c669d8a3c4bbc1dd00b83b2e1d15807a5863b11bd4f38
```

`npx @electron/asar extract ~/.cache/appimage-run/[mount-id]/resources/app.asar ./decompiled`
