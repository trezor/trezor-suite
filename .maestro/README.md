# Suite Native Maestro tests

This directory contains the Maestro proof of concept for Suite Native Android E2E tests.
Top-level test flows live in `tests/`; running that directory executes the complete Maestro
suite. Reusable JavaScript helpers live in `scripts/` so Maestro does not discover them as
tests.

The first flow mirrors `suite-native/app/e2e/tests/onboardAndConnect.test.ts`; the Detox test
remains enabled as a control.

## Prerequisites

- The Suite Native Android release E2E APK installed on an API 34 emulator.
- Docker, `adb`, Java 17, and Maestro 2.6.1.
- Repository dependencies installed.

The E2E APK uses the `io.trezor.suite.debug` application ID.

## Run locally

Start the pinned trezor-user-env image:

```bash
docker compose -f docker/docker-compose.suite-native-ci.yml up -d trezor-user-env-unix
```

Wait until `http://127.0.0.1:9002` responds, then start the HTTP-to-WebSocket shim from
the repository root:

```bash
yarn tsx .maestro/user-env-rest/server.ts
```

Map the emulator to the host Bridge and run the flow:

```bash
adb reverse tcp:21328 tcp:21328
maestro test .maestro/tests
```

The command runs every flow in `.maestro/tests`. Reusable sub-flows referenced via
`runFlow` live in `subflows/` so Maestro does not discover them as standalone tests.

The initial flow creates a T3T1 emulator running firmware `2-latest`, configures it with the
`mnemonic_all` ("all all all …") test seed — which has populated accounts so discovery finds
balances and history — and starts node-bridge. It then completes app onboarding, enables every
mainnet coin (`subflows/enableAllCoins.yaml`), and waits for the device to connect and discovery
to finish (the portfolio graph on **Home**). Finally it opens the first discovered account and
asserts the account detail screen. The flow stops there: in the E2E build the account has no
balance or history (the portfolio graph is disabled for E2E tests), so the transaction list is
not asserted.

If the flow is interrupted before its teardown script runs, clean up the device explicitly:

```bash
curl -fsS -X POST http://127.0.0.1:9011/cleanup
docker compose -f docker/docker-compose.suite-native-ci.yml down
```

## Screen recording

In CI (`yarn tsx .maestro/run-android-ci.ts`) the emulator screen is recorded while the Maestro
flow runs and saved to `artifacts/maestro/recording.mp4`, uploaded alongside the JUnit report and
screenshots. Because `adb shell screenrecord` caps a single file at 180 seconds, longer runs are
split into `recording-0.mp4`, `recording-1.mp4`, … Recording is best-effort and never fails the
test run.

To capture the same recording locally while a flow runs:

```bash
adb shell screenrecord --bit-rate 4000000 /sdcard/recording.mp4
# run the flow in another shell, then Ctrl+C the screenrecord above
adb pull /sdcard/recording.mp4
```
