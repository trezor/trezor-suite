# Maestro flows

Maestro flows for Suite Native scenarios, runnable directly or as Flashlight test commands.

## View the committed reports

Recorded results are committed to the branch — to view them you only need
[`flashlight`](https://docs.flashlight.dev) installed (no emulator, build, or setup).
From the repo root:

```bash
flashlight report flashlight-onboard-connect.json flashlight-reload-onboard-connect.json
```

Opens the web report (FPS / CPU / RAM over time + the synced screen recordings) for the
onboard + connect scenario and its warm reload. Pass a single `.json` to view just one, or
multiple to compare them side by side. The matching `.mp4` files must sit next to the JSONs
(they're committed alongside).

Everything below is only needed to **re-run / generate** measurements.

## Prerequisites

- Android emulator running, with the app build installed (`io.trezor.suite.develop`).
- `adb`, `docker`, [`maestro`](https://maestro.mobile.dev) (tested on 2.6.1), and [`flashlight`](https://docs.flashlight.dev) on `PATH`.

## Setup

### 1. Build & install the develop app on the emulator

```bash
cd suite-native/app
EXPO_PUBLIC_ENVIRONMENT=develop yarn android --variant release   # installs io.trezor.suite.develop
```

Release-like build = representative perf and it can drive the emulated Trezor. (A debug
build + Metro also works for iterating — `yarn start` && `yarn android` — but debug perf
is not representative; point the flow `appId` / `--bundleId` at whichever build you run.)

### 2. Start the device environment

```bash
# Map the emulator's localhost to the host bridge.
adb reverse tcp:21328 tcp:21328

# Start trezor-user-env (ports: 9001 WS, 9002 dashboard, 21328 bridge).
docker run -d --name user-env -e SDL_VIDEODRIVER=dummy \
  -p 9001:9001 -p 9002:9002 -p 21328:21328 \
  ghcr.io/trezor/trezor-user-env:latest
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9002   # -> 200

# HTTP->WebSocket shim — run from the repo root, in its own terminal, leave running.
yarn tsx .maestro/user-env-rest/server.ts
```

To watch the device screen (noVNC), start user-env from a
[trezor-user-env](https://github.com/trezor/trezor-user-env) clone instead — same ports:

```bash
cd ~/path/to/trezor-user-env && ./run.sh -r
# after an emulator starts: open http://127.0.0.1:6080/vnc.html?autoconnect=true&resize=scale
```

Cleanup when done: `docker rm -f user-env` and stop the shim (`kill $(lsof -ti :9011)`).

## Run

### Run all measurements

```bash
.maestro/measure-all.sh
```

Runs, in order, writing `flashlight-*.json` (+ `.mp4`) to the repo root:

| Measurement                          | Output                                   |
| ------------------------------------ | ---------------------------------------- |
| Portfolio tracker (watch-only)       | `flashlight-portfolio.json`              |
| Onboard + connect — scenario         | `flashlight-onboard-connect.json`        |
| Onboard + connect — warm reload      | `flashlight-reload-onboard-connect.json` |
| Passphrase `<variant>` — scenario    | `flashlight-passphrase-<variant>.json`   |
| Passphrase `<variant>` — warm reload | `flashlight-reload-<variant>.json`       |

Subsets (each = scenario + warm reload):

```bash
.maestro/onboard-and-connect/measure.sh       # onboard + connect
.maestro/passphrase-wallet/measure-all.sh     # all passphrase variants
.maestro/passphrase-wallet/measure.sh eth     # one passphrase variant (btc | eth | sol | btc-eth-sol)
```

Run a flow on its own (no measurement) with `maestro test <flow.yaml>`.

Device+discovery scenarios and their warm reload are measured as **separate** Flashlight
runs — the profiler crashes on a mid-measurement app restart/disconnect, so the persist
step (`passphrase-wallet/_persist.yaml`: Home → disconnect → keep view-only) runs
unmeasured between a scenario and its reload. Durations live in the scripts; tighten with
`time maestro test <flow>`.

## Notes

- **Run against a build with your local JS.** The prebuilt `io.trezor.suite.develop` APK
  ships a compiled bundle; source changes need a rebuilt develop APK, or the debug build
  (`io.trezor.suite.debug`) + Metro (`yarn start` && `yarn android` from `suite-native/app`).
  Match the flow `appId` / `--bundleId` to the build. Debug builds are not representative for perf.
- Run exactly one user-env instance and one shim, and close extra dashboard/noVNC browser
  tabs — each adds a WS client that triggers a `bridge-start` and can leave duplicate bridges
  fighting over `21328` (→ discovery stalls / `enumerate` hangs).
- **Device won't connect?** Confirm the bridge sees it:
  `curl -s -X POST http://127.0.0.1:21328/enumerate` should list a device, not `[]`. If `[]`
  while noVNC shows a running Safe 5, restart user-env (one instance), re-add `adb reverse`,
  restart the shim, and retry.
- Flows re-seed the device each run (`/start-emu wipe`), so they're self-contained and repeatable.
- Scenario `--duration`s live in the scripts; if a Flashlight run idles long after the flow
  ends, lower it (`time maestro test <flow>` + ~15s). Very long scenarios (all-coin discovery)
  can exceed Flashlight's atrace capture — measure those with `time` and keep Flashlight for the reload.
