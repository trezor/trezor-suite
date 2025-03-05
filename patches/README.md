# Patches

## react-native-quick-crypto

Add `libreactnative.so` to the list of files to not strip. Just temporary because it's already fixed upstream but not released yet.

## expo-updates

fix e2e tests in debug mode
upstream PR https://github.com/expo/expo/pull/32951

## expo-modules-core

Gets rid of `The global process.env.EXPO_OS is not defined. This should be inlined by babel-preset-expo during transformation.`
warning while running unit tests. Probably caused by an issue reported [here](https://github.com/expo/expo/issues/26513) or [here](https://github.com/expo/expo/issues/25452).
