# @trezor/network-cardano

Cardano network definition, runtime (transaction composing via `@fivebinaries/coin-selection`)
and types.

## Cardano Serialization Lib on mobile

`@fivebinaries/coin-selection` calls Cardano Serialization Lib (CSL), which ships as WASM.
Desktop and web run the WASM build. Hermes (React Native) cannot run WASM, so the mobile app
uses a pure-JS (asm.js) build of the same CSL version, reduced to the parts coin selection uses.

### Layout

| Path                                        | Purpose                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `generated/csl-asmjs/`                      | The pruned build. Committed; `*.asm.js` and `*_bg.js` are in Git LFS. Never edit by hand.        |
| `scripts/csl-asmjs/generate.js`             | Builds `generated/csl-asmjs/` from the vendor WASM with Binaryen. Skipped when inputs unchanged. |
| `scripts/csl-asmjs/inputs.js`               | Loads and hashes the inputs of `generate.js`; shared with `generate.test.ts`.                    |
| `scripts/csl-asmjs/keep-list.json`          | CSL exports coin selection calls on the code paths Suite uses. Input of `generate.js`.           |
| `scripts/csl-asmjs/coinSelectionExports.js` | Lists the CSL exports coin selection references statically. Input of `generate.js`.              |
| `scripts/csl-asmjs/trace.js`                | Records `keep-list.json` by running the coin-selection tests against the complete CSL build.     |
| `scripts/csl-asmjs/traceWasmExports.cjs`    | Proxy used by `trace.js` to record touched exports.                                              |
| `scripts/csl-asmjs/generate.test.ts`        | Fails when the committed build is stale or edited, by comparing hashes with `manifest.json`.     |
| `jest.config.cjs`                           | Project `wasm`: all tests against the desktop (WASM) build. Includes `jest.config.asmjs.cjs`.    |
| `jest.config.asmjs.cjs`                     | Project `asmjs`: parity and scenario tests against the generated (mobile) build.                 |
| `jest.config.csl-trace.cjs`                 | Used only by `trace.js`.                                                                         |

`suite-native/app/metro.config.js` resolves `@emurgo/cardano-serialization-lib-{nodejs,browser}`
to `generated/csl-asmjs/cardano_serialization_lib.js`.

### How the build is made

1. `trace.js` runs `coinSelectionParity.test.ts` and `coinSelectionScenarios.test.ts` against
   Emurgo's complete asm.js build with its exports wrapped in a recording proxy, and writes the
   touched export names to `keep-list.json` (minus `__wbg_<class>_free`, which `generate.js` keeps
   unconditionally).
2. `generate.js` loads the vendor WASM (`@emurgo/cardano-serialization-lib-browser`) and keeps
   every export coin selection references statically (`CardanoWasm.Class.member` in its `lib`),
   every export in the keep list, every other method of those classes, and the runtime plumbing
   (`memory`, `__wbindgen_*`, `__wbg_<class>_free`). It removes the rest, lets Binaryen delete
   everything unreachable, and translates the result to asm.js (`wasm2js`). The glue comes from
   `@emurgo/cardano-serialization-lib-asmjs`, with its dynamic `require` fallback patched out
   because Metro rejects it.
3. `manifest.json` records a hash of all inputs and of each output file; a rerun with the same
   inputs is a no-op.

### When to regenerate

- coin-selection update, CSL or Binaryen version bump, or a change to the scripts:
  `yarn workspace @trezor/network-cardano generate:csl-asmjs` (`generate.test.ts` fails until done).
- coin selection starts calling CSL functions on instances of classes it did not use before:
  `yarn workspace @trezor/network-cardano trace:csl-asmjs` (re-traces, then regenerates).

Commit `scripts/csl-asmjs/keep-list.json` and `generated/csl-asmjs/` together. Push LFS objects
before the branch (`git lfs push origin <branch>`) if the pre-push hook does not.

### Tests

`yarn workspace @trezor/network-cardano test:unit` runs every test under the WASM build and the
parity and scenario tests again under the generated build. The parity test asserts identical fee,
hash, size and serialized bytes; the scenario test runs the traced code paths on both builds;
`generate.test.ts` asserts every export coin selection references is present and that the
committed build matches the input and output hashes in `manifest.json` (no Binaryen run).
