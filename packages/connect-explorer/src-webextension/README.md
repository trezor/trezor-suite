Run it for dev:

```
yarn && \
yarn build:libs && \
yarn workspace @trezor/connect-webextension build && \
node packages/connect-examples/update-webextensions-sw.js && \
yarn workspace @trezor/connect-explorer build:webextension && \
yarn workspace @trezor/connect-popup dev
```
