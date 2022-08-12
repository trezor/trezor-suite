## @trezor/connect step by step release process

-   Make sure you have released all npm dependencies. If unsure run `node ./ci/scripts/check-npm-dependencies.js connect`. Please note that this script will report unreleased dependencies even for changes that do not affect runtime (READMEs etc.)
-   If there are any unreleased npm dependencies you should [release them](./npm-packages.md)
-   bump version in all @trezor/connect\* packages (except plugin packages). `yarn workspace @trezor/connect version:<beta|patch|minor|major>`
-   make sure CHANGELOG files have been updated
-   create npm release for `@trezor/connect` and `@trezor/connect-web` packages.
-   merge into develop branch
-   from develop branch create a pull requests into branch `release/connect-v9`
-   gitlab: click manual release `@trezor/connect-web` and `@trezor/connect` into npm
-   gitlab: click manual deploy job to connect.trezor.io/9
