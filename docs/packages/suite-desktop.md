# Suite Desktop

## Debugging (VS Code)
Using VS Code configuration files (inside `.vscode`), Suite Desktop can be built and run with a debugger attached to it. Running the `Suite-Desktop: App` task (F5) will execute all required scripts (Webpack development server + Electron build) and launch the Electron app. VS Code will be set in debugging mode, allowing you, for example, to set breakpoints and inspect variables inside the `electron-src` folder (as well as other dependencies). For more on Debugging, please refer to [the VS Code documentation](https://code.visualstudio.com/docs/editor/debugging).

Known issue: The devtools might blank out at launch. If this happens, simply close and re-open the devtools (CTRL + SHIFT + I).

## Logging
Logging can be enabled by running Suite with the command line flag `--log-level=LEVEL` (replace _LEVEL_ with _error_, _warn_, _info_ or _debug_ based on the logging you wish to display). Additional command line flags can be found [below](#runtime-flags).

More technical information can be found on the [Desktop Logger page](../misc/desktop_logger.md).

## Shortcuts
_TODO_

## Runtime flags
Runtime flags can be used when running the Suite Desktop executable, enabling or disabling certain features. For example: `./Trezor-Suite-20.10.1.AppImage --disable-csp` will run with this flag turned on, which will result in the Content Security Policy being disabled.

Available flags:

| name | description |
| --- | --- |
| `--disable-csp` | Disables the Content Security Policy. Necessary for using DevTools in a production build. |
| `--pre-release` | Tells the auto-updater to fetch pre-release updates. |
| `--bridge-dev` | Instruct Bridge to support emulator (starts Bridge with `-e 21324`). |
| `--log-level=NAME` | Set the logging level. Available levels are [name (value)]: error (1), warn (2), info(3), debug (4). All logs with a value equal or lower to the selected log level will be displayed. |
| `--log-write` | Write log to disk |
| `--log-ui` | Enables printing of UI console messages in the console. |
| `--log-file=FILENAME` | Name of the output file (defaults to `log-%ts.txt`) |
| `--log-path=PATHNAME` | Path for the output file (defaults to home or current working directory) |
| `--enable-updater` | Enables the auto updater (if disabled in feature flags) |
| `--disable-updater` | Disables the auto updater (if enabled in feature flags) |

## Mock
Some libraries are difficult to test in development environments, such as the auto-updater. In order to still allow certain interactions with the feature in developments, libraries can be mocked. 

### How to use mocks?
- By default, development builds load mocks.
- Non-development builds can include mocks if the `USE_MOCKS` environment variable is defined.

### How to make a new mock?
1. Open the suite-desktop build script located at `/packages/suite-desktop/scripts/build.js`.
2. Add a new entry to the `mocks` object. The key should be the name of the package, exactly as written when imported. The value should be the path to the mock file to point to (located in `/packages/suite-desktop/src-electron/mocks`).
3. Create the file in `/packages/suite-desktop/src-electron/mocks` and export mocked properties that you have imported across the project.

### Mocked libraries
#### Auto-Updater
The auto-updater has been mocked to simulate similar behavior to the actual library. Unless the command line parameter `--mock-trigger-updater-after=DELAY` is passed, checking for updates will always return `not-available`. This command line parameter requires a value, representing a delay in seconds before making the update available. Using `0` as a value will make the update available immediately. For example, if you wish to make an update available after 1 minute, you will use the parameter as follows: `--mock-trigger-updater-after=60`. Note that his parameter is **ONLY** available with mocks enabled.
