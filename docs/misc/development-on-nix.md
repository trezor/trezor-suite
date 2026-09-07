# Development on Nix

Trezor Suite provides two ways to use Nix: a **Nix flake** (`flake.nix`) and a **`shell.nix`** for environments without flakes enabled.

## Prerequisites

### Flakes

- [Nix](https://nixos.org/download) installed with flakes enabled
- Add `experimental-features = nix-command flakes` to `~/.config/nix/nix.conf`

### shell.nix

- [Nix](https://nixos.org/download) installed (no extra config needed)

---

## Flake: Available Dev Shells

### Default shell (web/desktop development)

Includes Node.js 24, Yarn, Playwright, Electron, and all build dependencies.

```bash
nix develop
# or explicitly:
nix develop .#default
```

### Android shell (mobile development)

Includes the shared development tools plus:

- Java (JDK)
- Android SDK (platforms, build tools, NDK)
- Android Emulator with system images
- A default AVD is auto-created on first run

Electron, Playwright browsers, and desktop packaging tools are only included in the desktop shell.

```bash
nix develop .#android
```

## Common Workflows

### Web / Desktop development

```bash
nix develop
yarn
yarn suite:dev          # Web app at http://localhost:8000
yarn suite:dev:desktop  # Electron desktop app
```

### Mobile (Android) development

```bash
nix develop .#android
yarn
yarn native:start       # Start Metro bundler (in one terminal)
yarn a                  # Run on Android (in another terminal)
```

### Building Android with limited resources

After generating the Android project, use this command to build a debug APK with one Gradle worker,
two native compilation jobs, a 2 GiB Gradle heap, and reduced process priority:

```bash
yarn native:prebuild --platform android
yarn native:android:build:local
```

This builds only the host emulator architecture (`x86_64`, or `arm64-v8a` on ARM hosts). Expo Updates
also respects this architecture selection. Normal builds retain the configured architecture list.
The Nix-provided `Pixel_6_API_34` emulator uses `x86_64`.

Override the architecture for a physical device, or adjust compilation concurrency:

```bash
ANDROID_BUILD_ABI=arm64-v8a ANDROID_BUILD_JOBS=2 yarn native:android:build:local
```

The limits apply to this command only and may increase build time. The heap limit is for Gradle,
not total build memory. The command creates `suite-native/app/android/app/build/outputs/apk/debug/app-debug.apk`;
it does not start an emulator or Metro. With your emulator or device connected, install it using
`adb install -r suite-native/app/android/app/build/outputs/apk/debug/app-debug.apk`, then start
`yarn native:start` and open the app on the device.

### Running the Android emulator

```bash
nix develop .#android
# list available AVDs with:
avdmanager list avd
emulator -avd <avd-name>
emulator -avd Pixel_6_API_34
```

If you have troubles with your GPU acceleration you can disable it when running emulator like:

```bash
emulator -avd Pixel_6_API_34 -gpu swiftshader_indirect
```

### Running tests

```bash
nix develop
yarn test:unit
```

---

## shell.nix

For environments without flakes, use `nix-shell` with the root [shell.nix](../shell.nix).

### Default (web/desktop)

```bash
nix-shell
```

### Android

Pass `USE_ANDROID=1` to include the Android SDK, JDK, and emulator:

```bash
USE_ANDROID=1 nix-shell
```

### Bluetooth transport development

The [packages/transport-bluetooth](../packages/transport-bluetooth/) package has its own shell with a Rust toolchain:

```bash
nix-shell packages/transport-bluetooth/shell.nix
```

---
