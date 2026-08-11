## Architecture

Trezor Suite is a Yarn (v4) workspaces monorepo built and checked with **Nx** (`nx.json`). Root scripts like `type-check`, `test:unit`, `lint:js`, and `lint:styles` run via `yarn nx affected --target=...`, so by default they only touch packages changed relative to `origin/develop` — use the `:all` variant (e.g. `yarn test:unit:all`) to run across the whole repo.

### Package layers

Code is organized into four workspace scopes with a strict one-way dependency direction (see the [Packages skill](skills/packages/SKILL.md)):

- `packages/` (`@trezor/*`) — domain-agnostic libraries and apps: `connect` (Trezor Connect SDK core, with `connect-web`/`connect-webextension`/`connect-mobile` providing the iframe/popup, WebExtension, and mobile entry points around it), `transport`/`transport-bridge`/`transport-web` (device communication), `blockchain-link` (blockchain backend clients), `protobuf`/`protocol` (device wire protocol), `components`/`styles`/`theme` (design system), and `suite-desktop*` (Electron shell).
- `suite-common/` (`@suite-common/*`) — business logic shared between the web/desktop and mobile apps (e.g. `wallet-core`, `message-system`, `device`); imports only from `packages/`.
- `suite/` (`@suite/*`) — desktop & web app feature code; imports from `packages/` and `suite-common/`.
- `suite-native/` (`@suite-native/*`) — mobile app (React Native); imports from `packages/` and `suite-common/`.

**Redux**: both apps compose their store (see `packages/suite/src/reducers/store.ts` for web/desktop, `suite-native/state` for mobile) from `@suite-common/wallet-core` slices plus their own platform-specific reducers/`@suite/*` or `module-*` packages. Follow [Redux conventions](skills/redux/SKILL.md).
A package may only import from scopes listed above it (e.g. `suite` can depend on `suite-common`, never the reverse).

`suite-common/AGENTS.md` and `suite-native/AGENTS.md` layer additional mandatory skills (test utilities) on top of this file — check for one when working inside those trees.

## Skills

**All skills are mandatory reading** before making changes.

- [Basic Syntax](skills/basic-syntax/SKILL.md) – If-else, ternaries, and other syntax rules
- [Code Style Guide](skills/skills-and-code-style-contribution/SKILL.md) – How to contribute code style proposals
- [Comments](skills/comments/SKILL.md) – Comment formatting conventions
- [Common Issues](skills/common-issues/SKILL.md) – Known issues and their solutions
- [Components](skills/components/SKILL.md) – React component file structure and patterns
- [Common Tasks](skills/common-tasks/SKILL.md) – Dependency management, package creation, and troubleshooting
- [Defensive Programming](skills/defensive-programming/SKILL.md) – Exhaustive checks, safe defaults, and non-mutating array methods
- [Dependency Injection](skills/dependency-injection/SKILL.md) – DI pattern for service definitions, factories, and composition roots
- [Development Commands](skills/development-commands/SKILL.md) – Running apps, linting, testing, and building
- [Git and Commit Guidelines](skills/git-and-commit-guidelines/SKILL.md) – Conventional Commits format and best practices
- [IDB Migrations](skills/idb-migrations/SKILL.md) – Creating IndexedDB storage migrations for the Suite web app
- [Import/Export](skills/import-export/SKILL.md) – Named exports and import ordering
- [Naming](skills/naming/SKILL.md) – Naming conventions for variables, functions, and files
- [Packages](skills/packages/SKILL.md) – How to create and structure packages
- [Performance Complexity](skills/performance-complexity/SKILL.md) – Asymptotic complexity: indexing before iteration, sort comparators, reduce accumulators
- [Performance DOM](skills/performance-dom/SKILL.md) – Forced layout from DOM reads, observer APIs, and transitioning only compositor properties
- [Performance React Hooks](skills/performance-react-hooks/SKILL.md) – Memoization under React Compiler, stable hook dependencies, and telling a wasted memo from a render loop
- [Performance Scheduling](skills/performance-scheduling/SKILL.md) – Breaking up long tasks and deferring non-essential work off the critical path
- [Project Overview](skills/project-structure/SKILL.md) – What Trezor Suite is and how the monorepo is organized
- [Publish Config](skills/publish-config/SKILL.md) – publishConfig rules for public npm packages
- [Redux](skills/redux/SKILL.md) – Redux Toolkit patterns and best practices
- [Security Headers](skills/security-headers/SKILL.md) – Permissions-Policy rationale and previewing the app with production security headers
- [Setup Requirements](skills/setup-requirements/SKILL.md) – Prerequisites and initial environment setup
- [Tests](skills/tests/SKILL.md) – Test style guidelines and best practices
- [Tests Commands](skills/tests-commands/SKILL.md) – Running tests and test-related guidelines
- [Tests Common](skills/tests-common/SKILL.md) – TDD practices for suite-common packages
- [Tests Native](skills/tests-native/SKILL.md) – TDD practices for suite-native packages
- [TypeScript](skills/typescript/SKILL.md) – TypeScript-specific conventions

# Confidential data — never send it off the device

Account/device confidential data must never leave the device to any external sink (analytics, Sentry, off-device logging, breadcrumbs, request URLs, any remote endpoint). Trace the actual value at the call site, not just the field type, and check the whole repo for outbound reporting.

Confidential (see `redactAccount`/`redactDevice` in `suite-common/logger/src/utils.ts`): device id/label/state, static session id, `session_id`; account descriptor/xpub/key, addresses, UTXOs, txids; exact balances/amounts; labels and free-form user text; passphrase/seed/PIN/wipe code.

## Quick Commands

Full detail lives in the [Development Commands](skills/development-commands/SKILL.md), [Tests Commands](skills/tests-commands/SKILL.md), and [Setup Requirements](skills/setup-requirements/SKILL.md) skills — this is just the fast path.

```bash
# Setup (first time; ~15-20 min)
git submodule update --init --recursive && git lfs install && git lfs pull
nvm install && yarn && yarn build:essential

# Run
yarn suite:dev              # web app, http://localhost:8000
yarn suite:dev:desktop      # Electron app
yarn native:start           # mobile app

# Validate (all affected-only by default; append :all to run repo-wide)
yarn type-check --no-tui
yarn test:unit
yarn lint:js:fix --no-tui && yarn lint:styles --no-tui
yarn workspace @scope/package-name test:unit --coverage=0 file.test.ts   # single test file
```

# Other Notes

- **Build times**: Initial setup takes 15-20 minutes; builds can take 10-15 minutes
- **Windows**: Use Git Bash instead of cmd/PowerShell; consider WSL for better performance
- **Testing**: Some tests may time out in CI environments without network access
- **Hardware wallets**: Use trezor/trezor-user-env emulator for development
