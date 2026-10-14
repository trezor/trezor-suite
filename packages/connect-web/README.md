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

## Browser support

With Connect 10, your page no longer talks to the Trezor device. Trezor Suite desktop or Suite Web does, so what matters is which runtime mode the browser can use.

| Runtime mode                                   | Chrome | Firefox  |  Safari  | Mobile browsers | Notes                                                                                                                                                   |
| ---------------------------------------------- | :----: | :------: | :------: | :-------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suite Desktop WebSocket                        |   ✓    | untested | untested |        –        | Needs Trezor Suite desktop running on the same computer. If your page sends a Content-Security-Policy, `connect-src` must allow `ws://127.0.0.1:21335`. |
| Suite Web popup (`@trezor/connect-web`)        |  125+  |    ✗     |    ✗     |    untested     | Needs `document.requestStorageAccess` with `BroadcastChannel` (Chrome 125+, Opera 111+). Many WebViews and some Chromium forks lack it.                 |
| Suite Web tab (`@trezor/connect-webextension`) |   ✓    | untested | untested |    untested     | Needs `externally_connectable` and `host_permissions` for `https://suite.trezor.io/*`, see the `@trezor/connect-webextension` README.                   |

✓ supported, ✗ not supported, untested: not verified yet, –: not applicable.
