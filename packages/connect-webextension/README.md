# @trezor/connect-webextension BETA

[![Build Status](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml/badge.svg)](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml)
[![NPM](https://img.shields.io/npm/v/@trezor/connect-webextension.svg)](https://www.npmjs.org/package/@trezor/connect-webextension)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/connect-webextension/badge.svg?targetFile=package.json)](https://snyk.io/test/github/trezor/trezor-suite?targetFile=packages/connect-webextension/package.json)

The @trezor/connect-webextension package provides an implementation of @trezor/connect designed specifically for use within web extensions. Key features include:

-   Compatibility with service worker environments.
-   Full access to the TrezorConnect API.
-   Automatic handling of pop-up windows for user approvals on trezor.io.
-   Direct response delivery to the calling script.

## Using the Library

At the moment only bundles `build/trezor-connect-webextension.js` and `build/trezor-connect-webextension.min.js` are published.

### Option 1: Using Scripting Permissions

For a seamless integration, especially with background processes, modify your extension's manifest.json to include scripting permissions, specify host_permissions, and define your service worker script as shown below:

```json
    "permissions": ["scripting"],
    "host_permissions": ["*://connect.trezor.io/9/*"]
    "background": {
        "service_worker": "serviceWorker.js"
    },
```

#### Service Worker Import:

In your serviceWorker.js, use importScripts to import the library. Ensure you replace <path> with the actual path to the library file:

```javascript
importScripts('<path>/trezor-connect-webextension.js');
```

### Option 2: Manual Content Script Injection

#### Bundle the Library:

Manually include build/content-script.js from this package into your project's bundle.

#### manifest.json Update:

Amend your manifest.json to include the script as a content script. Replace <path> with the real path to the library file:

```json
  "content_scripts": [
    {
      "js": ["<path>/content-script.js"],
      "matches": ["*://connect.trezor.io/9/*"]
    }
  ],
```

## Examples

-   [Simple example](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/webextension-mv3-sw)
-   [Connect Explorer example](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-explorer/src-webextension)

## Development

-   `yarn`
-   `yarn build:libs`
-   `yarn workspace @trezor/connect-webextension build`
-   `yarn workspace @trezor/connect-iframe build:core-module`
-   `yarn workspace @trezor/connect-popup dev`

After completing these steps, you can import from @trezor/connect-webextension or directly use the built file `build/trezor-connect-webextension.js`. The popup will run on your localhost, and you can specify it in the TrezorConnect.init({ connectSrc: ... }).
