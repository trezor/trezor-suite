# trezor-connect tests

## jest test

Testing `trezor-connect` npm package in nodejs environment.

```
./docker/docker-connect-test.sh
```

or

```
yarn workspace @trezor/integration-tests test:connect
```

## karma tests

Testing `./packages/connect-iframe/build` directory in browser environment.

```
./docker/docker-connect-test-karma.sh
```

or

```
yarn workspace @trezor/integration-tests test:connect:karma
```

## Transactions cache

Bitcoin-like coins `signTransaction` method require additional data about transactions referenced from used inputs.

Those data are automatically downloaded from backend defined in `coins.json` by default if `refTxs` param is not specified.

_Note: Backends hosted on `*.trezor.io` are limiting requests per min._
_Too many requests from not whitelisted origins may be penalized with temporary ban. ("All backends are down" error)_

Backend connection will be omitted in case of providing `refTxs` so even coins without officially supported backends (like zcash testnet) may sign a transaction in _"offline mode"_. [see docs](../docs/method/signTransaction.md)

To reduce network traffic `Github Actions CI` is using **cached** (offline) mode and whitelisted `GitLab CI` is using **default** (online) mode.

Cached transactions are stored in `./tests/__txcache__` directory in the same structure as in [trezor-firmware](https://github.com/trezor/trezor-firmware/tree/master/tests/txcache) repository.

Cached transactions are provided to test fixtures via [TX_CACHE](./__txcache__/index.js) utility.

Missing tx json? use [this tool](./__txcache__/gen-reftx.js) to generate it.

## Websocket cache

Similar to transaction cache. If `process.env.TESTS_USE_WS_CACHE` is set to `true` then `@trezor/blockchain-link` is conditionally connected to a local websocket server returning cached results from `./tests/__wscache__`.

[Server](./__wscache__/server.js)

[WebSocketServer in Karma plugin](./karma.plugin.js)

[WsCacheServer in jest.setup](./jest.setup.js)
