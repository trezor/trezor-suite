Run it for dev:

```
yarn && \
yarn build:libs && \
yarn workspace @trezor/connect-webextension build && \
yarn workspace @trezor/connect-iframe build:core-module && \
yarn workspace @trezor/connect-explorer build:webextension && \
yarn workspace @trezor/connect-popup dev
```
