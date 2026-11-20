# @trezor/connect – React Native Platform

## Package

```bash
npm install @trezor/connect-mobile
# or
yarn add @trezor/connect-mobile
```

`@trezor/connect-mobile` communicates with the **Trezor Suite mobile app** via deep links.
The user must have Trezor Suite installed on their device.

## How it Works

1. Your app calls a TrezorConnect method
2. The library opens Trezor Suite via a deep link URL
3. The user interacts with their device inside Suite
4. Suite deep-links back to your app with the result
5. Your app calls `TrezorConnect.handleDeeplink(url)` to resolve the response

## Initialization

```typescript
import TrezorConnect from '@trezor/connect-mobile';
import { Linking } from 'react-native';

await TrezorConnect.init({
    manifest: {
        email: 'developer@example.com',
        appUrl: 'https://myapp.io',
        appName: 'My App',
    },
    // Required: function to open URLs (opens Trezor Suite)
    deeplinkOpen: (url: string) => {
        Linking.openURL(url);
    },
    // Required: your app's deep link callback URL
    // Must be registered in your app.json / AndroidManifest / Info.plist
    deeplinkCallbackUrl: Linking.createURL('/connect'),
});
```

## Handling the Callback Deep Link

Register a `Linking` event listener to receive the response from Suite:

```typescript
import { useEffect } from 'react';
import { Linking } from 'react-native';
import TrezorConnect from '@trezor/connect-mobile';

function App() {
    useEffect(() => {
        const subscription = Linking.addEventListener('url', event => {
            TrezorConnect.handleDeeplink(event.url);
        });

        return () => subscription?.remove();
    }, []);

    // ...
}
```

## Deep Link Registration

### Expo (app.json)

```json
{
    "expo": {
        "scheme": "myapp",
        "ios": { "bundleIdentifier": "com.myapp" },
        "android": { "package": "com.myapp" }
    }
}
```

`Linking.createURL('/connect')` will produce `myapp://connect`.

### Bare React Native (AndroidManifest.xml)

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="myapp" android:host="connect" />
</intent-filter>
```

## Making Calls

After initialization, use TrezorConnect exactly as in other environments:

```typescript
const result = await TrezorConnect.getAddress({
    path: "m/44'/60'/0'/0/0",
    coin: 'eth',
    showOnTrezor: true,
});

if (result.success) {
    console.log(result.payload.address);
}
```

The library automatically opens Trezor Suite and waits for the deep link callback.

## Requirements

- Trezor Suite mobile app must be installed on the user's device
- Your app must have a registered deep link scheme
- Works with Expo and bare React Native

## Example

A working Expo example is available at `packages/connect-examples/mobile-expo/` in the monorepo.
