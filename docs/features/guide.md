# Suite Guide

Guide is a feature that allows us to write content on various topics like basics of deterministic wallets, cryptocurrencies, Suite specifics or generally anything a Suite user might be interested in and then provide it to the user directly in the app.

## Content

The content is maintained in a [GitBook project](https://app.gitbook.com/@trezor/s/suite-product-guide/). (You'll need an account with appropriate privileges to access it.) GitBook mirrors the content to a [GitHub repository](https://github.com/trezor/trezor-suite-guide) from where it's fetched when Suite builds. The fetch happens in the `suite-data` package on `build:lib` yarn task. Once fetched the content is indexed and transformed to a format usable in the Suite app. This format is then copied into the static directories of web, desktop and native builds.

Indexing, transforming and copying of the content is handled by scripts in `packages/suite-data/src/guide`. These are configured to fetch a particular commit of the GitBook mirror by the `GITBOOK_REVISION` constant in `packages/suite-data/src/guide/constants.ts`. This constant must/can be changed accordingly to propagate changes from GitBook to suite builds. (One could set it to the `master` branch to always use the latest content version, however that is discouraged as we rather want to precisely control which version of the content will get included in each release.)

## How to update

Change `GITBOOK_REVISION` constant in `packages/suite-data/src/guide/constants.ts` to the new revision. Example: [40855097](https://github.com/trezor/trezor-suite/commit/408550979cd58e78df297e30fb32e45935529a80). That's it.
