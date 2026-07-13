# Events

> **Note:** In version 10 the event API (`on`, `off`, `removeAllListeners`) is available only in the `@trezor/connect` package (in-process Core, used by Trezor Suite). The thin packages `@trezor/connect-web`, `@trezor/connect-webextension` and `@trezor/connect-mobile` do not expose it — the host Core does not forward events to them.

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

- [device events](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/src/events/device.ts)
- [transport events](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/src/events/transport.ts)
- [blockchain events](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-common/src/events/blockchain.ts)
