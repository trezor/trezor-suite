# Coinjoin service is suite

## Development

For development and e2e purposes you can use local version of coinjoin backend (`Regtest` only).

**VPN is required for communication with affiliate server**

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
