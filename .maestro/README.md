# Maestro flows

Maestro flows for Suite Native scenarios, runnable directly or as Flashlight test commands.

## Prerequisites

- Android emulator running, with the app build installed (`io.trezor.suite.develop`).
- `adb`, `docker`, [`maestro`](https://maestro.mobile.dev) (tested on 2.6.1), and [`flashlight`](https://docs.flashlight.dev) on `PATH`.

## Setup (once per session)

```bash
# Map the emulator's localhost to the host bridge.
adb reverse tcp:21328 tcp:21328

# Start trezor-user-env (ports: 9001 WS, 9002 dashboard, 21328 bridge).
docker run -d --name user-env -e SDL_VIDEODRIVER=dummy \
  -p 9001:9001 -p 9002:9002 -p 21328:21328 \
  ghcr.io/trezor/trezor-user-env:latest

# Wait until ready.
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9002   # -> 200

# Start the HTTP->WebSocket shim (run from the repo root; leave running).
yarn tsx .maestro/user-env-rest/server.ts
```

To watch the device screen, instead of the `docker run` above start user-env from a
[trezor-user-env](https://github.com/trezor/trezor-user-env) clone — same ports, plus noVNC:

```bash
cd ~/path/to/trezor-user-env && ./run.sh -r
# after an emulator starts, open: http://127.0.0.1:6080/vnc.html?autoconnect=true&resize=scale
```

Cleanup when done: `docker rm -f user-env` and stop the shim (`kill $(lsof -ti :9011)`).

## Run

Each flow runs directly with Maestro, or wrapped in Flashlight for a measurement.
Keep `--duration` just above the flow's wall-clock (`time maestro test <flow>`).

### Portfolio tracker (watch-only, no device)

```bash
maestro test .maestro/portfolio-tracker-device/import-btc-dev-xpub.yaml

flashlight test --bundleId io.trezor.suite.develop \
  --testCommand "maestro test .maestro/portfolio-tracker-device/import-btc-dev-xpub.yaml" \
  --duration 120000 --resultsFilePath flashlight-portfolio-tracker-import.json --record
```

### Onboard + connect + full discovery (Safe 5)

```bash
maestro test .maestro/onboard-and-connect/onboard-and-connect.yaml

flashlight test --bundleId io.trezor.suite.develop \
  --testCommand "maestro test .maestro/onboard-and-connect/onboard-and-connect.yaml" \
  --duration 180000 --iterationCount 1 --resultsFilePath flashlight-onboard-connect.json --record
```

### Passphrase wallet + warm reload (Safe 5), per coin set

```bash
# SOL
flashlight test --bundleId io.trezor.suite.develop \
  --testCommand "maestro test .maestro/passphrase-wallet/open-passphrase-sol.yaml" \
  --duration 120000 --iterationCount 1 --resultsFilePath flashlight-passphrase-sol.json --record

# BTC
flashlight test --bundleId io.trezor.suite.develop \
  --testCommand "maestro test .maestro/passphrase-wallet/open-passphrase-btc.yaml" \
  --duration 120000 --iterationCount 1 --resultsFilePath flashlight-passphrase-btc.json --record

# ETH
flashlight test --bundleId io.trezor.suite.develop \
  --testCommand "maestro test .maestro/passphrase-wallet/open-passphrase-eth.yaml" \
  --duration 210000 --iterationCount 1 --resultsFilePath flashlight-passphrase-eth.json --record

# BTC + ETH + SOL
flashlight test --bundleId io.trezor.suite.develop \
  --testCommand "maestro test .maestro/passphrase-wallet/open-passphrase-btc-eth-sol.yaml" \
  --duration 135000 --iterationCount 1 --resultsFilePath flashlight-passphrase-btc-eth-sol.json --record

flashlight report flashlight-passphrase-sol.json
```

## Notes

- **Run against a build with your local JS.** The prebuilt `io.trezor.suite.develop` APK
  ships a compiled bundle; source changes need a rebuilt develop APK, or the debug build
  (`io.trezor.suite.debug`) + Metro (`yarn start` && `yarn android` from `suite-native/app`).
  Match the flow `appId` / `--bundleId` to the build. Debug builds are not representative for perf.
- Run exactly one user-env instance and one shim, or the bridge thrashes and discovery stalls.
- Flows re-seed the device each run (`/start-emu wipe`), so they're self-contained and repeatable.
