import { registerRootComponent } from 'expo';
import { randomUUID } from 'expo-crypto';
import { polyfillWebCrypto } from 'expo-standard-web-crypto';

import { App } from './App';

// React Native/Expo does not ship the Web Crypto API that @trezor/connect-mobile
// relies on. `polyfillWebCrypto` installs `crypto.getRandomValues`; `crypto.randomUUID`
// (used by connect-mobile) is not covered, so we back it with expo-crypto.
polyfillWebCrypto();
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
    crypto.randomUUID = randomUUID;
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
