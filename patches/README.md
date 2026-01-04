# Patches

## app-builder-lib

Fixes problem with generating `Info.plist` when building for macOS.
Remove this patch after when this is fixed upstream in [electron-builder PR](https://github.com/electron-userland/electron-builder/pull/9481).

## expo-modules-core

Gets rid of `The global process.env.EXPO_OS is not defined. This should be inlined by babel-preset-expo during transformation.`
warning while running unit tests. Probably caused by an issue reported [here](https://github.com/expo/expo/issues/26513) or [here](https://github.com/expo/expo/issues/25452).

## blakejs

May be outdated, TODO investigate
