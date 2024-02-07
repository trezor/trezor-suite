# @trezor/transport-bluetooth

### Server development

Prerequisites: [RUST](https://www.rust-lang.org/tools/install)

### Vscode:

Vscode rust-analyzer extensions:

-   install `rust-analyzer` plugin
-   (NixOS only) install `nix-env-selector` plugin and [follow readme](https://marketplace.visualstudio.com/items?itemName=arrterian.nix-env-selector) to setup

Vscode `.vscode/settings`:

```
"rust-analyzer.cargo.sysroot": "discover",
"rust-analyzer.diagnostics.disabled": ["unresolved-proc-macro"]
"rust-analyzer.linkedProjects": ["./packages/transport-bluetooth/Cargo.toml"]
(NixOS only) "nixEnvSelector.nixFile": "${workspaceFolder}/packages/transport-bluetooth/shell.nix",
```

### NixOS:

```
nix-shell ./packages/transport-bluetooth/shell.nix
```

### Run server:

```
yarn workspace @trezor/transport-bluetooth server:dev
```
