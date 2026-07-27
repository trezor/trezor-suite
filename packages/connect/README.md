# @trezor/connect

API version 10.0.0-alpha.1

[![NPM](https://img.shields.io/npm/v/@trezor/connect.svg)](https://www.npmjs.org/package/@trezor/connect)

Trezor Connect is a platform for easy integration of Trezor into 3rd party services, as well as into Trezor Suite. It provides an API with functionality to access public keys, sign transactions and authenticate users.

This package is intended to be used in node.js environment. If you wan't to build a web application please refer to [@trezor/connect-web package](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-web/README.md).

> **Building a web app?** Use [@trezor/connect-web](https://www.npmjs.com/package/@trezor/connect-web) instead — it adds browser transport handling and popup-based UI.
>
> **Building a browser extension?** Use [@trezor/connect-webextension](https://www.npmjs.com/package/@trezor/connect-webextension) instead — it handles Manifest V3 and service worker constraints.
>
> **Building a React Native app?** Use [@trezor/connect-mobile](https://www.npmjs.com/package/@trezor/connect-mobile) instead — it communicates with Trezor Suite via deep links.

## Installation

Install library as npm module:

```javascript
npm install @trezor/connect
```

or

```javascript
yarn add @trezor/connect
```

## Initialization

ES6

```javascript
import TrezorConnect from '@trezor/connect';
```

For more instructions [refer to this document](https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md)

## Versioning

Version 10 is the current major version and is currently in alpha. New major versions are released when there are breaking API changes. Information about legacy versions can be found in [README_LEGACY.md](./README_LEGACY.md).

## Docs

Interactive API explorer is available on https://connect.trezor.io/

## Examples

A collection of examples on how to implement @trezor/connect in various environments is available in [packages/connect-examples](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples)

## Tests

For integration testing against trezord and emulator refer to [this document](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/e2e/README.md).
