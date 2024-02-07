# @trezor/transport-bluetooth

### Server development

Prerequisites: RUST

### Vscode:

Vscode rust-analyzer extensions:

-   instal rust-analyzer plugin
-   install nix-env-selector plugin and follow readme to setup
    https://marketplace.visualstudio.com/items?itemName=arrterian.nix-env-selector

Vscode `.vscode/settings`:

"rust-analyzer.cargo.sysroot": "discover",
"rust-analyzer.diagnostics.disabled": ["unresolved-proc-macro"]
"rust-analyzer.linkedProjects": ["./packages/transport-bluetooth/Cargo.toml"]
"nixEnvSelector.nixFile": "${workspaceFolder}/packages/transport-bluetooth/shell.nix",

### NixOS:

```
nix-shell ./packages/transport-bluetooth/shell.nix
```

### MacOS:

### Linux:

### Run server:

```
yarn workspace @trezor/transport-bluetooth dev-server
```
