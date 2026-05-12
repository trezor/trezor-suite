|             Package              | Stable |     Canary     |
| :------------------------------: | :----: | :------------: |
|       npm @trezor/connect        |   -    | 10.0.0-alpha.1 |
|     npm @trezor/connect-web      |   -    | 10.0.0-alpha.1 |
| npm @trezor/connect-webextension |   -    | 10.0.0-alpha.1 |
|    npm @trezor/connect-mobile    |   -    | 10.0.0-alpha.1 |

|     Deployment     | Stable |     Canary     |
| :----------------: | :----: | :------------: |
| connect.trezor.io/ |   -    | 10.0.0-alpha.1 |

Use the persistent link [connect.trezor.io/10](https://connect.trezor.io/10/) to access the latest stable version of Connect Explorer.

# 10.0.0-alpha.1

First beta release of version 10.
This version removes support for legacy iframe and popup integration methods and replaces them with new Suite-based integration.

Features:

- Tron support (`tronGetAddress`, `tronSignTransaction`)

Breaking changes:

- **`@trezor/connect` and every package in its dependency closure now ship ESM only.** Several transitive dependencies (`@noble/curves`, `@noble/hashes`, `@scure/base`, `@scure/bip39`, `@solana/kit`, `@solana-program/*`, `viem`, `node-fetch@3+`) are already ESM-only, so a CJS consumer of `@trezor/connect` cannot statically import them in any case. To keep the build pipeline consistent, the entire connect ecosystem follows suit: `@trezor/connect`, `@trezor/connect-web`, `@trezor/connect-webextension`, `@trezor/connect-mobile`, `@trezor/connect-common`, `@trezor/connect-data`, `@trezor/connect-plugin-ethereum`, `@trezor/connect-plugin-stellar`, `@trezor/blockchain-link`, `@trezor/blockchain-link-utils`, `@trezor/blockchain-link-types`, `@trezor/utxo-lib`, `@trezor/device-authenticity`, `@trezor/address-validator`, `@trezor/utils`, `@trezor/transport`, `@trezor/protobuf`, `@trezor/protocol`, `@trezor/schema-utils`, `@trezor/crypto-utils`, `@trezor/device-utils`, `@trezor/env-utils`, `@trezor/type-utils`, `@trezor/websocket-client`. Migration:
    - ESM consumer: replace `const TrezorConnect = require('@trezor/connect').default` with `import TrezorConnect from '@trezor/connect'`. Set `"type": "module"` in your `package.json` or use the `.mjs` extension.
    - CJS consumer that cannot migrate: use a dynamic import — `const TrezorConnect = (await import('@trezor/connect')).default;` — or stay on v9.

Deprecations:

- Remove connect-iframe and connect-popup integration
- Remove EOS support
- Remove NEM support

Commits:

- chore: remove connect-iframe (372d11f819)
- feat(connect): tronSignTransaction (57eec2f1a2)
- feat(connect): tronGetAddress (f5a2bfb6cb)
- chore(suite-native): remove deprecated node-libs-browser (5ff326e491)
- test(connect): don't set up emu repeatedly if not necessary (55b93ac8e7)
- chore: bump webpack-related deps (3f73273dba)
- chore(connect): remove unsupported fixture (5acfbb81d5)
- feat(connect): core-in-popup and iframe with popup modes are now removed (a902e2d3cb)
- fix: use AccountDescriptor as branded type (47f2cc48d5)
- feat(connect): remove EOS support (16da7214cc)
- feat(connect): validation for sign message size for T1B1 (d1fb78727e)
- feat(connect): remove NEM support (b9e7b55832)
- refactor(connect): use CoreInModule directly (e9a5c47c7d)
- refactor(connect): flatten TrezorConnectDynamic with CoreInModule (a8038c6a70)
- chore(connect): move web module into main package (815158241a)
- chore(connect): remove unsuppoted fixtures from txcache in tests (e5214e5706)
- chore: bump prettier (3e33cbeee4)
- ci(connect): expand npm install check to cover both ESM & CJS (c15485ed96)
- chore(npm): start publishing source maps (36f6e9692d)
- fix(connect): change THP phase after successful ThpEndResponse (66b6b03416)
- chore(connect): move thp staticKey from ThpSettings to DeviceThpCredentials (6aa0bc6a06)
- chore(device-authenticity): extract prepareDeviceAuthenticityData (2e061e4cc2)
- chore(connect, blockchain-link): validate custom RPCs chainIds (8977871032)
- feat(suite): implement evm-rpc worker into suite (cdf207e01f)
