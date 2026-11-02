# Development on Nix

Trezor Suite provides two ways to use Nix: a **Nix flake** (`flake.nix`) and a **`shell.nix`** for environments without flakes enabled.

## Prerequisites

### Flakes

- [Nix](https://nixos.org/download) installed with flakes enabled
- Add `experimental-features = nix-command flakes` to `~/.config/nix/nix.conf`

### shell.nix (`nix-shell`)

- [Nix](https://nixos.org/download) installed (no extra config needed)
- Android and Rust tooling is opt-in via `USE_ANDROID=1` / `USE_RUST=1`, see [Optional plugins](#optional-plugins)

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

Includes everything in the default shell plus:

- Java (JDK)
- Android SDK (platforms, build tools, NDK)
- Android Emulator with system images
- A default AVD is auto-created on first run

```bash
nix develop .#android
```

### Rust shell (e.g. transport-bluetooth development)

Includes everything in the default shell plus the Rust toolchain (`rustc`, `cargo`, `rustfmt`, `cargo-cross`).

```bash
nix develop .#rust
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

### VS Code environment (flakes)

Install the [nix-env-selector](https://marketplace.visualstudio.com/items?itemName=arrterian.nix-env-selector) extension and add the following to `.vscode/settings.json`:

```json
"nixEnvSelector.useFlakes": true,
"nixEnvSelector.flakeShell": "rust"
```

Set `flakeShell` to `default`, `android`, or `rust` to match the shell you need. Reload VS Code after changing the settings. New terminals then open inside the selected shell.

---

## shell.nix

For environments without flakes, use `nix-shell` with the root [shell.nix](../../shell.nix).

### Default (web/desktop)

```bash
nix-shell
```

### Optional plugins

Plugins are enabled with environment variables set to `1`. They are defined in [.nix](../../.nix/) and add to the default shell.

| Variable        | Plugin                                | Description                                       |
| --------------- | ------------------------------------- | ------------------------------------------------- |
| `USE_ANDROID=1` | [android.nix](../../.nix/android.nix) | Android shell (mobile development)                |
| `USE_RUST=1`    | [rust.nix](../../.nix/rust.nix)       | Rust shell (e.g. transport-bluetooth development) |

### Android

```bash
USE_ANDROID=1 nix-shell
yarn
yarn native:start       # Start Metro bundler (in one terminal)
yarn a                  # Run on Android (in another terminal)
```

### Rust

Used by [packages/transport-bluetooth](../../packages/transport-bluetooth/):

```bash
USE_RUST=1 nix-shell
yarn workspace @trezor/transport-bluetooth dev:server
```

### Combining plugins

```bash
USE_ANDROID=1 USE_RUST=1 nix-shell
```

The variables are read when `nix-shell` starts, so set them on the same command line (or `export` them first).

---
