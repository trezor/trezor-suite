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
| `scripts/csl-asmjs/coinSelectionExports.js` | Lists the CSL exports coin selection can reach (source + glue). Input of `generate.js`.          |
| `scripts/csl-asmjs/generate.test.ts`        | Fails when the committed build is stale or edited, by comparing hashes with `manifest.json`.     |
| `scripts/csl-asmjs/verify.sh`               | Rebuilds `generated/csl-asmjs/` from scratch and fails unless it matches the committed files.    |
| `jest.config.cjs`                           | Project `wasm`: all tests against the desktop (WASM) build. Includes `jest.config.asmjs.cjs`.    |
| `jest.config.asmjs.cjs`                     | Project `asmjs`: parity and scenario tests against the generated (mobile) build.                 |

`suite-native/app/metro.config.js` resolves `@emurgo/cardano-serialization-lib-{nodejs,browser}`
to `generated/csl-asmjs/cardano_serialization_lib.js`.

### How the build is made

1. `coinSelectionExports.js` finds every export coin selection can reach without running it: it
   starts from the classes coin selection names (`CardanoWasm.Class` in its `lib`), takes every
   member name it accesses (`.member`), and follows the classes those glue members return
   (`Class.__wrap`). Glue methods with a matching name on a reachable class, and glue functions
   with a matching name, contribute the WASM exports their bodies call. A member name counts for
   every reachable class, so this over-approximates instead of depending on test coverage.
2. `generate.js` loads the vendor WASM (`@emurgo/cardano-serialization-lib-browser`) and keeps
   the reachable exports and the runtime plumbing (`memory`, `__wbindgen_*`,
   `__wbg_<class>_free`). It removes the rest, lets Binaryen delete
   everything unreachable, and translates the result to asm.js (`wasm2js`). The glue comes from
   `@emurgo/cardano-serialization-lib-asmjs`, with its dynamic `require` fallback patched out
   because Metro rejects it.
3. `manifest.json` records a hash of all inputs and of each output file; a rerun with the same
   inputs is a no-op.

### When to regenerate

- coin-selection update, CSL or Binaryen version bump, or a change to the scripts:
  `yarn workspace @trezor/network-cardano generate:csl-asmjs` (`generate.test.ts` fails until done).

Commit `generated/csl-asmjs/` together with the change. Push LFS objects
before the branch (`git lfs push origin <branch>`) if the pre-push hook does not.

### Reproducing the build

`generate.test.ts` only compares hashes, so it cannot tell whether the committed build really comes
from the pinned inputs. `verify.sh` can: it deletes `generated/csl-asmjs/`, runs `generate.js` and
fails unless `git status` of `generated/csl-asmjs/` stays clean. CI runs it in
`.github/workflows/test-cardano-csl-asmjs.yml`.

To check a pull request locally, on a clean checkout of its branch:

```sh
git lfs pull
yarn
yarn workspace @trezor/network-cardano verify:csl-asmjs
```

A failure lists the files that differ: the committed build was not produced by the committed
scripts and pinned dependencies. Restore the committed files with
`git checkout -- networks/cardano/network-cardano/generated/csl-asmjs`.

### Tests

`yarn workspace @trezor/network-cardano test:unit` runs every test under the WASM build and the
parity and scenario tests again under the generated build. The parity test asserts identical fee,
hash, size and serialized bytes; the scenario test runs further code paths on both builds;
`generate.test.ts` asserts every export coin selection references or can reach is present and
that the committed build matches the input and output hashes in `manifest.json` (no Binaryen run).
