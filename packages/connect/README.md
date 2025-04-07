# @trezor/connect

API version 9.5.4

[![Build Status](https://github.com/trezor/trezor-suite/actions/workflows/test-connect.yml/badge.svg)](https://github.com/trezor/trezor-suite/actions/workflows/test-connect.yml)
[![NPM](https://img.shields.io/npm/v/@trezor/connect.svg)](https://www.npmjs.org/package/@trezor/connect)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/connect/badge.svg?targetFile=package.json)](https://snyk.io/test/github/trezor/trezor-suite?targetFile=packages/connect/package.json)

Trezor Connect is a platform for easy integration of Trezor into 3rd party services, as well as into Trezor Suite. It provides an API with functionality to access public keys, sign transactions and authenticate users.

This package is intended to be used in node.js environment. If you wan't to build a web application please refer to [@trezor/connect-web package](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-web/README.md).

## Installation

Install library as npm module:

```javascript
npm install @trezor/connect
```

or

```javascript
yarn add @trezor/connect
```

## Initialization

ES6

```javascript
import TrezorConnect from '@trezor/connect';
```

For more instructions [refer to this document](https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md)

## Versioning

Since version 9 we are adopting a new versioning strategy. With every release, we are going to update two urls

-   A) The latest release will always be available on https://connect.trezor.io/9/trezor-connect.js.
-   B) For those who like to have more control over their dependencies, there will be also a new url created in form of https://connect.trezor.io/9.1../trezor-connect.js. Please note that these endpoints will not receive any further updates including security updates.

Version 9 is available as `@trezor/connect` and `@trezor/connect-web` npm packages.

### Major version

New major version is released when there are breaking changes on API level. Previous major version will be maintained for 12 months and after this period it can be taken down without notice.

Current major version 9 is being developed on top of `develop` branch. When there is a new major version a new branch should be created (`v-<major-version>`) and mantained separately.

### Minor version

Minor versions are released when there are:

-   considerable additions to API
-   changes in npm package

### Patch version

Everything else that does not fall under major or minor version.

## Version 8 (legacy)

Legacy version 8 is accessible from url https://connect.trezor.io/8/trezor-connect.js.

Version 8 is available as `trezor-connect` npm package.

If you would like to find out which version is deployed precisely simply run:

`curl -s https://connect.trezor.io/8/trezor-connect.js | grep VERSION`

With regards to this repo - All updates should go to current version branch, the previous releases are in corresponding branches. The gh-pages is the same older version, that is used at trezor.github.io/connect/connect.js, and it's there for backwards compatibility; please don't touch.

For deployment process of trezor-connect v8 refer to [trezor/connect repository](https://github.com/trezor/connect/blob/develop/docs/deployment/index.md)

Version 8 will go offline by the end of 2023.

## Docs

Interactive API explorer is available on https://connect.trezor.io/9/#/

Documentation is available [docs/packages/connect](https://github.com/trezor/trezor-suite/blob/develop/docs/packages/connect/index.md)

## Examples

A collection of examples on how to implement @trezor/connect in various environments is available in [packages/connect-examples](https://github.com/trezor/trezor-suite/tree/develop/packages/connect-examples)

## Tests

For integration testing against trezord and emulator refer to [this document](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/e2e/README.md).
