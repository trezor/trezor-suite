# @trezor/blockchain-link

[![NPM](https://img.shields.io/npm/v/@trezor/blockchain-link.svg)](https://www.npmjs.org/package/@trezor/blockchain-link)

blockchain-link is a client and unified interface for several backends (_BE_ further on) of various blockchain networks. Currently, there are implementations for

-   [blockbook](https://github.com/trezor/blockbook): BE developed and deployed by SatoshiLabs. Provides access to Bitcoin(like) and Ethereum(like) networks.
-   [ripple](https://xrpl.org/): third party BE that provides access to the Ripple network.
-   [blockfrost](https://blockfrost.io): third party BE that provides access to the Cardano network.
-   [electrum](https://electrumx-spesmilo.readthedocs.io/en/latest/): protocol implemented by multiple third party backends that provide access to the Bitcoin network.

## Usage

Add blockchain-link to your dependencies.

```shell
yarn add @trezor/blockchain-link
```

And use it.

```javascript
import BlockchainLink from '@trezor/blockchain-link';
import Blockbook from '@trezor/blockchain-link/lib/workers/blockbook';

const link = new BlockchainLink({
    name: 'Name used in logs.',
    worker: Blockbook,
    server: ['url1.of.the.be', 'url2.of.the.be'],
    debug: true,
});

try {
    const resp = link.getInfo();
} catch (error) {}
```

For complete API see the methods of `BlockchainLink` class in [index.ts](./src/index.ts).

## Workers

Each `src/workers/*/index` file can be used in WebWorker thread.
Built from source using webpack `worker-loader`:

```
import BlockbookWorker from 'worker-loader?filename=workers/blockbook-worker.[hash].js!@trezor/blockchain-link/lib/workers/blockbook/index.js';
```

## Development

This package provides a simple testing UI for playing around with various implementations and BEs.
Run UI with webworkers support

```shell
yarn workspace @trezor/blockchain-link dev
```

or without webworkers support (workers are compiled into a bundle)

```shell
yarn workspace @trezor/blockchain-link dev:module
```

### Tests

```
yarn workspace @trezor/blockchain-link lint
yarn workspace @trezor/blockchain-link type-check
yarn workspace @trezor/blockchain-link test:unit
```

### Integration tests

Testing `lib` and `build` outputs:

```
yarn workspace @trezor/blockchain-link build:lib
yarn workspace @trezor/blockchain-link build:workers
yarn workspace @trezor/blockchain-link test:integration
```

### Publishing

[Follow instructions](../../docs/releases/npm-packages.md) how to publish @trezor package to npm registry.
