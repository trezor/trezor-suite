# react-native-usb

React Native WebUSB implementation

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npm install react-native-usb
```

### Configure for iOS

Warning: iOS is not yet supported.
Run `npx pod-install` after installing the npm package.

### Configure for Android

Please add the following to your app's `AndroidManifest.xml` `.MainActivity` section:

```xml
      <intent-filter>
        <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
        <action android:name="android.hardware.usb.action.USB_DEVICE_DETACHED" />
      </intent-filter>

      <meta-data android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
          android:resource="@xml/device_filter" />
```

And also add file `android/app/src/main/res/xml/device_filter.xml` with the following content:

```xml
<?xml version="1.0" encoding="utf-8"?>

<resources>
    <usb-device vendor-id="21324" product-id="1" />
    <usb-device vendor-id="4617" product-id="21440" />
    <usb-device vendor-id="4617" product-id="21441" />
</resources>
```
