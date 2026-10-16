# Coinjoin service is suite

Coinjoin was discontinued on 1 June 2024 and the public coordinators are gone. The account type
lives on as the **Privacy** account, which discovers, synchronizes and spends without any Wasabi
infrastructure, so mixing is hidden by default: Suite shows the mixing surfaces only when a
coordinator is passed at startup, as described below.

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

1. Open the Privacy account. The override is what reveals mixing: `selectIsMixingEnabled` keys off the presence of `coordinatorUrl` in `wallet.coinjoin.debug.coinjoinConfigOverride[symbol]`, and every mixing surface and coordinator interaction keys off that one selector. The message-system `coinjoin` feature flag still works as a remote kill switch on top of it.

    > The override is deliberately per-launch. A `--state` patch dispatches no action, and the coordinator override is stripped before the debug settings reach the `coinjoinDebugSettings` database store, so restarting without the argument hides mixing again. Do not write it through `setDebugSettings`.
    >
    > Regtest carries a localhost coordinator in `COINJOIN_NETWORKS`, but a configured coordinator is not an override: pass `--state.wallet.coinjoin.debug.coinjoinConfigOverride.regtest.coordinatorUrl=http://127.0.0.1:8081/backend/wabisabi/` to mix on Regtest too.
    >
    > The bundled `WalletWasabi.WabiSabiClientLibrary` scoring binary runs for every Privacy account regardless of the override, because anonymity scores decide what the account may spend.

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
