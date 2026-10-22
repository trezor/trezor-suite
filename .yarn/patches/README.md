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

## nextra

Skips the git timestamp lookup when building inside a git worktree. nextra resolves page paths against
the worktree's git directory (`.git/worktrees/<name>`), so every page lookup walks the whole history and
`next build` of `@trezor/connect-explorer` effectively never finishes. Introduced in
[#26620](https://github.com/trezor/trezor-suite/pull/26620).

## react-native-webview

Changes for the in-app browser of `@suite-native/apps-embedding`, introduced for [#33402](https://github.com/trezor/trezor-suite/issues/33402); one bullet per change, each to be removed once `react-native-webview` offers the behavior itself.

- iOS titles the `alert`, `confirm` and `prompt` dialogs with the host of the frame that opened them, and shows none for a frame without an identifiable host. The library presents every dialog as an app alert with an empty title whatever frame asked, so a third-party iframe inside an embedded site could pass a prompt for a PIN off as Suite's own; WebKit hands the delegate the calling frame, and Android's default client already names the page.
