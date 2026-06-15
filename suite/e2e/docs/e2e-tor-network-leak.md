# Tor network-leak e2e test

Verifies that, **with Tor enabled, the Trezor Suite desktop app never opens a TCP connection
outside of `localhost`**. When Tor is on, all Suite traffic must be routed through the local Tor
SOCKS proxy; only the separate bundled `tor` process is allowed to reach the internet.

Test file: [`suite/e2e/tests/tor/tor-network-leak.test.ts`](../tests/tor/tor-network-leak.test.ts)

> This test needs a **live internet connection** (to bootstrap Tor) and shells out to `lsof`. It is
> intended to be run **locally on demand**. It is tagged `@desktopOnly @T3T1 @nightlyOnly` and is
> additionally gated behind the `TOR_NETWORK_LEAK_E2E` env var, so it never runs in CI by default.

---

## What the test does

1. Launches the desktop app already Tor-enabled (via the `--tor` switch).
2. Completes onboarding with a seeded device (`mnemonic_all`).
3. Waits until `state.tor.torStatus === 'Enabled'` (Tor finished bootstrapping).
4. Enables **all mainnet networks** and runs account discovery to generate outbound traffic.
5. While the app is active, samples established TCP connections of the Suite's Electron process
   tree (`lsof`) and asserts that **none** has a non-localhost remote endpoint.

---

## Prerequisites

All paths are relative to the repo root.

1. **Docker** running.
2. **trezor-user-env** running: in the `trezor-user-env` repo, run `./run.sh`. Provides bridge +
   emulators.
3. **Local relay server** (suite sync): `yarn workspace @trezor/suite-e2e docker:suite-sync`.
4. **`.env`** in `suite/e2e` created from `.example.env`.
5. **`lsof`** available on the host (Linux/macOS).
6. A **live internet connection** so Tor can bootstrap.

---

## Build steps

The e2e launcher (`suite/e2e/support/electron.ts`) runs the **unpacked** desktop app
(`packages/suite-desktop/dist/app.js`). You must build **both** the main process and the renderer
**in production mode**. Building either in development mode breaks this test (see Troubleshooting).

```bash
# 1. Renderer (electron-renderer) — production. TEST_BUILD mocks the bundled message-system config.
TEST_BUILD=true yarn workspace @trezor/suite-desktop build:ui

# 2. Main process (electron-main) — production. build:app sets NODE_ENV=production internally.
yarn workspace @trezor/suite-desktop build:app
```

When to rebuild:

| You changed code in…                           | Rebuild     |
| ---------------------------------------------- | ----------- |
| `suite`, `suite-desktop-ui` (renderer)         | `build:ui`  |
| `connect`, `suite-desktop-core` (main process) | `build:app` |
| only `suite/e2e/**` (test + support files)     | nothing     |

> Do **not** run `yarn workspace @trezor/suite-desktop dev` (or `dev:local`) — it overwrites
> `packages/suite-desktop/build` with a development renderer that expects the dev server on
> `localhost:8000`.

---

## Running the test

```bash
TOR_NETWORK_LEAK_E2E=1 \
  yarn workspace @trezor/suite-e2e test:e2e:desktop --project=T3T1 tor/tor-network-leak.test.ts
```

Useful env vars / flags:

- `TOR_NETWORK_LEAK_E2E=1` — **required**, otherwise the test is skipped.
- `PRINT_ELECTRON_LOGS=1` — stream the desktop app's main-process logs (Tor bootstrap, bridge, …)
  to the terminal in addition to the log file.
- `--headed` — show the app window.
- `--project=T3T1` — run against a single device model.

---

## Artifacts & debugging

Everything lands in `suite/e2e/test-results/<test-name>/` and is attached to the Playwright report:

- **`electron-logs.txt`** — full main-process log. Look for `tor` / `process-tor` entries, e.g.
  `process-tor: Starting process: - Path: .../build/static/bin/tor/linux-x64/tor` and bootstrap
  progress.
