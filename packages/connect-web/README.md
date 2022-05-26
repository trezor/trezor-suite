# @trezor/connect-web

[![Build Status](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml/badge.svg)](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml)
[![NPM](https://img.shields.io/npm/v/@trezor/connect-web.svg)](https://www.npmjs.org/package/@trezor/connect-web)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/connect-web/badge.svg?targetFile=package.json)](https://snyk.io/test/github/trezor/trezor-suite?targetFile=packages/connect-web/package.json)

This package is bundled into web implementations.

Contains minimum of code required to:

-   Define `TrezorConnect` API object
-   Create and handle communication between `@trezor/connect-iframe` hosted on `https://connect.trezor.io/<version>/iframe.html`
-   Create and handle communication and lifecycle of `@trezor/connect-popup` hosted on `https://connect.trezor.io/<version>/popup.html`

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

For more examples see [TrezorConnect API documentation](../../docs/packages/connect/methods.md)

## NPM publish:

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.

## Dev

It is possible to run local dev server with iframe and popup using:

`yarn workspace @trezor/connect-web dev`

Note: don't forget to visit `https://localhost:8088/` and allow self-signed certificate. No UI is displayed here.

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
