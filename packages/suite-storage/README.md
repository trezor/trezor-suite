# @trezor/suite-storage

This package contains an abstract database definition for Suite. Both [@trezor/suite-desktop](../suite-desktop) and [@trezor/suite-web](../suite-web) use [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) for storage. IndexedDB is accessed via [idb](https://github.com/jakearchibald/idb) package.

The package is split into `./src/native` for `suite-native` and `./src/web` for `suite-desktop` plus `suite-web`. There is no logic in `./src/native/index.ts`, this file is a placeholder for future implementation of storage in `suite-native`.
