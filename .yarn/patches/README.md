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

## expo-updates

Prevents the Expo dev client from hanging when Detox starts an Android test. Introduced in
[#25924](https://github.com/trezor/trezor-suite/pull/25924).

## nextra

Undocumented reason, introduced in [#26620](https://github.com/trezor/trezor-suite/pull/26620)
