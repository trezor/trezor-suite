# @trezor/emulator-wrapper

A small UDP proxy that sits between `@trezor/transport-bridge` and the
`trezor-user-env` emulator. By default it is a transparent pass-through —
every datagram is forwarded byte-for-byte in both directions, so the bridge
sees an uninterrupted device.

On top of pass-through it can **intercept and replay** firmware update flows:
the emulator can't actually flash itself, but if we have a recording of the
exchange from a real device, the wrapper can serve the replies the device
would have sent. This lets us drive
`TrezorConnect.firmwareUpdate({ binary })` end-to-end in CI without any
hardware.

## Layout

- `src/emulatorWrapper.ts` — the proxy itself (`start`/`stop`/`getEndpoints`).
- `src/firmwareInterceptor.ts` — cursor-based replay state machine; activated
  via `intercept.firmwareUpdate.fixture` config on the wrapper.
- `src/frameReassembler.ts` — collects 64 B UDP chunks into whole protobuf
  frames per direction.
- `src/recordedFrame.ts` — fixture JSON shape (`RecordingFixture`,
  `RecordedEvent`).
- `fixtures/firmware-update-T2T1-trezor-t2t1-2.9.1.json` — recorded T2T1
  → 2.9.1 firmware update sequence (52 events, ~3 MB of hex).
- `scripts/record-firmware-update.ts` — CLI that records a fresh fixture
  against a physical Trezor.

## Recording a new fixture

You need:

- A physical Trezor of the target model, connected via USB.
- No other process talking to the device (close Suite, kill any running
  Bridge / browser tabs holding the device).
- A `.bin` of the firmware version you want to record an update to. The
  script defaults to the official build that ships with this monorepo (see
  `packages/connect-data/files/firmware/<model>/`), so for the common case
  you don't have to provide one.

```bash
yarn workspace @trezor/emulator-wrapper record:firmware-update --model T2T1
```

Walk through the prompts on the device when the script asks ("Device is
waiting for user input. Press the corresponding button on the physical
device."). Connect handles `ButtonAck` automatically; you only have to press
the physical button.

When the run completes, the JSON is written to `.context/` in the workspace
root. Move it into `packages/emulator-wrapper/fixtures/` to use it in tests.

Full flag list: `yarn workspace @trezor/emulator-wrapper record:firmware-update --help`.

## When to re-record

The fixture is a byte-exact recording of a single device's response to a
single binary. You need to re-record when:

- The firmware update protocol changes on the device side (new message
  types, different chunk sizes, new `ButtonRequest` codes).
- You want to cover a new `(model, fromVersion, toVersion, firmwareType)`
  combination — each combination needs its own fixture.
- The bootloader on the target device changes (different
  `bootloader_version` in the recorded `Features` payload).

A fixture is **tied to one specific binary** — `FirmwareUpload` payloads
in the recording are the bytes of that binary. The interceptor will refuse
to load if you try to point it at a different `.bin`
(`assertFixtureMatchesBinary` checks sha256 against `fixture.meta.firmwareSha256`).

## Using a fixture in a test

```ts
import {
    EmulatorWrapper,
    assertFixtureMatchesBinary,
    type RecordingFixture,
} from '@trezor/emulator-wrapper';

const fixture: RecordingFixture = JSON.parse(
    fs.readFileSync('path/to/fixture.json', 'utf8'),
);
const binary = fs.readFileSync('path/to/firmware.bin');
assertFixtureMatchesBinary(fixture, binary); // throws early on mismatch

const wrapper = new EmulatorWrapper({
    main: { listenPort: 0, targetHost: '127.0.0.1', targetPort: 21324 },
    debug: { listenPort: 0, targetHost: '127.0.0.1', targetPort: 21325 },
    intercept: { firmwareUpdate: { fixture } },
});
await wrapper.start();
const [main] = wrapper.getEndpoints();

// Point TrezorConnect at the wrapper's ephemeral port:
await TrezorConnect.init({
    manifest: { ... },
    transports: [
        new UdpTransport({
            id: 'wrapper-udp',
            target: { host: '127.0.0.1', mainPort: main.listenPort },
        }),
    ],
});
await TrezorConnect.firmwareUpdate({ binary });
```

See `packages/connect/e2e/tests/device/firmwareUpdate.test.ts` for a
complete example.

## Tests

```bash
yarn workspace @trezor/emulator-wrapper test:unit   # in-memory, < 5 s
yarn workspace @trezor/emulator-wrapper test:e2e    # needs trezor-user-env on :9001
```
