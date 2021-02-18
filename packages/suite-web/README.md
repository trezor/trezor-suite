# @trezor/suite-web

Build target for web environment.

## Tests

Notes on testing strategies [here](./test/README.md)

## How to sync into staging

`ASSET_PREFIX=/suite yarn workspace @trezor/suite-web build`

and

`./scripts/s3sync.sh stage beta`
