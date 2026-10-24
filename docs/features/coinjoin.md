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

    > With the override in place the account grows a **Mixing** tab (`wallet-mixing`, `src/views/wallet/mixing`) holding the status wheel and privacy balance breakdown, the explanation of the process and the anonymity setup; the anonymize subpage (`wallet-anonymize`) is reachable from it. Without the override both routes redirect to the account overview, which then renders a plain balance and history.

    > The override is deliberately per-launch. A `--state` patch dispatches no action, and the coordinator override is stripped before the debug settings reach the `coinjoinDebugSettings` database store, so restarting without the argument hides mixing again. Do not write it through `setDebugSettings`.
    >
    > Regtest carries a localhost coordinator in `COINJOIN_NETWORKS`, but a configured coordinator is not an override: pass `--state.wallet.coinjoin.debug.coinjoinConfigOverride.regtest.coordinatorUrl=http://127.0.0.1:8081/backend/wabisabi/` to mix on Regtest too.
    >
    > The bundled `WalletWasabi.WabiSabiClientLibrary` scoring binary runs for every Privacy account regardless of the override, because anonymity scores decide what the account may spend.

## Spending restrictions of a Privacy account

Coins that went through a coinjoin round should not be combined with coins that did not, so the
account can hold back the low-anonymity ones from automatic coin selection. That restriction is
derived, not assumed: `selectCoinjoinSpendingRestrictionByAccountKey` reports one of three states.

- `unrestricted` — the account synced, its anonymity set is complete, it has no `joint` transaction
  and no score above 1. There is nothing to keep apart, so the account behaves like a target
  anonymity of 1: no utxo is excluded, no anonymity confirmation is asked and no banner shows. This
  is what a newly created, never mixed account gets.
- `restricted` — utxos below the stored `setup.targetAnonymity` (5 by default) stay out of
  automatic coin selection and remain spendable through coin control plus its confirmation
  checkbox. The account shows the explanatory banner.
- `restricted-incomplete-data` — the same, except the scores cannot be trusted (the account has not
  synced, or the local scoring binary did not deliver). Sending is blocked with an error that names
  the restrictions switch; receiving and rescan keep working.

The switch in account Details (`src/views/wallet/details/SpendingRestrictions.tsx`) stores a
per-account override on the coinjoin account, which wins over the derivation in both directions and
is the escape hatch out of the blocking state; turning it off asks for an explicit confirmation,
because automatic coin selection may then combine coins that can be linked on-chain. While mixing
is enabled the switch is forced on and read-only. A target anonymity stored by the old slider is
honoured: 1 keeps the account unrestricted, a raised target keeps it restricted.

The spending path reads `selectEffectiveTargetAnonymityByAccountKey`, which is 1 while the account
is unrestricted and the stored target otherwise, so `getExcludedUtxos` needs no change. Mixing
surfaces keep reading the stored target through `selectTargetAnonymityByAccountKey`.

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
