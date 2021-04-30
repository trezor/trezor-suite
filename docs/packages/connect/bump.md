# Bump Connect in Suite

1. Change `trezor-connect` package version in `packages/suite/package.json`.
2. Run `yarn`, it will install the new Connect version.
3. Run `yarn build:connect`, it will build Connect files into `packages/suite-data/files/connect`.
4. Commit your changes.
