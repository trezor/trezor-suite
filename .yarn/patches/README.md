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

Undocumented reason, introduced in [#26620](https://github.com/trezor/trezor-suite/pull/26620)

## usb

Adds a virtual destructor to `HotPlugManager`. Source builds otherwise delete a derived
manager through the base class with the wrong size, triggering Electron's allocator trap
on normal shutdown (including utility processes). This affects NixOS, where native modules
are built from source. The patch does not replace upstream prebuilt binaries. Rebuild `usb`
after applying it to an existing source build. Remove when upstream includes the destructor.

The Suite desktop unit-test command rebuilds `usb` before running the shutdown tests so they
exercise the patched source instead of an upstream prebuilt binary. This requires a C++ build
toolchain and, on Linux, the libudev development package.

Desktop packaging also enforces this patch. The `beforePack` hook stages a verified binary
before ASAR creation and signing, building from source on a native host if no artifact is present.
Cross-platform builds use the `build-usb-native.yml` workflow, which builds and tests
Linux x64/arm64, macOS x64/arm64, and
Windows x64 binaries on native runners. Build and release workflows download those artifacts
from their own workflow run. Each binary has a manifest binding it to its target, USB version,
and patch hash; missing, stale, or corrupted builds stop packaging. Upstream prebuilt binaries
are excluded from the application.

For local cross-packaging, download and merge the `usb-patched-*` artifacts from the same
revision into `packages/suite-desktop/usb-patch/prebuilds`.
`yarn workspace @trezor/suite-desktop build:usb` produces a fresh artifact for the current host.
Packaging targets run sequentially because each stages its own native binary into the shared
USB dependency directory.
