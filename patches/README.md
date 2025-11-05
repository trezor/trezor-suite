# Patches

## expo-modules-core

Gets rid of `The global process.env.EXPO_OS is not defined. This should be inlined by babel-preset-expo during transformation.`
warning while running unit tests. Probably caused by an issue reported [here](https://github.com/expo/expo/issues/26513) or [here](https://github.com/expo/expo/issues/25452).
