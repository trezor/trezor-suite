# @trezor/blockchain-link

blockchain-link is a client and unified interface for several backends (_BE_ further on) of various blockchain networks. Currently, there are implementations for

-   [blockbook](https://github.com/trezor/blockbook): BE developed and deployed by SatoshiLabs. Provides access to Bitcoin(like) and Ethereum(like) networks.
-   [ripple](https://xrpl.org/): third party BE that provides access to the Ripple network.
-   [blockfrost](https://blockfrost.io): third party BE that provides access to the Cardano network.

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
} catch(error) {

}
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
or without webworkes support (workers are compiled into a bundle)
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

#### Prerequisites

1. Make sure you have a npm account with write access to `@trezor/blockchain-link` package.
1. Update CHANGELOG.md and list all changes since the last release.
1. Bump the version in `packages/blockchain-link/package.json`. Use the [semver](https://semver.org/) convention.

#### Production

1. `cd packages/blockchain-link` cd into the root of `blockchain-link` package.
1. `yarn build:lib` Build the library.
1. `npm publish` Publish!

#### Beta

If you want to publish to npm as `beta` (from any branch) do the following:

1. `cd packages/blockchain-link` cd into the root of `blockchain-link` package.
1. Change the version in `packages/blockchain-link/package.json` from `X.X.X` to `X.X.(X + 1)-beta.1`.
   The `-beta.<n>` suffix is important because NPM registry doesn't allow overriding already published versions.
   With this suffix we can publish multiple beta versions for a single patch.
1. `yarn build:lib` Build the library.
1. `npm publish --tag beta` Publish!
