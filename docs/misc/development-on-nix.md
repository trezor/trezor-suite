# Development on Nix

Trezor Suite provides two ways to use Nix: a **Nix flake** (`flake.nix`) and a **`shell.nix`** for environments without flakes enabled.

These Nix development environments target Linux.

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

Includes everything in the default shell (including Playwright and Electron), plus:

- Java (JDK)
- Android SDK (platforms, build tools, NDK)
- Android Emulator with system images
- API 34 and API 36 AVDs are auto-created on first run

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

### Running the Android emulator

The Android shell provides `Pixel_6_API_34` and `Pixel_6_API_36` for local testing.
Detox and Android CI default to API 34. Re-enter the Android shell to create any missing AVDs.

```bash
nix develop .#android
# list available AVDs with:
avdmanager list avd
emulator -avd Pixel_6_API_34
# Or select API 36:
emulator -avd Pixel_6_API_36
```

If you have troubles with your GPU acceleration you can disable it when running emulator like:

```bash
emulator -avd Pixel_6_API_36 -gpu swiftshader_indirect
```

### Running tests

```bash
nix develop
yarn test:unit
```

---

## shell.nix

For environments without flakes, use `nix-shell` with the root [shell.nix](../../shell.nix).

### Default (web/desktop)

```bash
nix-shell
```

### Android

Pass `USE_ANDROID=1` to add the Android SDK, JDK, and emulator to the development environment:

```bash
USE_ANDROID=1 nix-shell
```

### Bluetooth transport development

The [packages/transport-bluetooth](../packages/transport-bluetooth/) package has its own shell with a Rust toolchain:

```bash
nix-shell packages/transport-bluetooth/shell.nix
```

---
