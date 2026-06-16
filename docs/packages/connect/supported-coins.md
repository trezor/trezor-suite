# Supported coins

## The pipeline

The coin definitions in `@trezor/connect-data/files/coins.json` originate from the
`*.json` definitions maintained in the [firmware repository](https://github.com/trezor/trezor-firmware/tree/main/common/defs)
and were historically exported through the read-only [trezor-common](https://github.com/trezor/trezor-common)
repository.

The automated `yarn update-coins` sync from `trezor-common` has been retired —
`coins.json` is no longer regenerated from upstream and is now maintained manually
in this repository.

## Update and maintenance in @trezor/connect

Edit `@trezor/connect-data/files/coins.json` directly and keep it formatted with
`yarn prettier --write packages/connect-data/files/coins.json`.

When adding a coin, make sure the corresponding [support for connect](https://github.com/trezor/trezor-firmware/blob/main/common/defs/support.json)
is enabled in the firmware definitions it is derived from.
