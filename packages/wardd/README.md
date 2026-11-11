# WARD daemon

`wardd` owns the encrypted replica, serves device proofs and brokers WARD Manager
attestations. Connect can use it in-process; other hosts can use its authenticated
local WebSocket endpoint.

## Dedicated device service interface

The matching firmware branch `petrsusil/ward-poc-encrypted` supports
`--enable-ward-service-channel`. Its private codec-v1 interface uses a 64-byte
report buffer, independent of the wallet's THP/codec buffers. The streaming parser
handles proofs larger than the former 8,704-byte shared buffer.

Connect wardd directly with `--service-channel`:

```sh
# A single attached USB device.
yarn workspace @trezor/wardd start --service-channel usb

# Select one USB device when several are attached.
yarn workspace @trezor/wardd start --service-channel usb:SERIAL

# Emulator: supply its wallet port; wardd connects to port + 7.
yarn workspace @trezor/wardd start --memory --service-channel udp:127.0.0.1:37904
```

The option also works with the usual `--wm-url`, `--data-dir`, `--token-file` and
other daemon options. Without it, wardd starts with its existing wallet relay
behavior. USB discovery uses class `FF`, subclass `57`, protocol `01`, and claims
only that interface. It does not open the wallet session or reset an already
active USB configuration. Startup fails if the service cannot be opened or its
protocol is incompatible. A later connection failure stops wardd with a nonzero
exit code; application exchanges are not retried automatically.

SIGINT/SIGTERM releases the service binding before closing the replica and server.
The next wallet workflow can then use wallet fallback. For an external adapter,
`tools/ward_service.py` remains available in the firmware checkout; run either the
native connection or that adapter for a device.

This endpoint uses `serviceSync` and `servicePublish` plus proof/node requests.
The wallet-side host recognizes `service_bound` and `service_applied`, so it does
not require a local replica or publish a service-owned candidate again. Separate
queues allow reverse service calls while the wallet conversation waits on the same
daemon. Graceful service close enables wallet fallback on the next workflow.

Firmware documentation in `docs/misc/ward-service-channel.md` gives build/run
commands, parser limits, memory measurements and the distinction between the
64-byte wire buffer and decoded proof memory.
