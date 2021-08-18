# @trezor/connect-common

Bundle and build `trezor-connect` iframe.

### Usage
This build will be used by `suite-web` and `suite-desktop` packages.
Build files are copied into `suite-*/build/static` directory.

In the future, after moving `trezor-connect` to this monorepo it will be hosted on `connect.trezor.io/*/iframe.html`

### Build

`yarn workspace @trezor/connect-iframe build:lib`

### Motivation

`suite-*` builds requires self-hosted `trezor-connect` build to communicate with instead of official `connect.trezor.io`.

`trezor-connect` project needs to be moved to monorepo. This project should eventually replace `trezor-connect` [iframe entry point](https://github.com/trezor/connect/blob/develop/src/js/iframe/iframe.js)

`firmware releases` should be provided by suite monorepo `@trezor/connect-common` package.

### Notes

`@trezor/blockchain-link": "*"` and `"@trezor/rollout": "*"` are listed as dependency to prevent `lerna` from calling `build:lib` before the are installed. This will probably change after moving `trezor-connect` to monorepo.
