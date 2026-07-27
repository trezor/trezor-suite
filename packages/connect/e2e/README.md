# @trezor/connect tests

## docker-connect-test.sh

The script at `docker/docker-connect-test.sh` (repo root) spins up `trezor-user-env` via Docker and runs the integration tests. The first argument is required and selects the test environment:

```sh
# Node.js (vitest)
./docker/docker-connect-test.sh node

# Browser (vitest + playwright)
./docker/docker-connect-test.sh web
```

All options:

| Flag             | Description                                                  | Default        |
| ---------------- | ------------------------------------------------------------ | -------------- |
| `-f <version>`   | Firmware version, e.g. `2.5.2`                               | latest main    |
| `-b <branch>`    | Firmware branch                                              |                |
| `-u <url>`       | Firmware URL                                                 |                |
| `-m <model>`     | Firmware model, e.g. `R`                                     |                |
| `-o`             | Use BTC-only firmware (requires `-b`)                        |                |
| `-i <methods>`   | Run only these methods, e.g. `applySettings,signTransaction` |                |
| `-e <methods>`   | Exclude these methods                                        |                |
| `-p <pattern>`   | Test file pattern                                            |                |
| `-r`             | Randomize test order (node only)                             |                |
| `-t <transport>` | Transport / bridge version                                   | `node-bridge`  |
| `-c`             | Disable transaction and WebSocket cache                      | cache enabled  |
| `-d`             | Skip Docker (use your own `trezor-user-env` instance)        | Docker enabled |
| `-D <path>`      | Path to docker executable (e.g. `podman`)                    | `docker`       |

Examples:

```sh
# Run against a specific firmware version
./docker/docker-connect-test.sh node -p "methods" -f "2-latest" -m T3W1 -i signTransaction -t node-bridge

# Run browser tests without Docker (own trezor-user-env instance)
./docker/docker-connect-test.sh web -d
```

## Browser test (without Docker)

Testing `@trezor/connect` in a browser environment using Vitest with Playwright.

For local changes to take effect, rebuild `connect-web` before restarting.

```sh
TESTS_PATTERN="init" yarn workspace @trezor/connect test:e2e:web
```

## Transactions cache

Bitcoin-like coins `signTransaction` method require additional data about transactions referenced from used inputs.

Those data are automatically downloaded from backend defined in `coins.json` by default if `refTxs` param is not specified.

_Note: Backends hosted on `*.trezor.io` are limiting requests per min._
_Too many requests from not whitelisted origins may be penalized with temporary ban. ("All backends are down" error)_

Backend connection will be omitted in case of providing `refTxs` so even coins without officially supported backends (like zcash testnet) may sign a transaction in _"offline mode"_. [see docs](https://connect.trezor.io/9/methods/bitcoin/signTransaction/)

To reduce network traffic `Github Actions CI` is using **cached** (offline) mode and whitelisted `Github CI` is using **default** (online) mode.

Cached transactions are stored in `./tests/__txcache__` directory in the same structure as in [trezor-firmware](https://github.com/trezor/trezor-firmware/tree/main/tests/txcache) repository.

Cached transactions are provided to test fixtures via [TX_CACHE](./__txcache__/index.js) utility.

Missing tx json? use [this tool](./__txcache__/gen-reftx.js) to generate it.

## Websocket cache

Similar to transaction cache. If `process.env.TESTS_USE_WS_CACHE` is set to `true` then `@trezor/blockchain-link` is conditionally connected to a local websocket server returning cached results from `./tests/__wscache__`.

[Server](./__wscache__/server.js)

[WsCacheServer in vitest.globalSetup](./vitest.globalSetup.ts)
