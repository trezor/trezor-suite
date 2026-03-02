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

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Suite Web | `yarn suite:dev` | 8000 | Primary app; see `skills/development-commands.md` for all commands |
| trezor-user-env | `sudo docker compose -f docker/docker-compose.suite-ci-e2e.yml up -d trezor-user-env-unix` | 9001 (WS), 9002 (dashboard) | Trezor device emulator; requires Docker |

### Trezor emulator setup

After starting the `trezor-user-env` container, you must start an emulator and bridge via its WebSocket API before Suite can detect a device. The sequence is:

1. Start the container (see table above)
2. Wait for port 9002 to respond with HTTP 200
3. Send WebSocket commands to `ws://127.0.0.1:9001/`:
   - `{ type: 'bridge-stop' }` — stop any existing bridge
   - `{ type: 'emulator-stop' }` — stop any running emulator
   - `{ type: 'emulator-start', model: 'T2T1', version: '2-latest', wipe: true }` — start a Model T emulator
   - `{ type: 'emulator-setup', mnemonic: 'all all all all all all all all all all all all', pin: '', passphrase_protection: false, label: 'My Trevor', needs_backup: false }` — configure the emulator with a test seed
   - `{ type: 'bridge-start', version: 'node-bridge' }` — start the bridge on port 21325
4. Suite at `localhost:8000` will auto-detect the emulated device through the bridge
5. The emulator firmware hash check warning is expected — dismiss it to proceed

The `@trezor/trezor-user-env-link` package wraps these WebSocket calls; E2E tests use `TrezorUserEnvLink` from that package. See `packages/trezor-user-env-link/src/api.ts` for the full API.

### Caveats

- **Node version**: Requires Node.js 24 (see `.nvmrc` for exact version). Use `nvm use` before running commands.
- **Essential build required**: Before starting `yarn suite:dev`, you must run `yarn build:essential` once. This builds `@trezor/suite-data`, `@trezor/transport-bridge`, and message-system config (~20s).
- **Webpack initial compile**: First `yarn suite:dev` webpack compile takes ~60s. Subsequent HMR is fast. Use `yarn suite:dev:vite` for faster cold starts.
- **Unit tests**: `yarn workspace @trezor/utils test:unit` is a quick smoke test (~3s). Full suite via `yarn test:unit` takes much longer.
- **Lint**: `yarn g:eslint --max-warnings 0 --flag v10_config_lookup_from_file --concurrency auto <files>` for targeted linting. Full repo lint via `yarn lint:js`.
- **Hardware wallet features**: Cannot be tested without a Trezor device or the `trezor-user-env` Docker emulator. The app still loads and navigates without one.
- **Pre-commit hook**: Runs ESLint on staged `.js/.jsx/.ts/.tsx` files. Can be skipped with `export TREZOR_PRE_COMMIT_ESLINT_SKIP=true`.
- **Docker in cloud VM**: Docker must be configured with `fuse-overlayfs` storage driver and `iptables-legacy` for nested container support. See the initial setup session for details.
