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
TESTS_PATTERN="init" yarn workspace @trezor/connect test:e2e:web
```

## WARD (firmware branch)

WARD is not part of any released firmware — it lives in a `trezor-firmware` branch — and its
multi-session THP parts need the **T3W1** model. So the WARD arc
([`tests/device/ward.test.ts`](./tests/device/ward.test.ts)) is opt-in: it only runs when the
emulator is started **from a firmware branch** on T3W1, and skips on every other matrix.

`trezor-user-env` builds the emulator from the branch you name (`-b`, wired through
`TESTS_FIRMWARE_BRANCH` → `emulator-start-from-branch`). The WARD firmware lives on the
[`petrsusil/ward-draft`](https://github.com/trezor/trezor-firmware/tree/petrsusil/ward-draft) branch
of `trezor-firmware`. Run the offline queue arc locally with:

```
./docker/docker-connect-test.sh node -b petrsusil/ward-draft -m T3W1 -p ward
```

or directly against a running `trezor-user-env`:

```
TESTS_FIRMWARE_BRANCH=petrsusil/ward-draft \
TESTS_FIRMWARE_MODEL=T3W1 \
TESTS_PATTERN=ward \
yarn workspace @trezor/connect test:e2e:node
```

In CI, dispatch the **`[Test] connect custom e2e setup`** workflow with
`deviceModel=T3W1`, `deviceBranch=petrsusil/ward-draft`, `groups=ward`.

This covers the OFFLINE queue methods (`wardQueueSetEntry` / `wardQueueGetEntry` /
`wardQueueDeleteEntry` / `wardResetApp`) end to end against real firmware. The ONLINE
reads/writes/flushes (`wardGetEntry` / `wardSetEntry` / `wardFlushQueue`) need a `wardd` replica and
are covered by [`packages/connect-cli/e2e/ward-queue.sh`](../../connect-cli/e2e/ward-queue.sh).

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
