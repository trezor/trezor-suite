# trezor-connect tests

## Continuous Integration

Tests are powered by [trezor-user-env](https://github.com/trezor/trezor-user-env) which is [daily built](https://gitlab.com/satoshilabs/trezor/trezor-user-env/-/pipelines) into a **docker image** providing all the necessary instrumentation required to run tests (bridge and emulators).

Tests are running in two environments:

[SatoshiLabs GitLab CI](https://gitlab.com/satoshilabs/trezor/connect/-/pipelines) NixOS runner

_Test are running **directly** in `trezor-user-env` **docker image**. All required variables are declared in [gitlab-ci.yml](../.gitlab-ci.yml) config file._

[Github Actions CI](https://github.com/trezor/connect/actions) Ubuntu runner

_Test are using [run.sh](./run.sh) script to spin up `trezor-user-env` **docker image** and set all required variables._

## Run it locally

_Note: All paths below are relative to the root of trezor-connect repository._

_Note: Running tests with custom firmware [is not currently possible](https://github.com/trezor/trezor-user-env/issues/49)._

### On Linux

#### Prerequisites

-   [Docker](https://docs.docker.com/engine/install/)
-   [Podman](https://podman.io/getting-started/installation) using `tests/run.sh -D podman` (not officially supported)

### On MacOS

_Note: As of now M1 Macs aren't supported. See [this issue](https://github.com/trezor/trezor-suite/issues/3616) for detailed information._

_Note: Running all test at once using Docker for Mac v20 may end up with `unexpected EOF` [error](https://github.com/docker/for-mac/issues/5145)._

_Note: Running test with graphical output from emulator may end up with `device disconnected during action` error._

#### Prerequisites

-   [Docker](https://docs.docker.com/docker-for-mac/install/)

### Steps

_Note: Make sure that your default/local `trezord` is disabled and all physical Trezor devices are disconnected._

_Note: Running all test at once may take a while. It is recommended to narrow the subset using `-i methodName` option._

_Note: If you are running `trezor-user-env` docker image as [standalone process](./run.sh#L19-L25) in terminal use `-d` option._

1. See available options `tests/run.sh -h`
1. Limit tests to subset of methods use `tests/run.sh -i getPublicKey,getAddress`
1. Run all tests `tests/run.sh` (may take some time)

## How to add tests

1. Create or modify file in `tests/__fixtures__`
1. Make sure it is imported in `tests/__fixtures__/index.js`
1. Make sure the method you are testing is listed in `.github/workflows/*.yml` and `.gitlab-ci.yml`

## Transactions cache

Bitcoin-like coins `signTransaction` method require additional data about transactions referenced from used inputs.

Those data are automatically downloaded from backend defined in `coins.json` by default if `refTxs` param is not specified.

_Note: Backends hosted on `*.trezor.io` are limiting requests per min._
_Too many requests from not whitelisted origins may be penalized with temporary ban. ("All backends are down" error)_

Backend connection will be omitted in case of providing `refTxs` so even coins without officially supported backends (like zcash testnet) may sign a transaction in _"offline mode"_. [see docs](../docs/method/signTransaction.md)

To reduce network traffic `Github Actions CI` is using **cached** (offline) mode and whitelisted `GitLab CI` is using **default** (online) mode.

Caching is enabled by default. To disable it use `tests/run.sh -c` option.

Cached transactions are stored in `tests/__txcache__` directory in the same structure as in [trezor-firmware](https://github.com/trezor/trezor-firmware/tree/master/tests/txcache) repository.

Cached transactions are provided to test fixtures via [TX_CACHE](./__txcache__/index.js) utility.

Missing tx json? use [this tool](./__txcache__/gen-reftx.js) to generate it.

## Websocket cache

Similar to transaction cache. If `process.env.TESTS_USE_WS_CACHE` is set to `true` then `@trezor/blockchain-link` is conditionally connected to a local websocket server returning cached results from `tests/__wscache__`.

[Server](./__wscache__/server.js)

[WebSocketServer in Karma plugin](./karma.plugin.js)

[WsCacheServer in jest.setup](./jest.setup.js)

## Karma production tests

Testing `./build` directory in browser environment.

Run: `./tests/run.sh -s "yarn test:karma:production" -i getAddress`
