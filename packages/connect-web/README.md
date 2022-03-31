# @trezor/connect-web

This package is bundled into web implementations.

Contains minimum of code required to:

-   Define `TrezorConnect` API object
-   Create and handle communication between `@trezor/connect-iframe` hosted on `https://connect.trezor.io/*/iframe.html`
-   Create and handle communication and lifecycle of `@trezor/connect-popup` hosted on `https://connect.trezor.io/*/popup.html`

## Usage

```
yarn add @trezor/connect-web
```

```javascript
import TrezorConnect from '@trezor/connect-web';

// set manifest once in your app index
TrezorConnect.manifest({
    appUrl: 'https://my.app.com',
    email: 'developer@email.com',
});

function getAddress() {
    const btcAddress = await TrezorConnect.getAddress({ path: "m/84'/0'/'0'/0/0", coin: 'btc' });
    if (btcAddress.success) {
        return btcAddress.payload; // { address: "xxx" }
    }
}
```

For more examples see [TrezorConnect API documentation](../../packages/connect/docs/api.md)

## NPM publish:

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.
