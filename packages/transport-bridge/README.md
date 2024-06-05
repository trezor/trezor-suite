# @trezor/transport-bridge

-   javascript clone of https://github.com/trezor/trezord-go

## Build and run using node

-   `yarn workspace @trezor/transport-bridge build:js`
-   `node ./packages/transport-bridge/dist/bin.js`

Javascript build has 2 phases - node, using esbuild, and web, using webpack. It still can be used without the `build:lib` script. But to have
also bridge status page available you need to build.

## Build and run binary

-   `yarn workspace @trezor/transport-bridge build`
-   `./packages/transport-bridge/build/\@trezor/transport-bridge-<your-platform>`
