/// <reference lib="webworker" />

import TrezorConnect from '@trezor/connect-webextension';

// Example use of TrezorConnect
// Without this, the import would be removed by Webpack tree-shaking
TrezorConnect.cancel();
