# Suite Desktop runtime flags

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
| `--bridge-test`               | Run the internal node-bridge in UDP mode (for use with the device emulator)                                                                                                            |
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
| `--offline-mode`              | Experimental flag to disable all network connection both in Renderer and Main process. Note that it does **not** directly control subprocesses (e.g. tor, coinjoin)                    |
