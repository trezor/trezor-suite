# @trezor/connect API version 9.0.0-beta.4

[![Build Status](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml/badge.svg)](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml)
[![NPM](https://img.shields.io/npm/v/@trezor/connect.svg)](https://www.npmjs.org/package/@trezor/connect)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/connect/badge.svg?targetFile=package.json)](https://snyk.io/test/github/trezor/trezor-suite?targetFile=packages/connect/package.json)

Trezor Connect is a platform for easy integration of Trezor into 3rd party services, as well as into Trezor Suite. It provides an API with functionality to access public keys, sign transactions and authenticate users.

User interface is presented in a secure popup window served from `connect.trezor.io/<version>/popup.html`. To try it out, use [@trezor/connect-explorer](../connect-explorer) hosted [here](https://trezor.github.io/trezor-suite/connect-explorer).

-   [Integration](https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md)

## Version 9+ (experimental)

Since version 9 we are adopting a new versioning strategy. With every release, we are going to update two urls

-   A] The latest release will always be available on https://connect.trezor.io/9/trezor-connect.js.
-   B] For those who like to have more control over their dependencies, there will be also a new url created in form of https://connect.trezor.io/9.1../trezor-connect.js. Please note that these endpoints will not receive any further updates including security updates.

Version 9+ will be available as `@trezor/connect` and `@trezor/connect-web` npm packages.

## Step by step release process

-   Make sure you have released all [npm dependencies](../../releases/npm-packages.md).
-   Optional: if unsure run `node ./ci/scripts/check-npm-dependencies.js connect`. Please note that this script will report unreleased dependencies even for changes that do not affect runtime (READMEs etc.)
-   bump version in all @trezor/connect\* packages (except plugin packages). `yarn workspace @trezor/connect version:<beta|patch|minor|major>`
-   make sure CHANGELOG files have been updated
-   merge into develop branch
-   from develop branch create a pull requests into branch `release/connect-v9`
-   gitlab: click manual release `@trezor/connect-web` and `@trezor/connect` into npm
-   gitlab: click manual deploy job to connect.trezor.io/9

## Version 8 (stable)

Currently, we are at version 8, which has an url https://connect.trezor.io/8/trezor-connect.js.

Version 8 is available as `trezor-connect` npm package.

If you would like to find out which version is deployed precisely simply run:

`curl -s https://connect.trezor.io/8/trezor-connect.js | grep VERSION`

With regards to this repo - All updates should go to current version branch, the previous releases are in corresponding branches. The gh-pages is the same older version, that is used at trezor.github.io/connect/connect.js, and it's there for backwards compatibility; please don't touch.

For deployment process of trezor-connect v8 refer to [trezor/connect repository](https://github.com/trezor/connect/blob/develop/docs/deployment/index.md)

## Docs

Interactive API explorer is available on https://connect.trezor.io/9/#/

Documentation is available [docs/packages/connect](../../docs/packages/connect/index.md)

## Examples

A collection of examples on how to implement @trezor/connect in various environments is available in [packages/connect-examples](../connect-examples/README.md)

## Tests

For integration testing against trezord and emulator refer to [this document](https://github.com/trezor/trezor-suite/blob/develop/packages/integration-tests/projects/connect/README.md).
