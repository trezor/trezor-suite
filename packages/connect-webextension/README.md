# @trezor/connect-webextension BETA

[![Build Status](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml/badge.svg)](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml)
[![NPM](https://img.shields.io/npm/v/@trezor/connect-webextension.svg)](https://www.npmjs.org/package/@trezor/connect-webextension)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/connect-webextension/badge.svg?targetFile=package.json)](https://snyk.io/test/github/trezor/trezor-suite?targetFile=packages/connect-webextension/package.json)

This package contains @trezor/connect implementation suitable for webextensions. In short it:

-   works in service worker
-   provides access to TrezorConnect api
-   handles opening of popup page on trezor.io domain when user is expected to approve some operations
-   returns result to the caller.

## Beta

This package is currently in beta. If you find anything not working or not suiting your needs, please open an issue.

## How to use

At the moment only bundles `build/trezor-connect-webextension.js` and `build/trezor-connect-webextension.min.js` are published.

One way how it can be used is

```
importScripts('<path>/trezor-connect-webextension.js');

```

There are still some open questions, let us know!

-   should we publish also src? it would require some postinstall build steps however
-   should we publish other build targets (now te)

## Development

-   `yarn`
-   `yarn build:libs`
-   `yarn workspace @trezor/connect-webextension build`
-   `yarn workspace @trezor/connect-iframe build:core-module`
-   `yarn workspace @trezor/connect-popup dev`

Now you should be able to import from this package, or use directly `build/trezor-connect-webextension.js`. Popup is running on your localhost, just use it in TrezorConnect.init({ connectSrc: ... })

## Roadmap

-   [x] merge to develop branch
-   [x] release to npm under beta channel
-   [ ] public release
