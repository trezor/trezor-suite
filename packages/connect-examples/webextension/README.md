# Webextension with inline script

`@trezor/connect` running in background script and communicating through `chrome.runtime.postMessage`

Tested in Chrome and Firefox

## Install

-   `cd packages/connect-examples/webextension`
-   `yarn`
-   `yarn prepare`

## Browsers

### Chrome

-   Go to chrome://extensions
-   Enable developer mode and load unpacked
-   Choose `packages/connect-examples/webextension` directory

### Firefox

-   Go to settings (top right Menu) > Add-ons
-   Manage Your Extensions > Debug Add-ons
-   Load temporary Add-on
-   Choose `packages/connect-examples/webextension/manifest-firefox.json` file
