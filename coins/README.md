# Coins

Coin-specific packages providing types, constants, and runtime utilities for individual coins supported by Trezor Suite and/or Trezor Connect.

Ideally, all 3rd party dependencies related to this coin should be in this package, and either reexported or used inside exported functions.
Moreover, types, runtime constants (independent on dependencies) and runtime functions should be separated so it's clear on importer's side
what overhead is expected. Utilities using 3rd party code in runtime should always be dynamically reexported in `runtime/index.ts` so this
code is loaded on-demand, for security and performance reasons.

## Package structure

Each coin package follows a consistent three-entrypoint layout:

```
coins/coins-<coin-name>/src/
  constants/   – Static values, constants, custom enums etc…
  types/       – TypeScript type definitions (incl. reexported by using `export type`)
  runtime/     – Dynamically exported utilities, helpers, reexported functions…
  index.ts     – Empty - root import not supported
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
import loadSolanaUtils from '@trezor/coins-solana/runtime';

const { util } = await loadSolanaUtils();
```

## Adding a new coin package

1. Create a new directory `coins/coins-<coin-name>/` following the structure above.
2. Add `package.json` with the name `@trezor/coins-<coin-name>` and declare the three subpath exports (`./constants`, `./types`, `./runtime`).
