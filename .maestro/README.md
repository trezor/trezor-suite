# Suite Native Maestro tests

This directory contains the Maestro proof of concept for Suite Native Android E2E tests.
The first flow mirrors `suite-native/app/e2e/tests/onboardAndConnect.test.ts`; the Detox
test remains enabled as a control.

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
maestro test .maestro/onboard-and-connect.yaml
```

The flow creates a T3T1 emulator running firmware `2-latest`, configures it with the
existing `mnemonic_immune` test seed, starts node-bridge, completes app onboarding, and
checks that the dashboard's **Get started** action is reachable.

If the flow is interrupted before its teardown script runs, clean up the device explicitly:

```bash
curl -fsS -X POST http://127.0.0.1:9011/cleanup
docker compose -f docker/docker-compose.suite-native-ci.yml down
```
