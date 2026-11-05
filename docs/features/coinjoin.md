# Coinjoin service is suite

## Testing against a public coordinator

Suite has no default coordinator for Bitcoin and Testnet. Coinjoin works only in the desktop app with Tor enabled, and signing needs firmware 2.7.2 or newer, or 1.13.0 or newer on Trezor Model One.

1. Run `yarn suite:dev:desktop`. It also rebuilds the main process, where the coinjoin client runs. Quit the Electron app it opens (Cmd+Q on macOS), the dev server keeps running.

1. Start Electron with the coordinator. Use `.test.` instead of `.btc.` for Testnet. The override applies only to this launch.

    ```bash
    yarn workspace @suite/desktop-app dev:run \
        '--state.wallet.coinjoin.debug.coinjoinConfigOverride.btc.coordinatorUrl=https://<coordinator>/wabisabi/' \
        '--state.wallet.coinjoin.debug.coinjoinConfigOverride.btc.wabisabiBackendUrl=https://<coordinator>/'
    ```

    > Override both urls. Without `wabisabiBackendUrl` the coordinator version is not requested and Suite reports stub values, so the debug panel links to a non-existent WalletWasabi build and the zkSNACKs legal documents version you agree to is a constant instead of the one the coordinator publishes.
    >
    > The main process whitelists only the coordinator host and its subdomains, so the backend url has to live there too. A sibling host (`api.example.com` next to `coord.example.com`) is blocked with `Request blocked, not whitelisted domain`.

## Development

For development and e2e purposes you can use local version of coinjoin backend (`Regtest` only).

> Nothing else has to be running. Suite used to spawn a bundled
> `WalletWasabi.WabiSabiClientLibrary` process and talk to it over a localhost port for the
> credential crypto, amount decomposition, input selection and anonymity scoring; all of
> that is now computed in process by `@trezor/wabisabi-crypto`,
> `@trezor/coinjoin-strategy` and `@trezor/coinjoin-analysis`.

1. run `./docker/docker-coinjoin-backend.sh`

    > If you are using `trezor-user-env` make sure that it's started with `-r` option (disabled regtest)
    >
    > Pull and run docker image of https://github.com/trezor/coinjoin-backend
    >
    > Backend control panel (faucet) should be accessible at `http://localhost:8080/`

1. Run suite, go to settings and enable `Debug mode` (click 5 times on the "Settings" header)

1. go to Settings > Crypto tab and enable `Bitcoin Regtest` and set custom backend to `http://localhost:19121/` (default)

    > Optionally disable other coins
    >
    > Coinjoin accounts are not using this backend but you want to have all Regtest accounts synchronized with the same bitcoind

1. Access coinjoin account

## A round without a device

`yarn workspace @trezor/coinjoin test:regtest` runs a whole round against the backend above
with throwaway taproot keys: it registers two inputs, confirms them, decomposes the amounts,
reissues and registers every output, signs and waits for the coordinator to broadcast. Every
credential is built by `packages/coinjoin/src/client/credentials.ts` and every decomposition
by `@trezor/coinjoin-strategy`, so it is the check that the client's credential requests are
accepted on the wire — the unit vectors only compare parsed values. The ownership proofs and
witnesses are signed locally instead of by a Trezor, so it does not replace one manual pass
through the UI with a device.

> The published backend image ships Bitcoin Knots v25.1.knots20231115, whose build expiry has
> passed, so its `bitcoind` needs `-softwareexpiry=0` to start at all.
