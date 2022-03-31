# @trezor/connect-iframe

Bundle and build `@trezor/connect` iframe.

### Usage

This build will be used by `suite-web` and `suite-desktop` packages.
Build files are copied into `suite-*/build/static` directory.

<!-- docs-todo: almost there-->

In the future, after moving `trezor-connect` to this monorepo it will be hosted on `connect.trezor.io/*/iframe.html`

### Build

`yarn workspace @trezor/connect-iframe build:lib`

### Motivation

<!-- docs-todo: expand on why iframe exists -->

`suite-*` builds requires self-hosted `@trezor/connect` build to communicate with instead of official `connect.trezor.io`.

### Notes

`@trezor/blockchain-link": "*"` and `"@trezor/utxo-lib": "*"` and other monorepo packages used in connect are listed as dependency to prevent `lerna` from calling `build:lib` before the are installed. This will probably change after moving `trezor-connect` to monorepo.
