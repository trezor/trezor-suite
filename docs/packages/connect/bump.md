# Bump Connect in Suite

1. Change `trezor-connect` package version in `packages/suite/package.json`.
1. Run `yarn`, it will install the new Connect version.
1. Run `yarn workspace @trezor/connect-iframe build:lib`, it will build Connect files into `packages/connect-iframe/build`.
