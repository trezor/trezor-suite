/// <reference lib="webworker" />

import TrezorConnect, { DEVICE_EVENT } from '@trezor/connect-webextension';

// Example use of TrezorConnect
// Without this, the import would be removed by Webpack tree-shaking
TrezorConnect.on(DEVICE_EVENT, (event: any) => {
    console.log('DEVICE_EVENT', event);
});
