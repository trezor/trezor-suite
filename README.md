# Trezor Suite Monorepo
![img](https://repository-images.githubusercontent.com/148657224/439f6100-765f-11e9-9bff-b725eef3c4a6)

## Packages

Name            | Packages
--------------- | ----------
suite           | [core](./packages/suite), [web](./packages/suite-web), [desktop](./packages/suite-desktop), [native](./packages/suite-native), [onboarding](./packages/suite-onboarding)
components      | [components](./packages/components), [storybook](./packages/components-storybook), [storybook native](./packages/components-storybook-native)
rollout         | [rollout](./packages/rollout)
blockchain-link | [blockchain-link](./packages/blockchain-link)
connect-explorer | [connect-explorer](./packages/connect-explorer)

## Development

- `git clone git@github.com:trezor/trezor-suite.git`
- `yarn`
- `yarn build:libs`

*To set up your dev environment for a native platform (iOS/Android) follow [these additional steps](https://github.com/trezor/trezor-suite/tree/develop/packages/suite-native#development).*

Run a dev build:
- `yarn suite:dev` (web app)
- `yarn suite:dev:desktop` (electron app)
- `yarn suite:dev:android` (react-native Android)
- `yarn suite:dev:ios` (react-native iOS)

## Contribute

Inspired by [GitLab Contributing Guide](https://docs.gitlab.com/ee/development/contributing/)

## Security vulnerability disclosure

Please report suspected security vulnerabilities in private to [security@satoshilabs.com](mailto:security@satoshilabs.com), also see [the disclosure section on the Trezor.io website](https://trezor.io/security/). Please do NOT create publicly viewable issues for suspected security vulnerabilities.

## Issue Labels

#### Priority

Label     | Meaning (SLA)
----------|--------------
P1 Urgent | The current release + potentially immediate hotfix (30 days)
P2 High   | The next release (60 days)
P3 Medium | Within the next 3 releases (90 days)
P4 Low    | Anything outside the next 3 releases (120 days)

#### Severity

Label       | Impact
------------|-------
S1 Blocker  | Outage, broken feature with no workaround
S2 Critical | Broken feature, workaround too complex & unacceptable
S3 Major    | Broken feature, workaround acceptable
S4 Low      | Functionality inconvenience or cosmetic issue

## IDE specific settings
Find specific settings for Integrated Development Environments (IDE) in [IDE.md](./IDE.md)
