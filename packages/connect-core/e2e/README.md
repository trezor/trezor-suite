# @trezor/connect tests

## Node test

Testing `@trezor/connect` npm package in Node.js environment.

```
./docker/docker-connect-test.sh
```

you may use the following params:

```
-f <semver string such as 2.5.2>
-p <pattern to match tests files>
-i <in case -p methods, use -i to filter one connect method, such as -i binanceGetAddress>
```

## Browser test

Testing `@trezor/connect` in a browser environment using Vitest with Playwright.

For local changes to take effect build connect-iframe or connect-web depending where they were made and restart test.

```
TESTS_PATTERN="init" yarn workspace @trezor/connect-core test:e2e:web
```

## Referenced transactions

Bitcoin-like coins `signTransaction` method requires additional data about transactions referenced from used inputs. `@trezor/connect` doesn't fetch them from the backend, so the caller must provide them via the `refTxs` (or `account.transactions`) param. [see docs](https://connect.trezor.io/9/methods/bitcoin/signTransaction/)

Test fixtures provide them via the [getRefTxs](./__fixtures__/refTxs.ts) helper, which loads them from the `./__fixtures__/refTxs` directory, stored in the same structure as in [trezor-firmware](https://github.com/trezor/trezor-firmware/tree/main/tests/txcache) repository.

Missing tx json? use [this tool](./__fixtures__/refTxs/gen-reftx.ts) to generate it.

## Websocket cache

If `process.env.TESTS_USE_WS_CACHE` is set to `true` (default, disabled by the `-c` option of `docker-connect-test.sh`) then `@trezor/blockchain-link` is conditionally connected to a local websocket server returning cached results from `./__wscache__`.

[Server](./__wscache__/server.js)

[WsCacheServer in vitest.globalSetup](./vitest.globalSetup.ts)
