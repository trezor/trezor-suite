# Everstake Wallet SDK - Solana

## Getting Started

You can use two different options to implement staking for Everstake validator.

## Option 1: REST API

You can use REST API to call methods which are described in [Swagger](https://wallet-sdk-api.everstake.one/swagger/) with detailed examples

```
https://wallet-sdk-api.everstake.one
```

## Option 2: TypeScript library

You can install and import Wallet SDK for Javascript/TypeScript.

### Step. 1: Installing the Library

Install the npm library by copying the code below.

```sh
$ npm install @everstake/wallet-sdk-solana
```

or you can also use yarn

```sh
$ yarn add @everstake/wallet-sdk-solana
```

or you can use pnpm

```sh
$ pnpm add @everstake/wallet-sdk-solana
```

### Step. 2: Import Wallet SDK

After installing the app, you can import module Solana and use the SDK:

#### Import ES6

```ts
// import modules
import { Solana } from '@everstake/wallet-sdk-solana';
```

#### Import ES5

```ts
// import modules
const { Solana } = require('@everstake/wallet-sdk-solana');

```

## Questions and Feedback

If you have any questions, issues, or feedback, please file an issue
on [GitHub](https://github.com/everstake/wallet-sdk/issues).
