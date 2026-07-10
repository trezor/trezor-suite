# Coins

Coin-specific packages providing types, constants, and runtime utilities for individual coins supported by Trezor Suite and/or Trezor Connect.

Ideally, all 3rd party dependencies related to this coin should be in this package, and either reexported or used inside exported functions.
Moreover, types, runtime constants (independent on dependencies) and runtime functions should be separated so it's clear on importer's side
what overhead is expected. Utilities using 3rd party code in runtime should always be exported in `runtime/exports.ts` and dynamically
reexported in `runtime/index.ts` so this code is loaded on-demand, for security and performance reasons. From top-level index file,
`runtime/exports.ts` is directly exported instead, but importing from package root is restricted by eslint rule in this monorepo.

## Package structure

Each coin package follows a consistent three-entrypoint layout:

```
coins/coins-<coin-name>/src/
  constants/   – Static values, constants, custom enums etc…
  types/       – TypeScript type definitions (incl. reexported by using `export type`)
  runtime/     – Dynamically exported utilities, helpers, reexported functions…
  index.ts     – Reexport from constants/index.ts, types/index.ts and runtime/exports.ts
```

Exports field in `package.json` should restrict access to package internals:

```
"exports": {
    "./constants": "./src/constants/index.ts",
    "./runtime": "./src/runtime/index.ts",
    "./types": "./src/types/index.ts",
    ".": "./src/index.ts"
},
```

Import from a specific entrypoint rather than the package root:

```ts
import { TOKEN_PROGRAM_PUBLIC_KEY } from '@trezor/coins-solana/constants';
import type { SolanaTransaction } from '@trezor/coins-solana/types';

// Possible, but restricted. Mostly for tests, scripts and 3rd parties where we don't care about proper bundling
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { util } from '@trezor/coins-solana';

// Correct way
import loadSolanaUtils from '@trezor/coins-solana/runtime';

const { util } = await loadSolanaUtils();
```

## Adding a new coin package

1. Create a new directory `coins/coins-<coin-name>/` following the structure above.
2. Add `package.json` with the name `@trezor/coins-<coin-name>` and declare the three subpath exports (`./constants`, `./types`, `./runtime`).
