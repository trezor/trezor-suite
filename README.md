# TREZOR SUITE MONOREPO

![img](https://repository-images.githubusercontent.com/148657224/439f6100-765f-11e9-9bff-b725eef3c4a6)

## Packages

| Name                 | Packages                                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| suite                | [core](./packages/suite), [web](./packages/suite-web), [desktop](./packages/suite-desktop), [native](./packages/suite-native), [data](./packages/suite-data), [storage](./packages/suite-storage) |
| components           | [components](./packages/components), [storybook native](./packages/components-storybook-native)                                                                                                   |
| rollout              | [rollout](./packages/rollout)                                                                                                                                                                     |
| blockchain-link      | [blockchain-link](./packages/blockchain-link)                                                                                                                                                     |
| translations-manager | [translations-manager](./packages/translations-manager)                                                                                                                                           |
| integration-tests    | [integration-tests](./packages/integration-tests)                                                                                                                                                 |

## Development

Before you start make sure you have downloaded and installed [Node.js LTS](https://nodejs.org/en/download/), [Yarn](https://yarnpkg.com/lang/en/docs/install/) and git.

-   `git clone git@github.com:trezor/trezor-suite.git`
-   `yarn && yarn build:libs`

_To set up your dev environment for a native platform (iOS/Android) follow [these additional steps](https://github.com/trezor/trezor-suite/tree/develop/packages/suite-native#development)._

Run a dev build:

-   `yarn suite:dev` (web app)
-   `yarn suite:dev:desktop` (electron app)
-   `yarn suite:dev:android` (react-native Android)
-   `yarn suite:dev:ios` (react-native iOS)

## Contribute

Inspired by [GitLab Contributing Guide](https://docs.gitlab.com/ee/development/contributing/)

Using [Conventional Commits](COMMITS.md) is strongly recommended and might be enforced in future.

## Security vulnerability disclosure

Please report suspected security vulnerabilities in private to [security@satoshilabs.com](mailto:security@satoshilabs.com), also see [the disclosure section on the Trezor.io website](https://trezor.io/security/). Please do NOT create publicly viewable issues for suspected security vulnerabilities.

## IDE specific settings

Find specific settings for Integrated Development Environments (IDE) in [IDE.md](./IDE.md)
