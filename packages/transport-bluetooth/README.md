# @trezor/transport-bluetooth

### `BluetoothIpc` and `bluetoothIpc` proxy

`@trezor/suite` renderer context

use `bluetoothIpc` proxy

```typescript
import { bluetoothIpc } from '@trezor/transport-bluetooth';

await bluetoothIpc.init();
```

`@trezor/suite-desktop-core` main context module

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
