# Web extension manifest V2 example

`@trezor/connect` running in background script and communicating through `chrome.runtime.postMessage`

Tested in Chrome and Firefox

## Install

-   `cd packages/connect-examples/`
-   `node update-webextensions.js`

## Browsers

### Chrome

-   Go to chrome://extensions
-   Enable developer mode and load unpacked
-   Choose `packages/connect-examples/webextension-mv2` directory

### Firefox

-   Go to settings (top right Menu) > Add-ons
-   Manage Your Extensions > Debug Add-ons
-   Load temporary Add-on
-   Choose `packages/connect-examples/webextension-mv2/manifest-firefox.json` file

# Detailed explanation

Basic implementation is the same for both Google Chrome & Firefox. However, few additional steps are needed to make extension work with [WebUSB](https://wicg.github.io/webusb/) in Google Chrome.

1. Configure your manifest file ([Google Chrome](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-examples/webextension/manifest.json), [Firefox](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-examples/webextension/manifest-firefox.json))

    - Because Trezor Connect is served from the `https://connect.trezor.io/` domain you must grant permissions to `://connect.trezor.io/*` URL in your manifest file.

        ```JSON
        {
            "permissions": [
                "*://connect.trezor.io/*"
            ]
        }
        ```

    - Include Trezor Connect as one of your background scripts

        If you're using a bundler only include final `index.js` file

        ```JSON
        {
            "background": {
                "scripts": [
                    "index.js"
                ]
            }
        }
        ```

        If you're not using a bundler you have to include Trezor Connect manually

        ```JSON
        {
            "background": {
                "scripts": [
                    "[myExtensionIndexFile]index.js",
                    "[pathToTrezorConnect]/index.js"
                ]
            }
        }
        ```

    - Include `trezor-content-script.js` in a `"content-scripts"`

        Trezor Connect may present a popup tab for certain actions. Since your code & Connect is running in a background script you need to allow communication between popup tab and background script explicitly using this Javascript [file](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-web/src/webextension/trezor-content-script.js).

        ```JSON
        {
            "content_scripts": [
                {
                "matches": [
                    "*://connect.trezor.io/*/popup.html"
                ],
                "js": ["trezor-content-script.js"]
                }
            ],
        }
        ```

        Snippet above is basically saying _"Inject `trezor-content-script.js` into `connect.trezor.io/*/popup.html`"_.

2. Now you're able to use Trezor Connect in your code

    You can access `TrezorConnect` as a global variable if you included Trezor Connect in your project manually

    ```javascript
    function onClick() {
        TrezorConnect.getAddress({
            path: "m/49'/0'/0'/0/0",
        })
            .then(response => {
                const message = response.success
                    ? `BTC Address: ${response.payload.address}`
                    : `Error: ${response.payload.error}`;
                chrome.notifications.create(new Date().getTime().toString(), {
                    type: 'basic',
                    iconUrl: 'icon48.png',
                    title: 'TrezorConnect',
                    message,
                });
            })
            .catch(error => {
                console.error('TrezorConnectError', error);
            });
    }
    chrome.browserAction.onClicked.addListener(onClick);
    ```

    If you're using a package manager you will probably want to import Trezor Connect into your code using an `import` statement

    ```javascript
    import TrezorConnect from '@trezor/connect-web'; // Import Trezor Connect

    function onClick() {
        TrezorConnect.getAddress({
            path: "m/49'/0'/0'/0/0",
        })
            .then(response => {
                const message = response.success
                    ? `BTC Address: ${response.payload.address}`
                    : `Error: ${response.payload.error}`;
                chrome.notifications.create(new Date().getTime().toString(), {
                    type: 'basic',
                    iconUrl: 'icon48.png',
                    title: 'TrezorConnect',
                    message,
                });
            })
            .catch(error => {
                console.error('TrezorConnectError', error);
            });
    }
    chrome.browserAction.onClicked.addListener(onClick);
    ```

This is all that must be done in order to make Trezor Connect work with a web extension on Firefox.
However, if you're creating a Google Chrome extension you must complete one additional step.

## Google Chrome WebUSB

Chrome extension requires a special `trezor-usb-permissions.html` file served from the root of your extension. You can get the file [here](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-web/src/webextension/trezor-usb-permissions.html).

This page will be displayed in case where user is using Trezor without `Trezor Bridge` installed and `navigator.usb` is available.

Lastly, you have to place [this](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-web/src/webextension/trezor-usb-permissions.js) Javascript file into your `vendor/` directory. This directory could be changed, but then you need to remember to change script src accordingly inside `trezor-usb-permissions.html` file.
