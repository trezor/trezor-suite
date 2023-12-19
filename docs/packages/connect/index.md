# Trezor javascript SDK

There are couple of options how to integrate Trezor devices with your project. This page walks you through
installation and lets you explore SDK API.

## Chose your SDK

Depending on your environment you need to chose the right package.

| package                                                                                                           | environment                       |
| :---------------------------------------------------------------------------------------------------------------- | :-------------------------------- |
| [@trezor/connect](https://github.com/trezor/trezor-suite/tree/develop/packages/connect)                           | node.js                           |
| [@trezor/connect-web](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-web)                   | web based (DOM required)          |
| [@trezor/connect-webextension](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-webextension) | webextension using service worker |

If you are still unsure which package is the right one you may refer to the following table with a collection of examples.

| env example                                                                                                                                         | package                      |
| :-------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------- |
| [node](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/node)                                                          | @trezor/connect              |
| [web app](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/browser-inline-script)                                      | @trezor/connect-web          |
| [web extension mv2 (foreground or background)](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/webextension-mv2)      | @trezor/connect-web          |
| [web extension mv3 (foreground)](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/webextension-mv3)                    | @trezor/connect-web          |
| [web extension mv3 (background)](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/webextension-mv3-sw)                 | @trezor/connect-webextension |
| [electron in main layer](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/electron-main-process)                       | @trezor/connect              |
| [electron in renderer layer with popup](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/electron-renderer-with-popup) | @trezor/connect-web          |
| [Trezor Suite (desktop) electron app](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop/README.md)                         | @trezor/connect              |

## Quick start

Import from your selected package

```javascript
// in node
import TrezorConnect from '@trezor/connect';
// or in web based
import TrezorConnect from '@trezor/connect-web';
// or in webextension service worker
import TrezorConnect from '@trezor/connect-webextension';
```

Initialize in project

```javascript
TrezorConnect.init({
    lazyLoad: true, // this param will prevent iframe injection until TrezorConnect.method will be called
    manifest: {
        email: 'developer@xyz.com',
        appUrl: 'http://your.application.com',
    },
});
```

Trezor Connect Manifest requires that you, as a Trezor Connect integrator, share your e-mail and application url with us.
This provides us with the **ability to reach you in case of any required maintenance.**
This subscription is mandatory. Trezor Connect raises an error that reads "Manifest not set" if manifest is not provided. It can be either set via `manifest` method or passed as a param in `init` method.

```javascript
TrezorConnect.manifest({
    email: 'developer@xyz.com',
    appUrl: 'http://your.application.com',
});
```

If you need more customization, refer to [init method documentation](./methods/init.md)

## API methods

-   [List of methods](methods.md)

## Handling events

-   [Events](events.md)

## How it works under the hood

There is a major difference between node.js based package (`@trezor/connect`) and web based packages (`@trezor/connect-web` and `@trezor/connect-webextension`).
In the former the entire SDK logic is a module of the 3rd party application whereas in the latter, there is strict isolation between 3rd party application code and SDK core logic.

### Node.js

In node.js core SDK is loaded as a javascript module without any specificities.

![connect schema when used in node](./schema-connect.jpg =500x338)

### Web

`@trezor/connect-web` imports only a thin layer with API description into your 3rd party application. When initiated, it injects iframe containing core SDK logic from trezor.io
into your app. User input, if needed, is served by popup.html page opened on trezor.io on behalf of your application. This way users input such as pin or passphrase is isolated from you and persistent connection between your app and core SDK is kept so events such as device connected/disconnected or blockchain subscriptions are available.

![connect schema when used on web](./schema-connect-web.jpg =950x379)

### Webextension

In case of `@trezor/connect-webextension`, TrezorConnect object is created in a service worker. In this env we can't inject iframe so in order to uphold the same security model as with
`@trezor/connect-web` we open popup.html and load core SDK logic into it. This however does not build persistent connection between SDK and 3rd party application meaning that events cannot be used.

![connect schema when used in webextension](./schema-connect-webextension.jpg =950x432)
