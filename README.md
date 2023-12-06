# TREZOR SUITE MONOREPO

Welcome to the Trezor Suite repository! This repository contains the source code for 3 projects:

-   **Connect** - tool that offers developers an easy way to integrate Trezor's functionality into their own applications
-   **Trezor Suite** - desktop and web application for managing Trezor hardware wallet
-   **Trezor Suite Lite** - Mobile application designed for tracking user portfolios

![img](https://repository-images.githubusercontent.com/148657224/439f6100-765f-11e9-9bff-b725eef3c4a6)

# Development

### Prerequisities

-   [NVM](https://github.com/nvm-sh/nvm)
-   [Yarn](https://yarnpkg.com/lang/en/docs/install/)
-   [Git LFS](https://git-lfs.github.com/) (For Linux/Ubuntu, [after adding the repository](https://packagecloud.io/github/git-lfs/install) do `sudo apt-get install git-lfs`, more info [here](https://github.com/git-lfs/git-lfs/blob/main/INSTALLING.md))

### Getting started

-   `git clone git@github.com:trezor/trezor-suite.git`
-   `git submodule update --init --recursive`
-   `git lfs install` // Set up Git LFS for your user account. You only need to run this once per user account.
-   `git lfs pull`
-   `nvm install`
-   `yarn`
-   `yarn build:libs`

It's recommended to enable `git config --global submodule.recurse true` so you don't need to run `git submodule update --init --recursive` every time when submodules are updated.

> You don't need a Trezor device to get into the app, you can use emulator. There is a [Trezor User Env](https://github.com/trezor/trezor-user-env) to help you set it up and run emulator for any Trezor model 🎉

## **Connect** @trezor/connect

This repository is used for development of version 9 of @trezor/connect. For detailed documentation, please refer to this [page](./docs/packages/connect/index.md).

Historically, Trezor Connect had its [own repository](https://github.com/trezor/connect). This repository is now archived.

## **Trezor Suite** @trezor/suite

Run a dev build:

-   `yarn suite:dev` (web app)
-   `yarn suite:dev:desktop` (electron app)

## **Trezor Suite Lite** @trezor/suite-native

> To set up your dev environment for a native platform (iOS/Android) follow [these additional steps](https://github.com/trezor/trezor-suite/tree/develop/suite-native/app#prerequisites).

## Contribute

Inspired by [GitLab Contributing Guide](https://docs.gitlab.com/ee/development/contributing/)

Using [Conventional Commits](COMMITS.md) is strongly recommended.

## Security vulnerability disclosure

Please report suspected security vulnerabilities in private to [security@satoshilabs.com](mailto:security@satoshilabs.com), also see [the disclosure section on the Trezor.io website](https://trezor.io/support/a/how-to-report-a-security-issue). Please do NOT create publicly viewable issues for suspected security vulnerabilities.

## IDE specific settings

Find specific settings for Integrated Development Environments (IDE) in [IDE.md](./IDE.md)
