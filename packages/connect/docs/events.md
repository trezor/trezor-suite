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

CommonJS

```javascript
var TrezorConnect = require('@trezor/connect').default;
var DEVICE_EVENT = require('@trezor/connect').DEVICE_EVENT;
var DEVICE = require('@trezor/connect').DEVICE;

TrezorConnect.on(DEVICE_EVENT, event => {
    if (event.type === DEVICE.CONNECT) {
    } else if (event.type === DEVICE.DISCONNECT) {
    }
});
```

Inline

```javascript
window.TrezorConnect.on('DEVICE_EVENT', event => {
    if (event.type === 'device-connect') {
    } else if (event.type === 'device-disconnect') {
    }
});
```

## List of published events

`device-connect`
`device-disconnect`
`device-changed`
