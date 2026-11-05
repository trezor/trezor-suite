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

## WARD (firmware branch)

WARD is not part of any released firmware: it lives in the
[`petrsusil/ward-poc-encrypted`](https://github.com/trezor/trezor-firmware/tree/petrsusil/ward-poc-encrypted)
branch of `trezor-firmware`. So the WARD arc ([`tests/device/ward.test.ts`](./tests/device/ward.test.ts))
is opt-in: it only runs when the emulator is started **from a firmware branch**, and skips on every
other matrix. It also runs wardd in the same process as Connect's core (the `wardd` setting), so it
runs in the **node** environment only.

`trezor-user-env` builds the emulator from the branch you name (`-b`, wired through
`TESTS_FIRMWARE_BRANCH` → `emulator-start-from-branch`):

```
./docker/docker-connect-test.sh node -b petrsusil/ward-poc-encrypted -m T3T1 -p ward
```

or directly against a running `trezor-user-env`:

```
TESTS_FIRMWARE_BRANCH=petrsusil/ward-poc-encrypted \
TESTS_FIRMWARE_MODEL=T3T1 \
TESTS_PATTERN=ward \
yarn workspace @trezor/connect-core test:e2e:node
```

In CI, dispatch the **`[Test] connect custom e2e setup`** workflow with
`deviceBranch=petrsusil/ward-poc-encrypted`, `groups=ward`.

The arc covers the whole relay: sync, insert, lookup with the stored label, proven non-membership,
update, display address, and delete.

## Referenced transactions

Bitcoin-like coins `signTransaction` method requires additional data about transactions referenced from used inputs. `@trezor/connect` doesn't fetch them from the backend, so the caller must provide them via the `refTxs` (or `account.transactions`) param. [see docs](https://connect.trezor.io/10/methods/bitcoin/signTransaction/)

Test fixtures provide them via the [getRefTxs](./__fixtures__/refTxs.ts) helper, which loads them from the `./__fixtures__/refTxs` directory, stored in the same structure as in [trezor-firmware](https://github.com/trezor/trezor-firmware/tree/main/tests/txcache) repository.

Missing tx json? use [this tool](./__fixtures__/refTxs/gen-reftx.ts) to generate it.

## Websocket cache

If `process.env.TESTS_USE_WS_CACHE` is set to `true` (default, disabled by the `-c` option of `docker-connect-test.sh`) then `@trezor/blockchain-link` is conditionally connected to a local websocket server returning cached results from `./__wscache__`.

[Server](./__wscache__/server.js)

[WsCacheServer in vitest.globalSetup](./vitest.globalSetup.ts)
