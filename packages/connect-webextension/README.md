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

This package is currently in beta and has not yet been released into npm. You can use it locally however, following these steps:

-   `yarn`
-   `yarn build:libs`
-   `yarn workspace @trezor/connect-webextension build`
-   `yarn workspace @trezor/connect-iframe build:core-module`
-   `yarn workspace @trezor/connect-popup dev`

Now you should be able to import from this package, or use directly `build/trezor-connect-webextension.js`. Popup is running on your localhost, just use it in TrezorConnect.init({ connectSrc: ... })

## Roadmap

-   [x] merge to develop branch
-   [ ] release to npm under beta channel
-   [ ] public release
