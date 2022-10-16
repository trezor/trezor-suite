# Coinjoin service is suite

**Note: Coinjoin is still in development mode and will not work with official firmware release**

## Development

For development and e2e purposes you can use local version of coinjoin backend (`Regtest` only).

1. run `./docker/docker-coinjoin-backend.sh`

    > Pull and run docker image of https://github.com/trezor/coinjoin-backend
    >
    > Backend control panel (faucet) should be accessible at `http://localhost:8081`

1. Run suite, go to settings and enable `Debug mode` (click 5 times on the "Settings" header)

1. go to Settings > Crypto tab and enable `Bitcoin Regtest` and set custom backend to `http://localhost:19215`

    > Optionally disable other coins
    >
    > Coinjoin accounts are not using this backend but you want to have all Regtest accounts synchronized with the same bitcoind

1. go to Settings > Debug tab and change "Coinjoin Regtest server" to "localhost"

1. Access coinjoin account
