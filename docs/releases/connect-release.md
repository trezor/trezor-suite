## @trezor/connect trezor.io release

-   [x] From develop branch create a pull requests into branch `release/connect-v9`

### After merging this PR

-   [release/connect-v9 pipeline](https://gitlab.com/satoshilabs/trezor/trezor-suite/-/pipelines?page=1&scope=branches&ref=release%2Fconnect-v9)
-   [ ] Tested and approved by @trezor/qa. Typically using [this build](https://suite.corp.sldev.cz/connect/release/connect-v9/). Changelog [here](https://github.com/trezor/trezor-suite/blob/release/connect-v9/packages/connect/CHANGELOG.md).
-   [ ] Release npm packages for `@trezor/connect` and `@trezor/connect-web` [from gitlab](https://gitlab.com/satoshilabs/trezor/trezor-suite/-/pipelines) @mroz22
-   [ ] Click manual deploy job to connect.trezor.io/9 in [gitlab](https://gitlab.com/satoshilabs/trezor/trezor-suite/-/pipelines?page=1&scope=branches&ref=release%2Fconnect-v9) @mroz22
-   [ ] Post a release bulletin into Slack @Hannsek
