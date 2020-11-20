# @trezor/blockchain-link

API for communication with blockchain backends.
Every type of a backed is isolated inside own worker file.
Currently supported:

-   [blockbook](https://github.com/trezor/blockbook/)
-   [ripple-lib](https://github.com/ripple/ripple-lib/)

## Development:

Compile and run with simple ui for the API methods.

```
yarn
yarn dev
```

## Build

```
yarn lint
yarn test
yarn build
```

## Integration

```
yarn add @trezor/blockchain-link
```

```
import BlockchainLink from '@trezor/blockchain-link';

const link = new BlockchainLink({
    name: string;
    worker: string;
    server: string[];
    debug: boolean;
});

try {
    const resp = link.getInfo();
} catch(error) {

}
```

## Workers compilation

Workers are already builded and minified inside `@trezor/blockchain-link/build/` directory.

Then set your project to compile and provide those workers into blockchain-link instance.
An webpack configuration example using `worker-loader` could be found in [here](./webpack/dev.babel.js)
