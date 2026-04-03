# Building Native Binaries (One-Time)

Pre-compiled Rust binaries for `@emurgo/csl-mobile-bridge`. Version is read from `package.json` automatically.
This only needs to be done once (or when upgrading csl-mobile-bridge). Binaries are committed via Git LFS.

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# iOS targets
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios

# Android targets + cargo-ndk
rustup target add aarch64-linux-android x86_64-linux-android
cargo install cargo-ndk
```

## Build

```bash
# Build both platforms
yarn workspace @suite-native/react-native-cardano build

# Or build one platform only
yarn workspace @suite-native/react-native-cardano build:ios
yarn workspace @suite-native/react-native-cardano build:android
```

The script clones the correct version from GitHub, compiles Rust for all targets,
creates the XCFramework (iOS) and copies .so files (Android) into the package.

## After building

Commit the binaries via Git LFS:

```bash
git add suite-native/react-native-cardano/ios/build/ suite-native/react-native-cardano/android/src/main/jniLibs/
git commit -m "chore(react-native-cardano): add pre-compiled Rust binaries"
```

LFS tracking rules in `.gitattributes` handle the rest.

## Upgrading csl-mobile-bridge

1. Update the version in `package.json`
2. Run `yarn workspace @suite-native/react-native-cardano build`
3. Commit the updated binaries
