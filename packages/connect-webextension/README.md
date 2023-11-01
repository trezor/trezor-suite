# @trezor/webextension BETA

[![Build Status](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml/badge.svg)](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml)
[![NPM](https://img.shields.io/npm/v/@trezor/connect-webextension.svg)](https://www.npmjs.org/package/@trezor/connect-webextension)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/connect-webextension/badge.svg?targetFile=package.json)](https://snyk.io/test/github/trezor/trezor-suite?targetFile=packages/connect-webextension/package.json)

This package contains @trezor/connect implementation suitable for webextensions. In short it:

-   works in service worker
-   provides access to TrezorConnect api
-   handles opening of popup page on trezor.io domain when user is expected to approve some operations
-   returns result to the caller.

## Roadmap

-   [ ] preliminary review (architecture, new package, same popup)
-   [ ] internal testing
    -   [ ] build connect-explorer-webextension using this package
    -   [ ] make it available to QA and test it
-   [ ] beta testing
    -   [ ] release npm package in beta
    -   [ ] release changes to connect popup to trezor.io, make sure standard flow using iframe is unaffected
    -   [ ] gather feedback from 3rd parties bulding extensions
-   [ ] public release

## Development

-   `yarn`
-   `yarn build:libs`
-   `yarn workspace @trezor/connect-webextension build`
-   `yarn workspace @trezor/connect-iframe build:core-module`
-   `yarn workspace @trezor/connect-popup dev`
