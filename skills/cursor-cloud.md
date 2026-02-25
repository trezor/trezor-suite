# Cursor Cloud specific instructions

## Environment

- Node.js 24.11.1 is installed via nvm (see `.nvmrc`). The update script runs `nvm use` automatically.
- Yarn 4.12.0 (Berry) is the package manager, using `node-modules` linker (see `.yarnrc.yml`).
- Before any dev commands, `yarn build:essential` must have been run (the update script handles this).

## Running services

- **Suite Web**: `yarn suite:dev` starts webpack-dev-server at `http://localhost:8000`. Initial compile takes ~55 seconds.
- **Suite Web (Vite)**: `yarn suite:dev:vite` is faster for hot-reload iteration.
- See `skills/development-commands.md` for the full list of run/lint/test/build commands.

## Lint and test

- Lint a specific file: `yarn g:eslint --fix --flag v10_config_lookup_from_file --max-warnings 0 --concurrency auto <file>`
- Run unit tests for a package: `yarn workspace @trezor/<package> test:unit`
- The pre-commit hook runs ESLint on staged `.ts`/`.tsx` files. Set `TREZOR_PRE_COMMIT_ESLINT_SKIP=true` to bypass during iterative development.

## Gotchas

- `yarn install` triggers a `postinstall` script (`patch-package && husky`). If Playwright browser downloads fail in a headless environment, use `yarn --mode=skip-build` instead, then re-run native builds selectively.
- `build:essential` runs three background builds in parallel (`message-system-sign-config`, `@trezor/suite-data build:lib`, `@trezor/transport-bridge build:lib`). It must complete before `suite:dev` or tests will fail on missing artifacts.
- E2E tests (`@trezor/suite-e2e`) require Docker with `trezor-user-env` and regtest containers. These are not needed for unit tests or web dev.
