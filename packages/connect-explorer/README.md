# TrezorConnect explorer

This package serves as:

-   an interactive documentation for [@trezor/connect](../connect) package
-   a referential implementation of @trezor/connect-web in "popup mode"

`yarn workspace @trezor/connect-explorer dev` - runs dev server on port 8088

When `connect-exporer` is run locally, WebUSB is disabled by Chrome because [@trezor/connect-popup](../connect-popup) runs on a different domain.

Alternatively, use the [online explorer](https://trezor.github.io/connect-explorer/), which is pointing to the latest stable version of [@trezor/connect](../connect).

For internal use, a build from the develop branch is available at [SLDEV](https://suite.corp.sldev.cz/connect-explorer/develop).
