# Patches

### 👉 README, I'M IMPORTANT

- Whenever you create or remove a patch, make sure to create/remove a brief explanation why.
- Remove the patch as soon as we can update to a version that no longer requires the patch.

### Creating a patch

1. Run `yarn patch PACKAGE_NAME`
2. Edit the files in the TEMP_FOLDER created by yarn
3. `yarn patch-commit -s TEMP_FOLDER` as per yarn's instructions
4. `yarn` to regenerate `yarn.lock`

### Deleting a patch

Either revert the original patch commit, or simply install a newer version `yarn install PACKAGE_NAME@1.2.3`

---

## expo-modules-core

Native-only, but does not break any CI.

Gets rid of `The global process.env.EXPO_OS is not defined. This should be inlined by babel-preset-expo during transformation.`
warning while running unit tests. Probably caused by an issue reported [here](https://github.com/expo/expo/issues/26513) or [here](https://github.com/expo/expo/issues/25452).

## expo-updates

Undocumented reason, introduced in [#25924](https://github.com/trezor/trezor-suite/pull/25924)

## nextra

Undocumented reason, introduced in [#26620](https://github.com/trezor/trezor-suite/pull/26620)

## typescript-styled-plugin

When validation is disabled, avoid registering semantic-diagnostic and optional outlining hooks.
Without this patch, the plugin traverses every file in the TypeScript project even though it cannot
produce styled-template diagnostics. Remove the patch when the maintained upstream fork supports
completion-only operation.
