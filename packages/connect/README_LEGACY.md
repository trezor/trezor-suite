# @trezor/connect

API version 10.0.0-alpha.1

[![Build Status](https://github.com/trezor/trezor-suite/actions/workflows/test-connect.yml/badge.svg)](https://github.com/trezor/trezor-suite/actions/workflows/test-connect.yml)
[![NPM](https://img.shields.io/npm/v/@trezor/connect.svg)](https://www.npmjs.org/package/@trezor/connect)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/connect/badge.svg?targetFile=package.json)](https://snyk.io/test/github/trezor/trezor-suite?targetFile=packages/connect/package.json)

Trezor Connect is a platform for easy integration of Trezor into 3rd party services, as well as into Trezor Suite. It provides an API with functionality to access public keys, sign transactions and authenticate users.

This package is intended to be used in node.js environment. If you wan't to build a web application please refer to [@trezor/connect-web package](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-web/README.md).

> **Building a web app?** Use [@trezor/connect-web](../connect-web/README.md) instead — it adds browser transport handling and popup-based UI.
>
> **Building a browser extension?** Use [@trezor/connect-webextension](../connect-webextension/README.md) instead — it handles Manifest V3 and service worker constraints.
>
> **Building a React Native app?** Use [@trezor/connect-mobile](../connect-mobile/README.md) instead — it communicates with Trezor Suite via deep links.

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

### Version 10

Version 10 is the current major version and is currently in alpha. See [README.md](./README.md) for up-to-date documentation.

### Version 9

Version 9 is legacy and scheduled to be deprecated. It is no longer the actively developed branch.

Since version 9, a versioned URL strategy was adopted:

- A) The latest release is available on https://connect.trezor.io/9/....
- B) Pinned releases are available at https://connect.trezor.io/9.1.1/.... Note that these endpoints will not receive any further updates including security updates.

Version 9 is available as `@trezor/connect` and `@trezor/connect-web` npm packages.

New major version is released when there are breaking changes on API level. Previous major version will be maintained for 12 months and after this period it can be taken down without notice.

### Version 8 (legacy)

Version 8 is legacy and no longer maintained. Use the npm packages listed above for all current integrations.

## Docs

Interactive API explorer is available on https://connect.trezor.io/

## Examples

A collection of examples on how to implement @trezor/connect in various environments is available in [packages/connect-examples](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples)

## Tests

For integration testing against trezord and emulator refer to [this document](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/e2e/README.md).
