# Suite Desktop

## Debugging (VS Code)
Using VS Code configuration files (inside `.vscode`), Suite Desktop can be built and run with a debugger attached to it. Running the `Suite-Desktop: App` task (F5) will execute all required scripts (NextJS server + Electron build) and launch the Electron app. VS Code will be set in debugging mode, allowing you, for example, to set breakpoints and inspect variables inside the `electron-src` folder (as well as other dependencies). For more on Debugging, please refer to [the VS Code documentation](https://code.visualstudio.com/docs/editor/debugging).

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
| `--log-no-print` | Disable the log priting in the console. |
| `--log-file=FILENAME` | Name of the output file (defaults to `log-%ts.txt`) |
| `--log-path=PATHNAME` | Path for the output file (defaults to home or current working directory) |
