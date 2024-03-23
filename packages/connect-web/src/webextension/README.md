# Integrate @trezor/connect with a web extension

**Note: only manifest version 2 is supported for now**

[Example of a web extension project for both Google Chrome & Firefox](../../../connect-examples/webextension/README.md)

Basic implementation is same for both Google Chrome & Firefox. However, few additional steps are needed to make extension work with [WebUSB](https://wicg.github.io/webusb/) in Google Chrome.

1. Configure your manifest file

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

        Trezor Connect may present a popup tab for certain actions. Since your code & Connect is running in a background script you need to allow communication between popup tab and background script explicitly using this Javascript [file](./trezor-content-script.js).

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
                    iconUrl: 'icons/48.png',
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
    import TrezorConnect from '@trezor/connect'; // Import Trezor Connect

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
                    iconUrl: 'icons/48.png',
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

Chrome extension requires a special `trezor-usb-permissions.html` file served from the root of your extension. You can get the file [here](./trezor-usb-permissions.html).

This page will be displayed in case where user is using Trezor without `Trezor Bridge` installed and `navigator.usb` is available.

Lastly, you have to place [this](./trezor-usb-permissions.js) Javascript file into your `vendor/` directory. This directory could be changed, but then you need to remember to change script src accordingly inside `trezor-usb-permissions.html` file.

# TrezorConnect Support Matrix

The table below details the support for different environments by TrezorConnect for integrating Trezor devices, including the use of WebUSB and the need for Trezor Bridge.

| Environment                   | Chrome | Firefox | Chrome Android | Firefox Android | Safari | Edge | Notes                                                                   |
| ----------------------------- | :----: | :-----: | :------------: | :-------------: | :----: | :--: | ----------------------------------------------------------------------- |
| Web (WebUSB)                  |   ✓    |    ✗    |       ✗        |        ✗        |   ✗    |  ✓   | WebUSB is fully supported where indicated.                              |
| Web (Bridge)                  |   ✓    |    ✓    |       ✗        |        ✗        |   ✓    |  ✓   | Trezor Bridge is required for Safari and where WebUSB is not supported. |
| WebExtension (WebUSB, Bridge) |   ✓    |    ✓    |       ✗        |        ✗        |   ✗    |  ✗   | Requires Trezor Bridge on platforms not supporting WebUSB.              |

## Key Differences

-   **WebUSB**: Allows direct communication with Trezor devices via the browser. Supported by most modern browsers but may have limitations on mobile devices and is not supported by Safari.
-   **Trezor Bridge**: A service that runs with Trezor Suite or Standalone that facilitates communication between your Trezor device and a web browser. Required for browsers that do not support WebUSB or for a more stable connection on desktop environments.
