# connect-explorer-nextra

Revamped version of `connect-explorer` with a new UI and more features.

Using [Nextra](https://nextra.site) docs framework.

## Running

```bash
yarn dev
```

## Building

```bash
yarn build
```

Static files will be generated in `build/` directory.

## Building webextension

We are building a webextension that uses `@trezor/connect-explorer-nextra` and `@trezor/connect-webextension`. This webextension aims to be used for testing TrezorConnect in the webextension environment using the same tests we use for web with connect-popup.

You can build the web extension running the command bellow:

```bash
yarn && \
yarn build:libs && \
yarn workspace @trezor/connect-webextension build && \
yarn workspace @trezor/connect-explorer-nextra build:webextension
```
