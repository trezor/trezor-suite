# @trezor/connect-explorer-webextension

This package serves as:

-   a testing base of [@trezor/connect-popup](../connect-popup/) in web extension environment

To build the webextension locally:

`yarn workspace @trezor/connect-explorer-webextension build`

It will be built at `packages/connect-explorer-webextension/build`

## Run in Chrome

-   Go to chrome://extensions
-   Enable developer mode and load unpacked
-   Choose `packages/connect-explorer-webextension/build` directory

## Run for development

Connect explorer running inside @trezor/connect-explorer-webextension uses Connect Popup running in `https://connect.trezor.io/9/popup.html`. If you want to use the local version of popup you will have to run in it, and pass `__TREZOR_CONNECT_SRC=http://localhost:8088/` argument. Like the commands below:

```
yarn build:libs && \
__TREZOR_CONNECT_SRC=http://localhost:8088/ yarn workspace @trezor/connect-explorer-webextension build && \
yarn workspace @trezor/connect-explorer dev
```
