# Coinjoin service is suite

## Testing against a public coordinator

Suite has no default coordinator for Bitcoin and Testnet. Coinjoin works only in the desktop app with Tor enabled, and signing needs firmware 2.7.2 or newer, or 1.13.0 or newer on Trezor Model One.

1. Run `yarn suite:dev:desktop`. It also rebuilds the main process, where the coinjoin client runs. Quit the Electron app it opens (Cmd+Q on macOS), the dev server keeps running.

1. Start Electron with the coordinator. Use `.test.` instead of `.btc.` for Testnet. The override applies only to this launch.

    ```bash
    yarn workspace @suite/desktop-app dev:run '--state.wallet.coinjoin.debug.coinjoinConfigOverride.btc.coordinatorUrl=https://<coordinator>/wabisabi/'
    ```

## Development

For development and e2e purposes you can use local version of coinjoin backend (`Regtest` only).

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
