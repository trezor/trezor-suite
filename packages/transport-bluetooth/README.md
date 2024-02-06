# @trezor/transport-bluetooth

### `BluetoothIpc` and `bluetoothIpc` proxy

`@trezor/suite` renderer context

use `bluetoothIpc` proxy

```
import { bluetoothIpc } from '@trezor/transport-bluetooth';

await bluetoothIpc.init();
```

`@trezor/suite-desktop-core` main context module

implement proxy handler and `BluetoothIpc`

```
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
            onRemoveListener: (eventName) => {
                api.removeAllListeners(eventName)
            },
        };
    },
});
```
