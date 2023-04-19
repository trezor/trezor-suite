## @trezor/connect prerelease

-   [x] Bump version in all @trezor/connect\* packages (except plugin packages). `yarn workspace @trezor/connect version:<beta|patch|minor|major>` @trezor-ci
-   [ ] Make sure you have released all npm dependencies. If unsure run `node ./ci/scripts/check-npm-dependencies.js connect`. Please note that this script will report unreleased dependencies even for changes that do not affect runtime (READMEs etc.) If there are any unreleased npm dependencies you should [release them](./npm-packages.md) @mroz22
-   [ ] Make sure [CHANGELOG](https://github.com/trezor/trezor-suite/blob/npm-release/connect/packages/connect/CHANGELOG.md) file has been updated @mroz22
-   [ ] Changelogs checked @Hannsek
-   [ ] Confirm that this release does not introduce any breaking changes @mroz22
-   [ ] Contact 3rd parties if needed @Hannsek
