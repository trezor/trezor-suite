# @trezor/connect-plugin-ethereum

[![Build Status](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml/badge.svg)](https://github.com/trezor/trezor-suite/actions/workflows/connect-test.yml)
[![NPM](https://img.shields.io/npm/v/@trezor/connect-plugin-ethereum.svg)](https://www.npmjs.org/package/@trezor/connect-plugin-ethereum)
[![Known Vulnerabilities](https://snyk.io/test/github/trezor/connect-plugin-ethereum/badge.svg?targetFile=package.json)](https://snyk.io/test/github/trezor/trezor-suite?targetFile=packages/connect-plugin-ethereum/package.json)

T1 firmware currently does not support constructing [EIP-712](https://eips.ethereum.org/EIPS/eip-712)
hashes. However, it supports signing pre-constructed hashes.

EIP-712 hashes can be constructed with the plugin function
[transformTypedData](./index.js)

You may also wish to construct your own hashes using a different library.

For more information refer to [docs/ethereumSignTypedData](../../docs/packages/connect/methods/ethereumSignTypedData.md)

## Publishing

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.
