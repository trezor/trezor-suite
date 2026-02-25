## Skills

**All skills are mandatory reading** before making changes.

- [Basic Syntax](skills/basic-syntax.md) – If-else, ternaries, and other syntax rules
- [Code Style Guide](skills/index.md) – How to contribute code style proposals
- [Comments](skills/comments.md) – Comment formatting conventions
- [Common Issues](skills/common-issues.md) – Known issues and their solutions
- [Components](skills/components.md) – React component file structure and patterns
- [Common Tasks](skills/common-tasks.md) – Dependency management, package creation, and troubleshooting
- [Defensive Programming](skills/defensive-programming.md) – Exhaustive checks and safe defaults
- [Development Commands](skills/development-commands.md) – Running apps, linting, testing, and building
- [Git and Commit Guidelines](skills/git-and-commit-guidelines.md) – Conventional Commits format and best practices
- [Import/Export](skills/import-export.md) – Named exports and import ordering
- [Naming](skills/naming.md) – Naming conventions for variables, functions, and files
- [Packages](skills/packages.md) – How to create and structure packages
- [Project Overview](skills/project-structure.md) – What Trezor Suite is and how the monorepo is organized
- [Redux](skills/redux.md) – Redux Toolkit patterns and best practices
- [Setup Requirements](skills/setup-requirements.md) – Prerequisites and initial environment setup
- [Tests](skills/tests.md) – Test style guidelines and best practices
- [Tests Commands](skills/tests-commands.md) – Running tests and test-related guidelines
- [Tests](skills/tests.md) – Test style guidelines and best practices
- [TypeScript](skills/typescript.md) – TypeScript-specific conventions

## Formatting (mandatory)

After any code changes, run formatting on changed files before finishing:

1. `yarn g:prettier --write <changed-files>`
2. `yarn g:eslint --fix <changed-files>`

# Other Notes

- **Build times**: Initial setup takes 15-20 minutes; builds can take 10-15 minutes
- **Windows**: Use Git Bash instead of cmd/PowerShell; consider WSL for better performance
- **Testing**: Some tests may time out in CI environments without network access
- **Hardware wallets**: Use trezor/trezor-user-env emulator for development

## Cursor Cloud specific instructions

### Environment

- Node.js 24.11.1 is installed via nvm (see `.nvmrc`). The update script runs `nvm use` automatically.
- Yarn 4.12.0 (Berry) is the package manager, using `node-modules` linker (see `.yarnrc.yml`).
- Before any dev commands, `yarn build:essential` must have been run (the update script handles this).

### Running services

- **Suite Web**: `yarn suite:dev` starts webpack-dev-server at `http://localhost:8000`. Initial compile takes ~55 seconds.
- **Suite Web (Vite)**: `yarn suite:dev:vite` is faster for hot-reload iteration.
- See `skills/development-commands.md` for the full list of run/lint/test/build commands.

### Lint and test

- Lint a specific file: `yarn g:eslint --fix --flag v10_config_lookup_from_file --max-warnings 0 --concurrency auto <file>`
- Run unit tests for a package: `yarn workspace @trezor/<package> test:unit`
- The pre-commit hook runs ESLint on staged `.ts`/`.tsx` files. Set `TREZOR_PRE_COMMIT_ESLINT_SKIP=true` to bypass during iterative development.

### Gotchas

- `yarn install` triggers a `postinstall` script (`patch-package && husky`). If Playwright browser downloads fail in a headless environment, use `yarn --mode=skip-build` instead, then re-run native builds selectively.
- `build:essential` runs three background builds in parallel (`message-system-sign-config`, `@trezor/suite-data build:lib`, `@trezor/transport-bridge build:lib`). It must complete before `suite:dev` or tests will fail on missing artifacts.
- E2E tests (`@trezor/suite-e2e`) require Docker with `trezor-user-env` and regtest containers. These are not needed for unit tests or web dev.
