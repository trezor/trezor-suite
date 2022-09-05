# Suite Desktop

## Main differences between suite-web and suite-desktop builds

### @trezor/connect API

-   suite-web

    `@trezor/connect` is hosted at `[url]/build/static/connect` and injected as an iframe into DOM.

    `@trezor/connect` imports from `@trezor/suite` are replaced to `@trezor/connect-web` see [webpack config](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-build/configs/web.webpack.config.ts)

    `iframe.postMessage/iframe.onmessage` interface is used as communication channel between suite and connect API.

-   suite-desktop

    `@trezor/connect` is installed as regular node_module and works in nodejs context (electron main process).

    `@trezor/connect` files are **not** hosted on the electron renderer context, there is no iframe or /build/static/connect dir.

    On the renderer context all `@trezor/connect` methods from are replaced by `@trezor/ipc-proxy` methods. see [index](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop/src/Main.tsx)

### Firmware binaries

-   suite-web

    newest firmware binaries are hosted at `[url]/build/static/connect/data/firmware` and they are downloaded using regular `fetch` API.

-   suite-desktop

    firmware binaries are bundled as application resources in `bin` directory, full path depends on OS but it could be found on the as level as `app.asar` file, and they are downloaded using `fs.readFile` API. see @trezor/connect/src/utils/assets

### Trezor Bridge (trezord)

### Tor

## Debugging (VS Code)

Using VS Code configuration files (inside `.vscode`), Suite Desktop can be built and run with a debugger attached to it. Running the `Suite-Desktop: App` task (F5) will execute all required scripts (Webpack development server + Electron build) and launch the Electron app. VS Code will be set in debugging mode, allowing you, for example, to set breakpoints and inspect variables inside the `electron-src` folder (as well as other dependencies). For more on Debugging, please refer to [the VS Code documentation](https://code.visualstudio.com/docs/editor/debugging).

Known issue: The devtools might blank out at launch. If this happens, simply close and re-open the devtools (CTRL + SHIFT + I).

## Logging

Logging can be enabled by running Suite with the command line flag `--log-level=LEVEL` (replace _LEVEL_ with _error_, _warn_, _info_ or _debug_ based on the logging you wish to display). Additional command line flags can be found [below](#runtime-flags).

More technical information can be found on the [Desktop Logger page](../features/desktop-logger.md).

## Shortcuts

Available shortcuts:

| name            | commands                                             |
| --------------- | ---------------------------------------------------- |
| Reload app      | F5, Ctrl+R, Cmd+R                                    |
| Hard Reload app | Shift+F5, Shift+Ctrl+R, Shift+Cmd+R                  |
| Restart app     | Alt+F5, Option+F5, Alt+Shift+R, Option+Shift+R       |
| Open DevTools   | F12, Cmd+Shift+I,Ctrl+Shift+I, Cmd+Alt+I, Ctrl+Alt+I |

## Runtime flags

Runtime flags can be used when running the Suite Desktop executable, enabling or disabling certain features. For example: `./Trezor-Suite-22.7.2.AppImage --open-devtools` will run with this flag turned on, which will result in opening DevTools on app launch.

Available flags:

| name                  | description                                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--open-devtools`     | Open DevTools on app launch.                                                                                                                                                           |
| `--pre-release`       | Tells the auto-updater to fetch pre-release updates.                                                                                                                                   |
| `--bridge-dev`        | Instruct Bridge to support emulator (starts Bridge with `-e 21324`).                                                                                                                   |
| `--log-level=NAME`    | Set the logging level. Available levels are [name (value)]: error (1), warn (2), info(3), debug (4). All logs with a value equal or lower to the selected log level will be displayed. |
| `--log-write`         | Write log to disk                                                                                                                                                                      |
| `--log-ui`            | Enables printing of UI console messages in the console.                                                                                                                                |
| `--log-file=FILENAME` | Name of the output file (defaults to `log-%ts.txt`)                                                                                                                                    |
| `--log-path=PATHNAME` | Path for the output file (defaults to home or current working directory)                                                                                                               |
| `--enable-updater`    | Enables the auto updater (if disabled in feature flags)                                                                                                                                |
| `--disable-updater`   | Disables the auto updater (if enabled in feature flags)                                                                                                                                |
| `--updater-url=URL`   | Set custom URL for auto-updater (default is github)                                                                                                                                    |

## Mock

Some libraries are difficult to test in development environments, such as the auto-updater. In order to still allow certain interactions with the feature in developments, libraries can be mocked.

### How to use mocks?

-   By default, development builds load mocks.
-   Non-development builds can include mocks if the `USE_MOCKS` environment variable is defined.

### How to make a new mock?

1. Open the suite-desktop build script located at `/packages/suite-desktop/scripts/build.js`.
1. Add a new entry to the `mocks` object. The key should be the name of the package, exactly as written when imported. The value should be the path to the mock file to point to (located in `/packages/suite-desktop/src/mocks`).
1. Create the file in `/packages/suite-desktop/src/mocks` and export mocked properties that you have imported across the project.

### Mocked libraries

#### Auto-Updater

The auto-updater has been mocked to simulate similar behavior to the actual library. Unless the command line parameter `--mock-trigger-updater-after=DELAY` is passed, checking for updates will always return `not-available`. This command line parameter requires a value, representing a delay in seconds before making the update available. Using `0` as a value will make the update available immediately. For example, if you wish to make an update available after 1 minute, you will use the parameter as follows: `--mock-trigger-updater-after=60`. Note that his parameter is **ONLY** available with mocks enabled.

## Debugging build

#### Linux

`./Trezor-Suite-22.7.2.AppImage --log-level=debug`

#### MacOS

`./Trezor\ Suite.app/Contents/MacOS/Trezor\ Suite --log-level=debug`

#### NixOS

`appimage-run ./Trezor-Suite.AppImage --log-level=debug`

## Extract application

#### MacOS

`npx asar extract ./Trezor\ Suite.app/Contents/Resources/app.asar ./decompiled`

#### NixOS

Run application to get mount-id like:

```
Trezor-Suite.AppImage installed in ~/.cache/appimage-run/e4f67ae8624c4079527c669d8a3c4bbc1dd00b83b2e1d15807a5863b11bd4f38
```

`npx asar extract ~/.cache/appimage-run/[mount-id]/resources/app.asar ./decompiled`
