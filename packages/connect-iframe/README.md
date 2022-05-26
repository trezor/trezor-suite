# @trezor/connect-iframe

Build `@trezor/connect` `iframe`, which enables secure communication with [@trezor/connect-web](../connect-web) for third parties and web version of Suite. Official versions of the `iframe` are hosted on `connect.trezor.io/<version>/iframe.html`

## Usage

This build is then used in web version of Suite.
Build files are copied into `suite-*/build/static` directory during app build a defined in [@trezor/suite-build](../suite-build).

## Build

`yarn workspace @trezor/connect-iframe build`

## Motivation

Third-party apps and browser extensions connecting to Trezor must use [@trezor/connect-web](../connect-web) loaded into an `iframe` hosted at `connect.trezor.io` to ensure secure communication. Requests from self-hosted implementations on other domains will be rejected.

For `suite-*` builds, self-hosted `@trezor/connect` build is used, so the `iframe` is hosted on `localhost` during development or on `trezor.io` domain in production.
