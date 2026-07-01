## Mobile example with Expo

`@trezor/connect-mobile` running with a React Native + Expo app

### Run it

`yarn android`

Will start the Expo app in Android emulator/device.

You will also need to have the Trezor Suite app installed. Follow the instructions in [@suite-native/app](https://github.com/trezor/trezor-suite/blob/develop/suite-native/app/README.md) to run a dev version of the app.

### Crypto polyfill

React Native/Expo does not provide the Web Crypto API that `@trezor/connect-mobile` depends on (it uses `crypto.randomUUID`). The example polyfills it in [`index.js`](./index.js) before the app starts:

- [`expo-standard-web-crypto`](https://www.npmjs.com/package/expo-standard-web-crypto) installs `crypto.getRandomValues`.
- [`expo-crypto`](https://docs.expo.dev/versions/latest/sdk/crypto/) backs `crypto.randomUUID`, which the polyfill above does not cover.

```js
import { randomUUID } from 'expo-crypto';
import { polyfillWebCrypto } from 'expo-standard-web-crypto';

polyfillWebCrypto();
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
    crypto.randomUUID = randomUUID;
}
```
