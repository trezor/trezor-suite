# Version 9

## Versioning

-   bump version in all @trezor/connect\* packages (except plugin packages)
-   build and deploy npm packages @trezor/connect and @trezor/connect-web
-   deploy @trezor/connect to connect.trezor.io/9.0.0 and connect.trezor.io/9

## Step by step release process

-   bump version in all @trezor/connect\* packages (except plugin packages) using `yarn workspace @trezor/connect version:<beta|patch|minor|major>`
-   make sure [CHANGELOG](../../../packages/connect/CHANGELOG.md) files have been updated
-   [prepare a branch with npm releases](../../releases/npm-packages.md). Make sure you have released all dependencies (transport, blockchain-link...)
-   merge into develop branch
-   from develop, create pull requests into branch `release/connect-v9`

# Version 8 and lower

For deployment process of trezor-connect v8 refer to [trezor/connect repository](https://github.com/trezor/connect/blob/develop/docs/deployment/index.md)
