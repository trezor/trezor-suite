# Web extension manifest V3 example

`@trezor/connect` running in an `html` page from the extension and communicating with `@trezor/popup` through `chrome.runtime` messages.
This mode of integration is no longer recommended, please refer to the [webextension-mv3-sw](../webextension-mv3-sw/README.md) example instead.

Tested in Chrome

## Install

Run the commands below in order to get the MV3 webextension ready to be loaded in the browser.

- `yarn`
- `yarn build:libs`
- `yarn workspace @trezor/connect-web build:webextension`
- `yarn workspace @trezor/connect-web build:inline`
- `node packages/connect-examples/update-webextensions.js`

## Browsers

### Chrome

- Go to chrome://extensions
- Enable developer mode and load unpacked
- Choose `packages/connect-examples/webextension-mv3` directory
