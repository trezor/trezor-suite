# @trezor/connect-web

[![Build Status](https://github.com/trezor/trezor-suite/actions/workflows/test-connect.yml/badge.svg)](https://github.com/trezor/trezor-suite/actions/workflows/test-connect.yml)
[![NPM](https://img.shields.io/npm/v/@trezor/connect-web.svg)](https://www.npmjs.org/package/@trezor/connect-web)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/connect-web/badge.svg?targetFile=package.json)](https://snyk.io/test/github/trezor/trezor-suite?targetFile=packages/connect-web/package.json)

This package is bundled into web implementations. User interface is presented in a secure popup window served from `connect.trezor.io/<version>/popup.html`. To try it out, use [@trezor/connect-explorer](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-explorer) hosted [here](https://connect.trezor.io/9/).

Contains minimum of code required to:

-   Define `TrezorConnect` API object
-   Create and handle communication between `@trezor/connect-iframe` hosted on `https://connect.trezor.io/<version>/iframe.html`
-   Create and handle communication and lifecycle of `@trezor/connect-popup` hosted on `https://connect.trezor.io/<version>/popup.html`

## Installation

Install library as npm module:

```javascript
npm install @trezor/connect-web
```

or

```javascript
yarn add @trezor/connect-web
```

Include library as inline script:

```javascript
<script src="https://connect.trezor.io/9/trezor-connect.js"></script>
```

## Initialization

ES6

```javascript
import TrezorConnect from '@trezor/connect-web';
```

Inline

```javascript
var TrezorConnect = window.TrezorConnect;
```

For more instructions [refer to this document](https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md)

## Development

-   clone repository: `git clone git@github.com:trezor/trezor-suite.git`
-   install node_modules: `yarn && yarn build:libs`
-   generate certs `yarn workspace @trezor/connect-web predev`
-   It is possible to run local dev server with iframe and popup using: `yarn workspace @trezor/connect-web dev` Note: don't forget to visit `https://localhost:8088/` and allow self-signed certificate. No UI is displayed here.

## TrezorConnect Support Matrix

The table below details the support for different environments by TrezorConnect for integrating Trezor devices, including the use of WebUSB and the need for Trezor Bridge.

| Environment                   | Chrome | Firefox | Safari | Chrome Android | Firefox Android | Notes                                                                   |
| ----------------------------- | :----: | :-----: | :----: | :------------: | :-------------: | ----------------------------------------------------------------------- |
| Web (WebUSB)                  |   ✓    |    ✗    |   ✗    |       ✓        |        ✗        | WebUSB is fully supported where indicated. (Chromium based browsers)    |
| Web (Bridge)                  |   ✓    |    ✓    |   ✗    |       ✗        |        ✗        | Trezor Bridge is required where WebUSB is not supported. (e.g. Firefox) |
| WebExtension (WebUSB, Bridge) |   ✓    |    ✓    |   ✗    |       ✓        |        ✗        | Requires Trezor Bridge on platforms not supporting WebUSB.              |

## Key Differences

-   **WebUSB**: Allows direct communication with Trezor devices via the browser. Supported by most modern browsers but may have limitations on mobile devices and is not supported by Safari.
-   **Trezor Bridge**: A service that runs with Trezor Suite or Standalone that facilitates communication between your Trezor device and a web browser. Required for browsers that do not support WebUSB or for a more stable connection on desktop environments.
