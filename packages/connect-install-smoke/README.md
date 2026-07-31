# @trezor/connect-install-smoke

Per-fixture install-and-import smoke tests for the `@trezor/connect*` family.
Each fixture is a self-contained mini-consumer that gets installed into a
freshly-generated `package.json`, then exercised at runtime and (optionally)
at the type level.

The connect ecosystem is **ESM-only** since v10. All fixtures consume the
packages via `import`.

## Layout

```
connect-install-smoke/
├── helpers.sh                # run_install_smoke() entry point
├── render-package-json.ts    # builds package.json from a fixture manifest (run via Node native TS)
├── test-connect-local.sh     # local (packed tarball) scenario
├── test-npm-install.sh       # npm registry scenario
├── test-yarn-install.sh      # yarn registry scenario
└── fixtures/
    ├── connect/
    ├── connect-mobile/
    ├── connect-web/
    └── connect-webextension/
```

Each fixture directory contains:

| File            | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `manifest.json` | Root package, runtime entry, extra deps for runtime / type-check scenarios |
| `index.mjs`     | Runtime smoke: imports the package and asserts on its surface              |
| `tsconfig.json` | TS config for the type-check pass (optional)                               |
| `type-check.ts` | Exercises the published `.d.ts` surface (optional)                         |

## Scenarios

The three top-level entry scripts each cover one install path:

| Script                  | Scenario        | What it tests                                       |
| ----------------------- | --------------- | --------------------------------------------------- |
| `test-connect-local.sh` | `local`         | Locally packed tarballs (pre-publish gate in CI)    |
| `test-npm-install.sh`   | `registry-npm`  | Latest published `@trezor/connect@<version>` (npm)  |
| `test-yarn-install.sh`  | `registry-yarn` | Latest published `@trezor/connect@<version>` (yarn) |

## Running locally

```bash
yarn workspace @trezor/connect-install-smoke test:install:npm latest
yarn workspace @trezor/connect-install-smoke test:install:yarn latest
yarn workspace @trezor/connect-install-smoke test:install:local
```

## Adding a fixture

1. `mkdir fixtures/<name>` and drop in `manifest.json` + `index.mjs`. Add
   `tsconfig.json` + `type-check.ts` if you want a type-check pass.
2. Call `run_install_smoke <name> <scenario> [type-check] [runtime]` from
   the relevant top-level script(s).
