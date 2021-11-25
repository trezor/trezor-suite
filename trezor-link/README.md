# trezor-link

[![Build Status](https://github.com/trezor/trezor-link/actions/workflows/tests.yml/badge.svg)](https://github.com/trezor/trezor-link/actions/workflows/tests.yml)
[![NPM](https://img.shields.io/npm/v/trezor-link.svg)](https://www.npmjs.org/package/trezor-link)
[![gitter](https://badges.gitter.im/trezor/community.svg)](https://gitter.im/trezor/community)

Library for low-level communication with Trezor.

Intended as a "building block" for other packages - it is used in ~~trezor.js~~ (deprecated) and trezor-connect.

*You probably don't want to use this package directly.* For communication with Trezor with a more high-level API, use [trezor-connect](https://github.com/trezor/connect).

## What is the purpose

- translate JSON payloads to binary messages using [protobuf definitions](https://github.com/trezor/trezor-common/tree/master/protob) comprehensible to Trezor devices
- chunking and reading chunked messages according to the [Trezor protocol](https://github.com/trezor/trezor-common/blob/master/protob/protocol.md)
- exposing single API for various transport methods:
  - Trezor Bridge
  - Webusb
## How to use

There is a runnable [example](https://github.com/trezor/trezor-link/blob/fixup-old-tests/e2e/tests/bridge.integration). This example launches [Trezor Bridge (trezord-go)](https://github.com/trezor/trezord-go) inside [trezor-user-env](https://github.com/trezor/trezor-user-env) 
docker container. Please make there is no other bridge instance running on your computer. 

To run in simply type:
  - `yarn`
  - `yarn build:lib`
  - `git submodule add --force https://github.com/trezor/trezor-common.git trezor-common`
  - `git submodule update --init`
  - `yarn pbjs -t json -p ./trezor-common/protob -o e2e/messages.json --keep-case messages-binance.proto messages-bitcoin.proto messages-bootloader.proto messages-cardano.proto messages-common.proto messages-crypto.proto messages-debug.proto messages-eos.proto messages-ethereum.proto messages-management.proto messages-monero.proto messages-nem.proto messages-ripple.proto messages-stellar.proto messages-tezos.proto messages-webauthn.proto messages.proto`
  - `./e2e/run.sh`;

## Process of moving to monorepo

Initially, this lib was typed with Flow and over the time its dependencies became outdated.
At the moment we are working on moving it into [trezor-suite monorepo](https://github.com/trezor/trezor-suite). 

Checklist: 
  
  - [x] add tests
  - [x] update dependencies (protobuf.js and others)
  - [x] use Typescript instead of Flow
  - [x] remove messages.json and messages-new.json and related tests.
  - [ ] resolve problem with [eth tests](https://github.com/trezor/trezor-common/blob/master/tests/fixtures/ethereum/sign_tx_eip155.json#L219) max uint64 which can't be handled by javascript
  - [ ] finish review within trezor-link repo
  - [ ] move into trezor-suite only after merging to avoid messing with dependencies inside monorepo
  - [ ] there are bunch of comments in code marked with "[compatibility]" keyword. These are places that should be refactored later. I did not want to be forced to sync this update with update of implementation in trezor-connect
  - [ ] eslintrc.js contains bunch of disabled rules. This is because I didn't want to refactor transport layer in the first iteration. Shall be refactored once it gets into monorepo