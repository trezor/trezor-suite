# @trezor/transport-bluetooth

### `BluetoothIpc` and `bluetoothIpc` proxy

`@trezor/suite` renderer context

use `bluetoothIpc` proxy

```typescript
import { bluetoothIpc } from '@trezor/transport-bluetooth';

await bluetoothIpc.init();
```

`@suite/desktop-app-main` main context module

implement proxy handler and `BluetoothIpc`

```typescript
import { BluetoothIpc } from '@trezor/transport-bluetooth';

createIpcProxyHandler(ipcMain, 'Bluetooth', {
    onCreateInstance: () => {
        const api = new BluetoothIpc();

        return {
            onRequest: (method, params) => {
                api[method](...params);
            },
            onAddListener: (eventName, listener) => {
                api.on(eventName, listener);
            },
            onRemoveListener: eventName => {
                api.removeAllListeners(eventName);
            },
        };
    },
});
```

### Server build:

`yarn workspace @trezor/transport-bluetooth build:server`

### Server development

Prerequisites: [RUST](https://www.rust-lang.org/tools/install)

### Vscode:

Vscode rust-analyzer extensions:

- install `rust-analyzer` plugin
- (NixOS only) install `nix-env-selector` plugin and [follow readme](https://marketplace.visualstudio.com/items?itemName=arrterian.nix-env-selector) to setup

Vscode `.vscode/settings`:

```json

"rust-analyzer.cargo.sysroot": "discover",
"rust-analyzer.diagnostics.disabled": ["unresolved-proc-macro"],
"rust-analyzer.linkedProjects": ["./packages/transport-bluetooth/Cargo.toml"],
"nixEnvSelector.nixFile": "${workspaceFolder}/packages/transport-bluetooth/shell.nix" // NixOS only

```

### NixOS:

```

nix-shell ./packages/transport-bluetooth/shell.nix

```

### Run server:

```

yarn workspace @trezor/transport-bluetooth dev:server

```

### Run dev UI:

Simple html page to communicate with the server using `TrezorBluetooth` client.

```

yarn workspace @trezor/transport-bluetooth build:ui

```

and open `./packages/transport-bluetooth/build/index.html` in the browser

### E2E tests (Docker, emulated Bluetooth)

Runs the released `trezor-bluetooth` binary (`suite/app-assets/files/bin/bluetooth/linux-x64`) against an emulated
BlueZ + virtual controller (`/dev/vhci`) and a mock Trezor peripheral. See `e2e/docker/mock_trezor.py`.

Prerequisites: Docker, `sudo modprobe hci_vhci` and no other Bluetooth adapter on the host
(`sudo modprobe -r btusb`, or `E2E_ALLOW_FOREIGN_ADAPTERS=1` and accept possible flakiness).

```
yarn workspace @trezor/transport-bluetooth test:e2e
```

Mock peripheral GATT traffic is tunneled to a Trezor emulator UDP port set by `MOCK_UDP_TARGET`
(default `127.0.0.1:21399`, use `127.0.0.1:21324` for the firmware emulator).
Env: `TREZOR_BLUETOOTH_BIN` (binary path), `MOCK_PERIPHERAL_NAME`, `MOCK_LOG_LEVEL`.

The emulator is controlled at runtime through a JSON-RPC over HTTP API (`POST http://127.0.0.1:21398/rpc`,
`MOCK_CONTROL_PORT`), see `e2e/docker/ble_emulator.py` and the typed JS client `e2e/ble-emulator.ts`:
add/remove peripherals (`trezor` or serviceless `generic`), start/stop advertising, change advertisement
data, drop connections, power the central adapter on/off, configure pairing (accept/reject/delay), forget bonds.
