# Networks

Network-specific packages are organized by network "families". The goal is to keep all logic related to one coin family in a single folder, with packages separated by technical layer. Technical-layer packages have a predefined suffix and public API, so they can be imported from the rest of the monorepo. Optional packages may use a custom suffix, but must only be imported from within their network's directory.

Every family package name must start with `network-`, followed by the network name (for example, `bitcoin`) and optionally a predefined technical-layer suffix or a custom suffix. Its directory must have the same name and be located directly under the corresponding network directory. Shared contract packages live under `network-module/`.

## Technical layers

| Layer        | Package                                  |
| ------------ | ---------------------------------------- |
| Connect      | `@trezor/network-<network>-connect`      |
| Suite        | `@trezor/network-<network>-suite`        |
| Suite Common | `@trezor/network-<network>-suite-common` |
| Suite Native | `@trezor/network-<network>-suite-native` |

`@trezor/network-<network>` is the layer-independent base package for a network family.
It owns the supported-network tuple, the exhaustive symbol union inferred from that tuple,
and the `isSupported<Network>Network` guard. Every technical layer may depend on this base package.

Suite and Suite Native packages may depend on Suite Common. Suite Common must remain platform-independent and must not depend on Suite or Suite Native.

Network packages depend on reusable `@trezor/*` packages. Dependencies owned by the apps,
including services such as Connect, are passed in through dependency injection.

All the 3rd party dependencies related to a network should be defined inside that network's directory. Moreover, currently they're defined only inside general, no-suffix packages, e.g. `network-cardano` (previously coins packages) and dynamically exported.

The complete structure for Bitcoin illustrates all four layers alongside optional internal packages:

```
networks/
├── README.md
├── bitcoin/
│   ├── network-bitcoin/               → @trezor/network-bitcoin (layer-independent base)
│   ├── network-bitcoin-connect/       → @trezor/network-bitcoin-connect
│   ├── network-bitcoin-suite/         → @trezor/network-bitcoin-suite
│   ├── network-bitcoin-suite-common/  → @trezor/network-bitcoin-suite-common
│   ├── network-bitcoin-suite-native/  → @trezor/network-bitcoin-suite-native
│   ├── network-bitcoin-bip32/         → @trezor/network-bitcoin-bip32 (custom/internal)
│   └── network-bitcoin-coinjoin/      → @trezor/network-bitcoin-coinjoin (custom/internal)
└── <network>/
    ├── network-<network>/
    ├── network-<network>-connect/
    ├── network-<network>-suite/
    ├── network-<network>-suite-common/
    └── network-<network>-suite-native/
```

## Shared network symbols

[`@trezor/network-module-types`](network-module/network-module-types/src/networkSymbol.ts)
provides the open branded `NetworkSymbol` used across network families. `asNetworkSymbol` brands
a string and preserves its literal type; it does not check whether the network is registered.
Exhaustive symbol unions belong to individual families, such as `BitcoinNetworkSymbol`.

[`createNetworkModule`](network-module/network-module-suite-common-types/src/createNetworkModule.ts)
adapts a family's capabilities to the shared `SuiteCommonNetworkModule` interface. It checks the
supported-network tuple before passing a shared symbol to a capability, so family implementations
receive their own closed symbol type. Optional named-address resolvers return `false` from
`supportsNamedAddress` for unsupported symbols; operations that require a supported symbol reject it.

## Custom package structure

Ideally, all 3rd party dependencies related to a network should be in the general network package, and either reexported or used inside exported functions.
Types, runtime constants (independent of dependencies) and runtime functions should be separated so it's clear on the importer's side
what overhead is expected. Utilities using 3rd party code in runtime should always be exported in `runtime/exports.ts` and dynamically
reexported in `runtime/index.ts` so this code is loaded on-demand, for security and performance reasons. From the top-level index file,
`runtime/exports.ts` is directly exported instead, but importing from the package root is restricted by eslint rule in this monorepo.

The lightweight `supported<Network>Networks` tuple and `isSupported<Network>Network` guard
belong to the `constants` entrypoint. Shared contract packages such as
`@trezor/network-module-types` and `@trezor/network-module-suite-common-types` use root imports.

Each general network package uses the relevant entrypoints from this layout:

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
