# @trezor/connect-webextension

[![Build Status](https://github.com/trezor/trezor-suite/actions/workflows/test-connect.yml/badge.svg)](https://github.com/trezor/trezor-suite/actions/workflows/test-connect.yml)
[![NPM](https://img.shields.io/npm/v/@trezor/connect-webextension.svg)](https://www.npmjs.org/package/@trezor/connect-webextension)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/connect-webextension/badge.svg?targetFile=package.json)](https://snyk.io/test/github/trezor/trezor-suite?targetFile=packages/connect-webextension/package.json)

The @trezor/connect-webextension package provides an implementation of @trezor/connect designed specifically for use within web extensions. Key features include:

-   Compatibility with service worker environments.
-   Full access to the TrezorConnect API.
-   Automatic handling of pop-up windows for user approvals on trezor.io.
-   Direct response delivery to the calling script.

## Using the Library

We support two methods for integrating the library into your extension:

### Option 1: Using Scripting Permissions

For a seamless integration, especially with background processes, modify your extension's `manifest.json` to include scripting permissions, specify `host_permissions`, and define your service worker script as shown below:

```json
    "permissions": ["scripting"],
    "host_permissions": ["*://connect.trezor.io/9/*"]
    "background": {
        "service_worker": "serviceWorker.js"
    }
```

The content script will be injected automatically by the library using the scripting permission.

#### Service Worker Import:

In your `serviceWorker.js`, use importScripts to import the library. Ensure you replace `<path>` with the actual path to the library file:

```javascript
importScripts('<path>/trezor-connect-webextension.js');
```

Or if you're using ES modules:

```javascript
import TrezorConnect from '@trezor/connect-webextension';
```

The library is only available in the service worker context, so to use it in your extension's UI, you need to communicate with the service worker. This mechanism is not provided by the library, this depends on your extension's architecture.
Also it should be noted that the service worker may be idle when the extension is not in use, so you should implement a mechanism to keep it alive or wake it up when needed.

### Option 2: Manual Content Script Injection

In cases where you cannot use scripting permissions, you can configure your extension to include the content script directly.

#### Bundle the Library:

Manually include `build/content-script.js` from this package into your project's bundle.
Ideally, you should do this with a build tool like Webpack, so it can be easily maintained.

#### manifest.json Update:

Amend your manifest.json to include the script as a content script. Replace `<path>` with the real path to the library file:

```json
  "content_scripts": [
    {
      "js": ["<path>/content-script.js"],
      "matches": ["*://connect.trezor.io/9/*"]
    }
  ],
```

After completing these steps, you can use the module in your Service Worker in the same way as described in the previous section.

## Adding your webextension to `knownHosts`

To ensure your extension is displayed with its name rather than its ID, you need to open a Pull Request to include it in the `knownHosts` section of the file located at https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/data/config.ts#L17.

## Examples

-   [Simple example](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/webextension-mv3-sw)
-   [ES6 and TypeScript example](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/webextension-mv3-sw-ts)

## Development

-   `yarn`
-   `yarn build:libs`
-   `yarn workspace @trezor/connect-webextension build`
-   `yarn workspace @trezor/connect-iframe build:core-module`
-   `yarn workspace @trezor/connect-popup dev`

After completing these steps, you can import from @trezor/connect-webextension or directly use the built file `build/trezor-connect-webextension.js`.
The popup will run on your localhost, and you can specify it in the `TrezorConnect.init({ connectSrc: ... })`.
