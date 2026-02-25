# @trezor/connect-plugin-ethereum

[![NPM](https://img.shields.io/npm/v/@trezor/connect-plugin-ethereum.svg)](https://www.npmjs.org/package/@trezor/connect-plugin-ethereum)

T1B1 firmware currently does not support constructing [EIP-712](https://eips.ethereum.org/EIPS/eip-712)
hashes. However, it supports signing pre-constructed hashes.

EIP-712 hashes can be constructed with the plugin function
[transformTypedData](./index.js)

You may also wish to construct your own hashes using a different library.

For more information refer to [docs/ethereumSignTypedData](../../docs/packages/connect/methods/ethereumSignTypedData.md)
