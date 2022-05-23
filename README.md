# TREZOR SUITE MONOREPO

![img](https://repository-images.githubusercontent.com/148657224/439f6100-765f-11e9-9bff-b725eef3c4a6)

## Packages

| package                                                               | description                                  |
| --------------------------------------------------------------------- | -------------------------------------------- |
| [@trezor/blockchain-link](./packages/blockchain-link)                 | lib for connecting to blockchains            |
| [@trezor/components](./packages/components)                           | frontend react components                    |
| [@trezor/connect](./packages/connect)                                 | 3rd party interface entrypoint for nodejs    |
| [@trezor/connect-examples](./packages/connect-examples)               | example implementations of @trezor/connect   |
| [@trezor/connect-common](./packages/connect-common)                   | static files and commons for @trezor/connect |
| [@trezor/connect-explorer](./packages/connect-explorer)               | interactive demo for @trezor/connect         |
| [@trezor/connect-iframe](./packages/connect-iframe)                   | connect-iframe build from monorepo           |
| [@trezor/connect-plugin-ethereum](./packages/connect-plugin-ethereum) | plugin for 3rd party ethereum wallets        |
| [@trezor/connect-popup](./packages/connect-popup)                     | UI for 3rd party implementations             |
| [@trezor/connect-web](./packages/connect-web)                         | 3rd party interface entrypoint for browser   |
| [@trezor/integration-tests](./packages/integration-tests)             | cross-packages e2e tests                     |
| [@trezor/news-api](./packages/news-api)                               | medium proxy providing allow-origin headers  |
| [@trezor/suite-build](./packages/suite-build)                         | build utilities                              |
| [@trezor/suite-data](./packages/suite-data)                           | suite static data                            |
| [@trezor/suite-desktop-api](./packages/suite-desktop-api)             | API for suite - suite-desktop communication  |
| [@trezor/suite-desktop](./packages/suite-desktop)                     | suite build target for Mac, Win, Linux       |
| [@trezor/suite-native](./packages/suite-native)                       | suite build target for react-native          |
| [@trezor/suite-storage](./packages/suite-storage)                     | abstract database definition for suite       |
| [@trezor/suite-web-landing](./packages/suite-web-landing)             | https://suite.trezor.io/                     |
| [@trezor/suite-web](./packages/suite-web)                             | suite build target for web                   |
| [@trezor/suite](./packages/suite)                                     | trezor suite common code                     |
| [@trezor/transport-native](./packages/transport-native)               | communication lib for react-native           |
| [@trezor/transport](./packages/transport)                             | communication lib for javascript             |
| [@trezor/utils](./packages/utils)                                     | shared utility functions                     |
| [@trezor/utxo-lib](./packages/utxo-lib)                               | btc-like coins lib                           |

## @trezor/suite development

Before you start make sure you have downloaded and installed [NVM](https://github.com/nvm-sh/nvm), [Yarn](https://yarnpkg.com/lang/en/docs/install/) and git with [git lfs](https://git-lfs.github.com/).

-   `git clone git@github.com:trezor/trezor-suite.git`
-   `git lfs pull`
-   `nvm install`
-   `yarn`
-   `yarn build:libs && yarn workspace @trezor/suite-data msg-system-sign-config`

_To set up your dev environment for a native platform (iOS/Android) follow [these additional steps](https://github.com/trezor/trezor-suite/tree/develop/packages/suite-native#development)._

Run a dev build:

-   `yarn suite:dev` (web app)
-   `yarn suite:dev:desktop` (electron app)
-   `yarn suite:dev:android` (react-native Android)
-   `yarn suite:dev:ios` (react-native iOS)

## @trezor/connect development

Trezor Connect is a platform for easy integration of Trezor hardware wallets into 3rd party applications.
Historically, trezor-connect had its [own repository](https://github.com/trezor/connect). This repository is still active and accepts hotfixes for trezor-connect version 8.

@trezor/connect version 9 is developed in this repository only.

## Contribute

Inspired by [GitLab Contributing Guide](https://docs.gitlab.com/ee/development/contributing/)

Using [Conventional Commits](COMMITS.md) is strongly recommended and might be enforced in future.

## Security vulnerability disclosure

Please report suspected security vulnerabilities in private to [security@satoshilabs.com](mailto:security@satoshilabs.com), also see [the disclosure section on the Trezor.io website](https://trezor.io/security/). Please do NOT create publicly viewable issues for suspected security vulnerabilities.

## IDE specific settings

Find specific settings for Integrated Development Environments (IDE) in [IDE.md](./IDE.md)
