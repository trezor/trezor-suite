# Cardano Native Artifacts

Suite Native uses prebuilt `@emurgo/csl-mobile-bridge` Rust artifacts from this directory. Normal app development, CI,
and release builds fetch these files through Git LFS and must not build Rust.

Use the generation command only when bumping `@emurgo/csl-mobile-bridge` or when the Rust artifact needs to be rebuilt.

## Prerequisites

- Rust with `cargo` and `rustup`.
- Xcode and command line tools for iOS artifacts.
- Android SDK with NDK `27.0.12077973` for Android artifacts.
- `ANDROID_NDK_HOME` exported for Android builds.

The generator installs the required Rust targets with `rustup target add` and strips the generated binaries before they
are stored here.

## Regenerate

From the repository root:

```bash
yarn
yarn generate-cardano-native-binaries
```

To regenerate only one platform:

```bash
yarn generate-cardano-native-binaries android
yarn generate-cardano-native-binaries ios
```

The command builds from the installed `@emurgo/csl-mobile-bridge` package and overwrites:

- `android/armeabi-v7a/libreact_native_haskell_shelley.so`
- `android/arm64-v8a/libreact_native_haskell_shelley.so`
- `android/x86/libreact_native_haskell_shelley.so`
- `android/x86_64/libreact_native_haskell_shelley.so`
- `ios/libreact_native_haskell_shelley.a`
- `ios/libreact_native_haskell_shelley_simulator.a`
- `include/react_native_haskell_shelley.h`

## Update Checklist

1. Bump `@emurgo/csl-mobile-bridge` in `suite-native/app/package.json`.
2. Run `yarn` and resolve the existing Yarn patch if needed.
3. Run `yarn generate-cardano-native-binaries`.
4. Stage the changed artifacts and verify they are tracked by Git LFS:

    ```bash
    git add suite-native/app/native-libs/cardano
    git lfs status
    git lfs ls-files suite-native/app/native-libs/cardano
    ```

5. Commit the changes.
6. Push the Git LFS objects and the branch:

    ```bash
    git lfs push --all origin HEAD
    git push
    ```
