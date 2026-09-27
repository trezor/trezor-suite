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

## @solana/rpc

Reads the abort reason from the registered signal because `abortcontroller-polyfill` dispatches
abort events with a null target on React Native. Introduced for
[#30691](https://github.com/trezor/trezor-suite/issues/30691). Upstream fix:
[anza-xyz/kit#1994](https://github.com/anza-xyz/kit/pull/1994). Remove after upgrading
`@solana/rpc` to a release containing the upstream fix.

## expo-updates

Prevents the Expo dev client from hanging when Detox starts an Android test. Introduced in
[#25924](https://github.com/trezor/trezor-suite/pull/25924).

## @expo/ui

Adds an optional `onDidPresent` event for bottom sheets. Native form focus must wait for the iOS
presentation transition or the Android dialog's opening animation and window focus; the existing
`onChange` callback can run before the native window is ready. The patch preserves `onChange`
behavior and forwards the new event through the community bottom-sheet adapter. The iOS adapter
also measures the actual sheet width instead of forcing the app window width, which clips content
in narrower presentations. Remove these changes when upstream provides the equivalent behavior.
The presentation event requires a native rebuild;
the app's platform-specific `expo.autolinking` settings ensure both platforms compile the patched
sources instead of selecting precompiled Expo UI artifacts. Remove those settings with the patch.

## nextra

Undocumented reason, introduced in [#26620](https://github.com/trezor/trezor-suite/pull/26620)
