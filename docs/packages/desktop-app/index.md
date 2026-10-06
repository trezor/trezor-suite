# Suite Desktop

## Main differences between suite-web and suite-desktop builds

- @trezor/connect API
    - suite-web
        - `@trezor/connect` is part of the JavaScript bundle as a regular module.
        - `@trezor/connect` imports from `@trezor/suite` are replaced to `@trezor/connect-web` see [webpack config](https://github.com/trezor/trezor-suite/blob/develop/suite/web-app/webpack.config.ts)
    - suite-desktop
        - `@trezor/connect` is installed as regular node_module and works in nodejs context (electron main process).
        - `@trezor/connect` files are **not** hosted on the electron renderer context.
        - On the renderer context all `@trezor/connect` methods from are replaced by `@trezor/ipc-proxy` methods. see [index](https://github.com/trezor/trezor-suite/blob/develop/suite/desktop-app/src/Main.tsx)
- Firmware binaries
    - suite-web
        - newest firmware binaries are hosted at `[url]/build/static/connect/data/firmware` and they are downloaded using regular `fetch` API.
    - suite-desktop
        - firmware binaries are bundled as application resources in `bin` directory, full path depends on OS but it could be found on the as level as `app.asar` file, and they are downloaded using `fs.readFile` API. see @trezor/connect-core/src/utils/assets
- Trezor Bridge (trezord)
- Tor
- Bluetooth transport

## App ID and name by environment

| Environment           | App ID                 | App name             | User data dir name            |
| --------------------- | ---------------------- | -------------------- | ----------------------------- |
| production (codesign) | `com.trezor.suite`     | `Trezor Suite`       | `@trezor/suite-desktop`       |
| development (sldev)   | `com.trezor.suite.dev` | `Trezor Suite Dev`   | `@trezor/suite-desktop-dev`   |
| local dev server      | `com.github.Electron`  | `Trezor Suite Local` | `@trezor/suite-desktop-local` |

Suite app name and ID are set by the environment so that Suite uses different user data dir and it's not mixed between environments. The main benefit is that you can switch back and forth between Suite dev versions without losing your remembered production wallets. One disadvantage of this solution is checking of other instance running is not so straightforward between environments.

Same concept (user data separated by environment) works on web out of the box (storage per domain name).

Note that locally built Suite is "development (sldev)", while "local dev server" is for `yarn suite:dev:desktop`.

If you want to run built Suite app with fresh data on every start (similarly to running Suite Web in an anonymous browser window), follow [these instructions](./anon-mode.md).

### Testing the environments

In the codebase, the environment is detected [using these two ENV variables](https://github.com/trezor/trezor-suite/blob/5f77e40c9bd043c34ed84fc5c8b4fb5624b75046/suite/desktop-app-main/webpack/core.webpack.config.ts#L21-L22):

- `NODE_ENV` distinguishes packaged app from local dev server. If set to `production`, it is packaged app:<br />
  **counterintuitively**, both production **and** development packaged app. Else it is local dev server.
- `IS_CODESIGN_BUILD` distinguishes production from development. If set to `true`, it is production app, else development or local dev server.

There isn't much point in manually overriding `NODE_ENV` during development,
but overriding `export IS_CODESIGN_BUILD=true` is particularly useful to simulate behavior specific to production build,
without having to actually perform the binary codesigning.

ℹ️ You can even use `IS_CODESIGN_BUILD=true yarn suite:dev:desktop` if you know what you're doing.
Expect quirky behavior though, because the two ENVs are then inconsistent.

## Debugging

See separate documentation for [debugging](./debugging.md) with debugging instructions.

## Logging

Logging can be enabled by running Suite with the command line flag `--log-level=LEVEL` (replace _LEVEL_ with _error_, _warn_, _info_ or _debug_ based on the logging you wish to display). Additional command line flags can be found [here](./runtime-flags.md).

More technical information can be found on the [Desktop Logger page](../features/desktop-logger.md).

## Shortcuts

Available shortcuts as provided by Electron, or implemented in Electron Main process:

| name            | commands                                             |
| --------------- | ---------------------------------------------------- |
| Reload app      | F5, Ctrl+R, Cmd+R                                    |
| Hard Reload app | Shift+F5, Shift+Ctrl+R, Shift+Cmd+R                  |
| Restart app     | Alt+F5, Option+F5, Alt+Shift+R, Option+Shift+R       |
| Open DevTools   | F12, Cmd+Shift+I,Ctrl+Shift+I, Cmd+Alt+I, Ctrl+Alt+I |

Note that opening DevTools is restricted on production: works only when Debug settings are enabled, or using the `--open-devtools` runtime flag.

## Runtime flags

See separate documentation for [runtime-flags](./runtime-flags.md) with runtime flags.

## Extract application

#### MacOS

`npx @electron/asar extract ./Trezor\ Suite.app/Contents/Resources/app.asar ./decompiled`

#### NixOS

Run application to get mount-id like:

```
Trezor-Suite.AppImage installed in ~/.cache/appimage-run/e4f67ae8624c4079527c669d8a3c4bbc1dd00b83b2e1d15807a5863b11bd4f38
```

`npx @electron/asar extract ~/.cache/appimage-run/[mount-id]/resources/app.asar ./decompiled`
