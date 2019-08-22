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

## Instalation

Clone the repository:
- `git clone git@github.com:trezor/trezor-suite.git`

Enable the NodeSource repository:
- `curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash`

Install Node.js and npm:
- `sudo apt install nodejs`

Open cloned repository folder and Install yarn:
- `curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -`
- `echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list`
- `sudo apt-get update && sudo apt-get install yarn`

Install dependencies from packages.json:
- `npm install`

Build packages:
- `yarn build.libs`

Run yarn:
- `yarn suite:dev`

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
