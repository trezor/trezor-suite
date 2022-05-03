# @trezor/connect-iframe

Build `@trezor/connect` iframe hosted on `connect.trezor.io/*/iframe.html`

### Usage

This build will be used by `suite-web` and `suite-desktop` packages.
Build files are copied into `suite-*/build/static` directory.

### Build

`yarn workspace @trezor/connect-iframe build`

### Motivation

<!-- docs-todo: expand on why iframe exists -->

`suite-*` builds requires self-hosted `@trezor/connect` build to communicate with instead of official `connect.trezor.io`.
