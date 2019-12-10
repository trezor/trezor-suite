# @trezor/suite-native

Build target for mobile.

## Issues

-   Be aware that Metro bundler doesn't resolve symlinks which are created and used by yarn workspaces. Eg. `@trezor/blockchain-link` hoisted in root's `node_modules` is a symlink to `packages/blockchain-link`, so metro bundle needs explicit declaration of such a module in `extraNodeModules` inside the `metro.config.js`.

-   ios + remote debugger: "Unable to find module for EventDispatcher React Native" https://stackoverflow.com/a/55081238

## Development

To build react-native application start by following these instructions. Select `React Native CLI Quickstart` and install all required dependencies. https://facebook.github.io/react-native/docs/getting-started

Notes for future debuging. Follow the install rules really carefully.
For example, for Android, it really requires the specified java version 8. In case you have multiple java sdks on your machine, here is [how to switch it](https://askubuntu.com/questions/740757/switch-between-multiple-java-versions)
