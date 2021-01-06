# Suite Desktop

## Debugging (VS Code)
Using VS Code configuration files (inside `.vscode`), Suite Desktop can be built and run with a debugger attached to it. Running the `Suite-Desktop: App` task (F5) will execute all required scripts (NextJS server + Electron build) and launch the Electron app. VS Code will be set in debugging mode, allowing you, for example, to set breakpoints and inspect variables inside the `electron-src` folder (as well as other dependencies). For more on Debugging, please refer to [the VS Code documentation](https://code.visualstudio.com/docs/editor/debugging).

Known issue: The devtools might blank out at launch. If this happens, simply close and re-open the devtools (CTRL + SHIFT + I).

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