- **`netlog.json`** — Chromium net log (enabled by `electronConf: { netLog: true }`). Open it in
  the [netlog viewer](https://netlog-viewer.appspot.com/). For each request you can see the URL,
  the **source** (renderer vs. a Chromium background service such as Safe Browsing / connectivity
  check / component updater), and the **proxy** used (`DIRECT` = a leak). This is the fastest way to
  attribute an external connection to a specific request.
- **`trace.zip`**, **video**, **screenshots** — standard Playwright artifacts.

The test also prints the collected external connections to stdout (`externalConnections`, each with
`command`, `pid`, `remoteHost`, and the raw `lsof` line).

### Identifying which process owns a connection (manual)

```bash
readlink -f /proc/<pid>/exe   # the binary behind the pid (Suite's electron vs. another app)
pstree -sp <pid>              # ancestry
sudo ss -tp 'dst :443'        # pid/program per socket, no reverse-DNS noise
```

---

## How the pieces fit together

| Concern                      | Where                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Launch app with Tor on       | `--tor` switch → `hasSwitch('tor')` in `suite-desktop-core/src/modules/tor.ts`                       |
| `tor` launch option plumbing | `suite/e2e/support/electron.ts` (`LaunchSuiteParams.tor`), `support/types/index.ts` (`ElectronConf`) |
| Connection sampling          | `suite/e2e/support/networkAnalyzer.ts` (`lsof`, scoped to the app's PID tree)                        |
| Net log capture + attach     | `support/electron.ts` (`netLog` → `--log-net-log`), `support/setup.ts` (attach)                      |
| Terminal log mirror          | `support/electron.ts` (`PRINT_ELECTRON_LOGS`)                                                        |
| Bundled binary path (e2e)    | `suite-desktop-core/src/app.ts` (`global.resourcesPath`), `libs/processes/BaseProcess.ts`            |

### Why `NetworkAnalyzer` is scoped to a PID tree

`lsof` matches every process named `electron`/`node` on the machine — including the editor running
the tests (Cursor/VSCode are Electron apps and talk to Google). The analyzer takes the launched
app's main pid (`electronApp.process().pid`), expands it to the full descendant set via
`ps -e -o pid=,ppid=`, and only counts connections from that tree, so other apps can't be
misreported as Suite leaks.

---

## Troubleshooting

### `ENOENT … electron/resources/bin/tor/linux-x64/tor` (Tor won't start)

The bundled Tor binary lives in `packages/suite-desktop/build/static/bin/tor/<system>/tor` for the
unpacked e2e build, but `global.resourcesPath` only points there when running dev/e2e. Because the
e2e build is compiled with `NODE_ENV=production` (so `isDevEnv` is baked to `false`), `app.ts`
resolves `resourcesPath` for Playwright runs using the `PLAYWRIGHT_RUN` env var (set by the
launcher):

```ts
global.resourcesPath =
    isDevEnv || process.env.PLAYWRIGHT_RUN
        ? path.join(__dirname, '..', 'build', 'static')
        : process.resourcesPath;
```

If you hit the ENOENT: confirm `build:ui` ran (it copies the binaries into `build/static/bin`), then
rebuild `build:app` so the updated `app.js` is used.

### `Failed to load URL: http://localhost:8000/  ERR_CONNECTION_REFUSED`

The **renderer** was built in development mode (it embeds the `webpack-plugin-serve` HMR client that
points at the dev server on `localhost:8000`). Rebuild the renderer in production:

```bash
TEST_BUILD=true yarn workspace @trezor/suite-desktop build:ui
```

…and make sure no `yarn dev` / `dev:local` watcher is overwriting `build/`.

### External connections to Google (`*.1e100.net`, `142.251.x`, `172.217.x`, `173.194.x`)

These are Google IPs on port 443 (HTTPS, not DNS). First confirm the owning process is actually the
Suite (the scoped analyzer now does this automatically). If it is the Suite, open `netlog.json` to
see whether the request went `DIRECT` (a real Tor leak) and what its source is.
