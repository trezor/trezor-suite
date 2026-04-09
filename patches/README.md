# Patches

👉 **README, I'M IMPORTANT:**

- Whenever you create or remove a patch, make sure to create/remove a brief explanation why.
- Remove the patch as soon as we can update to a version that no longer requires the patch.
- Known problem: `patch-packages` does not work well with `yarn workspaces focus`.
    - Check cases in github action `yml`s where both are used.
    - Check for problematic packages, e.g. `electron-builder` patched when `suite-native/app` is focused
    - A quick hotfix can be as simple as `rm patches/some.patch` in the `yml` (patches are temporary anyway)

---

## expo-device

Fixes https://github.com/trezor/trezor-suite/issues/26487.

## expo-modules-core

Native-only, but does not break any CI.

Gets rid of `The global process.env.EXPO_OS is not defined. This should be inlined by babel-preset-expo during transformation.`
warning while running unit tests. Probably caused by an issue reported [here](https://github.com/expo/expo/issues/26513) or [here](https://github.com/expo/expo/issues/25452).

## blakejs

May be outdated, TODO investigate
