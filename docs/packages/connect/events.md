# Events

## Handling events

Once user grants permission for hosting page to communicate with API TrezorConnect will emits events
about device state.
Events can be distinguished by "type" field of event object (TODO structure)
Constants of all types can be imported from package

ES6

```javascript
import TrezorConnect, { DEVICE_EVENT, DEVICE } from '@trezor/connect';

TrezorConnect.on(DEVICE_EVENT, event => {
    if (event.type === DEVICE.CONNECT) {
    } else if (event.type === DEVICE.DISCONNECT) {
    }
});
```

## List of published events

Full list of events is unfortunately beyond the scope of this documentation
but you may refer to the source code for:

-   [device events](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/events/device.ts)
-   [transport events](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/events/transport.ts)
-   [blockchain events](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/events/blockchain.ts)
