# Networks

Network-specific packages organized by different blockchain networks. The goal is to have all the logic related to a single coin family
in a single folder, with subfolders containing packages for different domains and/or environments. Some of the packages are compulsory,
with strictly defined API, to be used as a modules in Suite/Connect. These packages should be importable from the rest of the monorepo.
There may also be optional packages with arbitrary structure, but these should be imported only from inside their network's directory.

Every package must be named with `network-` prefix, followed by given network (e.g. `bitcoin`) and either predefined compulsory suffix
(e.g. `-connect` or `-suite`) or custom suffix, and must be located directly in the directory with the exact same name, under given network's
directory.

All the 3rd party dependencies related to a network should be defined inside that network's directory. Moreover, currently they're
defined only inside general, no-suffix packages, e.g. `network-cardano` (previously coins packages) and dynamically exported.

Example:

```
networks/
├── README.md
├── bitcoin/
│   ├── network-bitcoin-bip32/      → @trezor/network-bitcoin-bip32     (custom/internal)
│   ├── network-bitcoin-coinjoin/   → @trezor/network-bitcoin-coinjoin  (custom/internal)
│   ├── network-bitcoin-suite/      → @trezor/network-bitcoin-suite     (compulsory/public)
│   └── network-bitcoin-connect/    → @trezor/network-bitcoin-connect   (compulsory/public)
├── solana/
│   ├── network-solana/             → @trezor/network-solana            (custom/internal)
│   ├── network-solana-suite/       → @trezor/network-solana-suite      (compulsory/public)
│   └── network-solana-connect/     → @trezor/network-solana-connect    (compulsory/public)
└── cardano/
    ├── network-cardano/            → @trezor/network-cardano           (custom/internal)
    ├── network-cardano-suite/      → @trezor/network-cardano-suite     (compulsory/public)
    └── network-cardano-connect/    → @trezor/network-cardano-connect   (compulsory/public)
```

## Compulsory package structure

To be done.

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
