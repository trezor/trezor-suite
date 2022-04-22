## Webextension with inline script

`@trezor/connect` running in background script and communicating through `chrome.runtime.postMessage`

Tested in Chrome and Firefox

### Install

-   `cd packages/connect-examples/webextension`
-   `yarn`
-   `yarn prepare`

#### Chrome

-   go to chrome://extensions
-   Load unpacked
-   Choose `packages/connect-examples/webextension` directory

#### Firefox

-   go to settings (top right Menu) > Add-ons
-   Manage Your Extensions > Debug Add-ons
-   Load temporary Add-on
-   Choose `packages/connect-examples/webextension/manifest-firefox.json` file
