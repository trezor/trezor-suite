# Supported coins

## The pipeline

Do not change `@trezor/connect-common/files/coins.json` manually.

The one and only source of truth are `*.json` definitions declared and maintained in the [firmware repository](https://github.com/trezor/trezor-firmware/tree/main/common/defs).

These are exported to a read-only [trezor-common](https://github.com/trezor/trezor-common) repository.

`trezor-common` is included as git submodule mounted at `submodules/trezor-common`.

## Update and maintenance in @trezor/connect

_Make sure that desired `[coin].json` definition is present in `trezor-firmware` repository *and* corresponding [support for connect](https://github.com/trezor/trezor-firmware/blob/4e005de02fbb9db11a304587ec1abe8aab80cdfd/common/defs/support.json#L3) is enabled._

1. Update `trezor-common` submodule:

```
 yarn update-submodules
```

2. Build `src/data/coins.json` file using `trezor-common/cointool`:

```
yarn update-coins
```
