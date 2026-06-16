# Maestro flows

This directory contains Maestro flows for Suite Native scenarios that can also be used as Flashlight test commands.

## Portfolio tracker import and transaction tour

The portfolio tracker flow mirrors the account-import e2e coverage, but runs against a real app state. It clears app storage, finishes onboarding, opens the dashboard portfolio-tracker sync entry point, imports BTC, then imports ETH and SOL from My assets, and verifies that the app returns to the dashboard with the portfolio graph visible. The import steps use the develop/debug DEV address buttons from `suite-native/module-accounts-import/src/components/DevXpub.tsx` instead of typing addresses manually.

After the imports, the flow opens each imported account, waits for the transaction list, performs ten short swipes that start inside the lower transaction-list area to land around the 20th transaction, loads more history when the `@transactions/list/more-button` footer is visible, and opens a visible transaction detail using the live `@transactions/item/.*` row id.

The flow intentionally does not pass mocked/preloaded Redux state. If you want Flashlight to exclude onboarding from the measured scenario, move the onboarding block from the flow into Flashlight's "actions before launching the test" setup section and keep the import steps as the custom scenario.

```bash
maestro test .maestro/portfolio-tracker-device/import-btc-dev-xpub.yaml
```

For Flashlight:

```bash
flashlight test --bundleId io.trezor.suite.develop --testCommand "maestro test .maestro/portfolio-tracker-device/import-btc-dev-xpub.yaml" --duration 120000 --resultsFilePath flashlight-portfolio-tracker-import.json
```

## Onboard, connect a Trezor, full discovery (Safe 5)

`onboard-and-connect/onboard-and-connect.yaml` measures a full connected-device scenario against an emulated Trezor Safe 5 (`T3T1`) driven by [trezor-user-env](https://github.com/trezor/trezor-user-env): finish onboarding, enable every mainnet coin via the **Get started** button, run account discovery against the `all all all …` seed, open the first discovered account, and scroll/page its transaction list.

Because Maestro flows run in a GraalJS sandbox that cannot open a WebSocket, the flow talks to trezor-user-env through a small HTTP→WebSocket shim (`user-env-rest/server.ts`) that wraps the same `@trezor/trezor-user-env-link` calls the suite-native Detox harness uses (`suite-native/app/e2e/support/setup.ts`). The device steps live in `onboard-and-connect/setupDevice.js` and `onboard-and-connect/teardownDevice.js`; the per-coin toggles live in `onboard-and-connect/enableAllCoins.yaml`.

### Prerequisites

- An Android emulator running, with the `io.trezor.suite.develop` build installed.
- `adb`, `docker`, [`maestro`](https://maestro.mobile.dev) (tested on 2.6.1), and [`flashlight`](https://docs.flashlight.dev) on your `PATH`.

### One-time-per-run setup

```bash
# 1. Map the emulator's localhost to the host so the in-emulator app reaches
#    the host-run node-bridge (the app uses BridgeTransport on port 21328).
adb reverse tcp:21328 tcp:21328

# 2. Start trezor-user-env. Ports: 9001 = WebSocket control, 9002 = dashboard
#    (readiness probe), 21328 = node-bridge HTTP. All three are required.
docker run -d --name user-env -e SDL_VIDEODRIVER=dummy \
  -p 9001:9001 -p 9002:9002 -p 21328:21328 \
  ghcr.io/trezor/trezor-user-env:latest

# wait until the dashboard answers (a few tens of seconds on first boot)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9002   # -> 200

# 3. Start the HTTP->WebSocket shim (leave it running; defaults to port 9011).
yarn tsx .maestro/user-env-rest/server.ts
```

### Run

```bash
maestro test .maestro/onboard-and-connect/onboard-and-connect.yaml
```

For Flashlight (records FPS/CPU/RAM across the whole scenario):

```bash
flashlight test \
  --bundleId io.trezor.suite.develop \
  --testCommand "maestro test .maestro/onboard-and-connect/onboard-and-connect.yaml" \
  --duration 180000 \
  --iterationCount 1 \
  --resultsFilePath flashlight-onboard-connect.json \
  --record

flashlight report flashlight-onboard-connect.json
```

The flow re-seeds and re-discovers the device on every iteration (`startEmu wipe:true` + teardown), so it is self-contained and safe to repeat — raise `--iterationCount` to 3–5 for averaged numbers once a single run is green. Enabling all coins makes discovery heavy; raise `--duration` if you see truncation.

### Notes

- The flow intentionally stops at the transaction **list** and does not open a transaction **detail**. A null byte (`U+0`) in the TransactionDetail content (e.g. a BTC `OP_RETURN`/token field from the `all` seed) crashes Maestro 2.6.1's view-hierarchy serialization. Scrolling the list is unaffected.
- If a coin in `enableAllCoins.yaml` is not offered on the connected device/build, its `scrollUntilVisible` will time out and abort the flow — remove that coin's two steps.
- Teardown stops the emulator and bridge but leaves the `user-env` container and the shim running for the next run. Clean up with `docker rm -f user-env` and by stopping the shim process when done.
