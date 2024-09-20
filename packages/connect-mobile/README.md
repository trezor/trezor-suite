# @trezor/connect-mobile

[![NPM](https://img.shields.io/npm/v/@trezor/connect-mobile.svg)](https://www.npmjs.org/package/@trezor/connect-mobile)

The `@trezor/connect-mobile` package provides an implementation of `@trezor/connect` which uses deep links to communicate with the Trezor Suite Lite app.

## 🚧 BETA version, work in progress 🚧

Currently the library is still under development, only supports read-only methods and does not communicate with the production Suite Lite app.

To run a dev version of the Suite mobile app follow the instructions in [@suite-native/app](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/README.md)

## Using the Library

To use the library, you need to initialize it with the `deeplinkOpen` and `deeplinkCallbackUrl` settings.

```javascript
import TrezorConnect from '@trezor/connect-mobile';

TrezorConnect.init({
    manifest: {
        email: 'developer@xyz.com',
        appUrl: 'http://your.application.com',
    },
    deeplinkOpen: url => {
        // eslint-disable-next-line no-console
        console.log('deeplinkOpen', url);
        Linking.openURL(url);
    },
    deeplinkCallbackUrl: Linking.createURL('/connect'),
});
```

To receive the deep link callback, you need to add a listener which will call `TrezorConnect.handleDeeplink` with the deep link URL.

```javascript
useEffect(() => {
    const subscription = Linking.addEventListener('url', event => {
        TrezorConnect.handleDeeplink(event.url);
    });

    return () => subscription?.remove();
}, []);
```

## Example

The [Connect mobile example](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples/mobile-expo) shows how to use the library in a React Native + Expo app.
