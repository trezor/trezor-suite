# Networks

Network-specific packages are organized by network "families". The goal is to keep all logic related to one coin family in a single folder, with packages separated by technical layer. Technical-layer packages have a predefined suffix and public API, so they can be imported from the rest of the monorepo. Optional packages may use a custom suffix, but must only be imported from within their network's directory.

Every package name must start with `network-`, followed by the network name (for example, `bitcoin`) and either a predefined technical-layer suffix or a custom suffix. Its directory must have the same name and be located directly under the corresponding network directory.

## Technical layers

| Layer        | Package                                  |
| ------------ | ---------------------------------------- |
| Connect      | `@trezor/network-<network>-connect`      |
| Suite        | `@trezor/network-<network>-suite`        |
| Suite Common | `@trezor/network-<network>-suite-common` |
| Suite Native | `@trezor/network-<network>-suite-native` |

Suite and Suite Native packages may depend on Suite Common. Suite Common must remain platform-independent and must not depend on Suite or Suite Native.

All the 3rd party dependencies related to a network should be defined inside that network's directory. Moreover, currently they're defined only inside general, no-suffix packages, e.g. `network-cardano` (previously coins packages) and dynamically exported.

The complete structure for Bitcoin illustrates all four layers alongside optional internal packages:

```
networks/
├── README.md
├── bitcoin/
│   ├── network-bitcoin-connect/       → @trezor/network-bitcoin-connect
│   ├── network-bitcoin-suite/         → @trezor/network-bitcoin-suite
│   ├── network-bitcoin-suite-common/  → @trezor/network-bitcoin-suite-common
│   ├── network-bitcoin-suite-native/  → @trezor/network-bitcoin-suite-native
│   ├── network-bitcoin-bip32/         → @trezor/network-bitcoin-bip32 (custom/internal)
│   └── network-bitcoin-coinjoin/      → @trezor/network-bitcoin-coinjoin (custom/internal)
└── <network>/
    ├── network-<network>-connect/
    ├── network-<network>-suite/
    ├── network-<network>-suite-common/
    └── network-<network>-suite-native/
```

## Custom package structure

Ideally, all 3rd party dependencies related to a network should be in the general network package, and either reexported or used inside exported functions.
Types, runtime constants (independent of dependencies) and runtime functions should be separated so it's clear on the importer's side
what overhead is expected. Utilities using 3rd party code in runtime should always be exported in `runtime/exports.ts` and dynamically
reexported in `runtime/index.ts` so this code is loaded on-demand, for security and performance reasons. From the top-level index file,
`runtime/exports.ts` is directly exported instead, but importing from the package root is restricted by eslint rule in this monorepo.

Each general network package follows a consistent three-entrypoint layout:

```
networks/<network>/network-<network>/src/
  constants/   – Static values, constants, custom enums etc…
  types/       – TypeScript type definitions (incl. reexported by using `export type`)
  runtime/     – Dynamically exported utilities, helpers, reexported functions…
  index.ts     – Reexport from constants/index.ts, types/index.ts and runtime/exports.ts
```

Exports field in `package.json` should restrict access to package internals:

```json
"exports": {
    "./constants": "./src/constants/index.ts",
    "./runtime": "./src/runtime/index.ts",
    "./types": "./src/types/index.ts",
    ".": "./src/index.ts"
}
```

Import from a specific entrypoint rather than the package root:

```ts
import { TOKEN_PROGRAM_PUBLIC_KEY } from '@trezor/network-solana/constants';
import type { SolanaTransaction } from '@trezor/network-solana/types';

// Possible, but restricted. Mostly for tests, scripts and 3rd parties where we don't care about proper bundling
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { util } from '@trezor/network-solana';

// Correct way
import loadSolanaUtils from '@trezor/network-solana/runtime';

const { util } = await loadSolanaUtils();
```
