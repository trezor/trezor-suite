## @trezor/connect release

This is an automatically created PR.

-   [x] Bump @trezor/connect and @trezor/connect-web version using `yarn workspace @trezor/connect version:<beta|patch|minor|major>`
-   [x] Bump all connect dependencies that need to be released into npm. If unsure run `node ./ci/scripts/check-npm-dependencies.js connect`. Please note that this script will report unreleased dependencies even for changes that do not affect runtime (READMEs etc.)
-   [ ] Released bumped npm dependencies you should [into npm](./npm-packages.md). This still needs to be done in gitlab. @mroz22
-   [ ] Make sure [CHANGELOG](https://github.com/trezor/trezor-suite/blob/npm-release/connect/packages/connect/CHANGELOG.md) file has been updated @mroz22
-   [ ] Changelogs checked @Hannsek
-   [ ] Confirm that this release does not introduce any breaking changes @mroz22
-   [ ] Contact 3rd parties if needed @Hannsek
-   [ ] Merge this PR into develop
-   [ ] Run `release` job in github actions. This will create a new branch `release/connect/<version>` and trigger [Gitlab pipeline](https://gitlab.com/satoshilabs/trezor/trezor-suite/-/pipelines?page=1&scope=branches&ref=release%2Fconnect-v9). that prepares builds.
-   [ ] Tested and approved by @trezor/qa. Typically using [this build](https://staging-connect.trezor.io/).
-   [ ] Click `connect v9 deploy production` job in Gitlab. In case something went wrong there is `connect v9 rollback production` job which reverts current deploy. @mroz22
-   [ ] Release npm packages for `@trezor/connect` and `@trezor/connect-web` [from gitlab](https://gitlab.com/satoshilabs/trezor/trezor-suite/-/pipelines) @mroz22
-   [ ] Post a release bulletin into Slack @Hannsek
