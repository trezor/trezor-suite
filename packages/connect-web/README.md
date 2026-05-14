# @trezor/connect-web

[![NPM](https://img.shields.io/npm/v/@trezor/connect-web.svg)](https://www.npmjs.org/package/@trezor/connect-web)

This package is bundled into web implementations. There are two primary runtime modes:

- **Suite Desktop WebSocket**: when Trezor Suite Desktop is running, Connect talks to it over a localhost WebSocket and UI is handled inside Suite.
- **Suite Web popup**: otherwise, user interaction is presented in a secure popup window served from `https://suite.trezor.io/web/connect-popup/`.

To try it out, use [@trezor/connect-explorer](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-explorer) hosted [here](https://connect.trezor.io/10/).

Contains minimum of code required to:

- Define `TrezorConnect` API object
- Create and handle communication and lifecycle of Connect popup window

## Installation

Install library as npm module:

```javascript
npm install @trezor/connect-web
```

or

```javascript
yarn add @trezor/connect-web
```

## Initialization

ES6

```javascript
import TrezorConnect from '@trezor/connect-web';
```

For more instructions [refer to this document](https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md)

## Development

- clone repository: `git clone git@github.com:trezor/trezor-suite.git`
- install node_modules: `yarn && yarn build:libs`

## TrezorConnect Support Matrix

The table below details the support for different environments by TrezorConnect for integrating Trezor devices, including the use of WebUSB and the need for Trezor Bridge.

| Environment                   | Chrome | Firefox | Safari | Chrome Android | Firefox Android | Notes                                                                   |
| ----------------------------- | :----: | :-----: | :----: | :------------: | :-------------: | ----------------------------------------------------------------------- |
| Web (WebUSB)                  |   ✓    |    ✗    |   ✗    |       ✓        |        ✗        | WebUSB is fully supported where indicated. (Chromium based browsers)    |
| Web (Bridge)                  |   ✓    |    ✓    |   ✗    |       ✗        |        ✗        | Trezor Bridge is required where WebUSB is not supported. (e.g. Firefox) |
| WebExtension (WebUSB, Bridge) |   ✓    |    ✓    |   ✗    |       ✓        |        ✗        | Requires Trezor Bridge on platforms not supporting WebUSB.              |

## Key Differences

- **WebUSB**: Allows direct communication with Trezor devices via the browser. Supported by most modern browsers but may have limitations on mobile devices and is not supported by Safari.
- **Trezor Bridge**: A service that runs with Trezor Suite or Standalone that facilitates communication between your Trezor device and a web browser. Required for browsers that do not support WebUSB or for a more stable connection on desktop environments.
