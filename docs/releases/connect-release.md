## @trezor/connect release

This is an automatically created PR with everything need for @trezor/connect release.

-   [x] Bump @trezor/connect and @trezor/connect-web version using `yarn workspace @trezor/connect version:<beta|patch|minor|major>`
-   [x] Bump all connect dependencies that need to be released into npm. If unsure run `node ./ci/scripts/check-npm-dependencies.js connect`. Please note that this script will report unreleased dependencies even for changes that do not affect runtime (READMEs etc.)
-   [ ] Released bumped npm dependencies you should [into npm](./npm-packages.md). This still needs to be done in gitlab. @mroz22
-   [ ] Make sure [CHANGELOG](https://github.com/trezor/trezor-suite/blob/npm-release/connect/packages/connect/CHANGELOG.md) file has been updated @mroz22
-   [ ] Changelogs checked @Hannsek
-   [ ] Confirm that this release does not introduce any breaking changes @mroz22
-   [ ] Contact 3rd parties if needed @Hannsek
-   [ ] Merge this PR into develop
-   [ ] Merge develop into release/connect-v9
-   [ ] Tested and approved by @trezor/qa. Typically using [this build](https://suite.corp.sldev.cz/connect/release/connect-v9/). Changelog [here](https://github.com/trezor/trezor-suite/blob/release/connect-v9/packages/connect/CHANGELOG.md).
-   [ ] Release npm packages for `@trezor/connect` and `@trezor/connect-web` [from gitlab](https://gitlab.com/satoshilabs/trezor/trezor-suite/-/pipelines) @mroz22
-   [ ] Click manual deploy job to connect.trezor.io/9 in [gitlab](https://gitlab.com/satoshilabs/trezor/trezor-suite/-/pipelines?page=1&scope=branches&ref=release%2Fconnect-v9) @mroz22
-   [ ] Post a release bulletin into Slack @Hannsek
