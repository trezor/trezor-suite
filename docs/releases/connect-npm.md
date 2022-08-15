## @trezor/connect npm release

-   [x] Bump version in all @trezor/connect\* packages (except plugin packages). `yarn workspace @trezor/connect version:<beta|patch|minor|major>`
-   [ ] Make sure you have released all npm dependencies. If unsure run `node ./ci/scripts/check-npm-dependencies.js connect`. Please note that this script will report unreleased dependencies even for changes that do not affect runtime (READMEs etc.)
-   [ ] If there are any unreleased npm dependencies you should [release them](./npm-packages.md)
-   [ ] Make sure CHANGELOG files have been updated
-   [ ] Release npm packages for `@trezor/connect` and `@trezor/connect-web` [from gitlab](https://gitlab.com/satoshilabs/trezor/trezor-suite/-/pipelines)
