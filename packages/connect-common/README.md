# @trezor/connect-common

[![NPM](https://img.shields.io/npm/v/@trezor/connect-common.svg)](https://www.npmjs.org/package/@trezor/connect-common)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/trezor-suite/badge.svg?targetFile=packages/connect-common/package.json)](https://snyk.io/test/github/trezor/trezor-suite/badge.svg?targetFile=packages/connect-common/package.json)

Collection of assets and utilities used by @trezor/connect\* packages.

## files

### bridge

Data in `releases.json` are used to determine which version of Bridge to use depending on the user's operating system.

### firmware

Binaries of the latest versions of firmware for each Trezor model are included in this package so that they are available to users of Suite desktop app without connecting to the internet. The process of adding new firmwares is described [here](../../docs/releases/adding-new-firmwares.md). Besides the latest versions, T1B1 and T2T1 both require a transitory version for upgrading from old firmware (intermediary firmware `trezor-inter-1.10.0.bin` for T1B1 and version `trezor-2.1.1.bin` for T2T1).

There is a `releases.json` file for each Trezor model which must be updated any time new binaries are added. This file provides data about all available firmware versions and it is used to display them in Suite and to make sure that the correct firmware is downloaded. Read more about `releases.json` and it's structure [here](../../docs/releases/adding-new-firmwares.md#firmware-releasesjson-files-structure)

## src

### Storage

A utility to remember app permissions given by user.

## Publishing

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.
