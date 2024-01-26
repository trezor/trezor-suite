# Connect explorer in a webextension

This packages aims to use connect-explorer in the context of a webextension in order to reuse the tests we have to test all the connect features in different contexts. It also serves as example for third party implementers of TrezorConnect in webextension.

## Development

Run it for dev:

```
yarn && \
yarn build:libs && \
yarn workspace @trezor/connect-webextension build && \
yarn workspace @trezor/connect-iframe build:core-module && \
yarn workspace @trezor/connect-explorer build:webextension && \
yarn workspace @trezor/connect-popup dev
```
