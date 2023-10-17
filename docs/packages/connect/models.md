# Models

## The pipeline

Do not change `@trezor/connect/src/data/models.ts` manually.

The one and only source of truth is `models.json` definition declared and maintained in the [firmware repository](https://github.com/trezor/trezor-firmware/tree/main/common).

These are exported to a read-only [trezor-common](https://github.com/trezor/trezor-common) repository.

`trezor-common` is included as git submodule mounted at `submodules/trezor-common`.

## Update and maintenance in @trezor/connect

1. Update `trezor-common` submodule:

```
 yarn update-submodules
```

2. Copy `models.json` to `trezor/connect/src/data/models.ts`:

```
yarn update-models
```
