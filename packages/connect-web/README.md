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

// set manifest once anywhere in your app index
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

### Dev

It is possible to run local dev server with iframe and popup using:

`yarn workspace @trezor/connect-web dev`

Note: don't forget to visit `https://localhost:8088/` and allow self-signed certificate.

With dev server running, you may initialize TrezorConnect like this

```js
import TrezorConnect from '@trezor/connect-web';

const connectOptions = {
    connectSrc: 'https://localhost:8088/',
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite',
    },
};
```
