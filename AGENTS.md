# Repository workflow

Before editing, inspect `git status --short`, the owning package's manifest, nearby implementations and
relevant tests. Preserve existing uncommitted work. Follow established patterns and public package
interfaces; avoid unrelated refactors, dependency churn, generated-file edits and formatting sweeps.

Carry an authorized implementation or bug fix through relevant verification. Choose routine, reversible
implementation details without renewed confirmation. Ask a focused question only when an unresolved
decision materially affects correctness, scope or authorization; continue independent authorized work.
Higher-priority instructions and tool permission boundaries still apply. If an instruction blocks work,
link its exact source, quote the blocking rule and explain what remains possible. Skill recommendations
alone do not create an approval gate; explicit user instructions take precedence over skill guidance.

## Instruction scope and skills

Check instruction files along the path to files you will edit, including nested directories when
starting Codex at the repository root. `AGENTS.override.md` replaces `AGENTS.md` in the same directory;
more specific directory instructions govern that subtree. Read applicable skills once before making
changes, using the task and their descriptions to select them; unrelated skills need not be loaded.
Nested mandatory skills still apply within their stated scope.

- TypeScript changes: [Syntax](skills/basic-syntax/SKILL.md), [TypeScript](skills/typescript/SKILL.md),
  [Naming](skills/naming/SKILL.md), [Imports](skills/import-export/SKILL.md),
  [Defensive programming](skills/defensive-programming/SKILL.md), [Comments](skills/comments/SKILL.md).
- React/UI: [Components](skills/components/SKILL.md), [React hooks](skills/performance-react-hooks/SKILL.md).
  For relevant operations: [Collections](skills/performance-complexity/SKILL.md),
  [DOM/CSS](skills/performance-dom/SKILL.md), [Scheduling](skills/performance-scheduling/SKILL.md).
- State/services: [Redux](skills/redux/SKILL.md),
  [Dependency injection](skills/dependency-injection/SKILL.md) where the package uses DI.
- Tests: [Test conventions](skills/tests/SKILL.md), [Commands](skills/tests-commands/SKILL.md),
  [Common tests](skills/tests-common/SKILL.md) or [Native tests](skills/tests-native/SKILL.md).
  Preserve suite-common's test-first feature workflow and platform test utilities. E2E tests follow
  [Suite E2E instructions](suite/e2e/AGENTS.md), including their `tests/` layout; unit tests are co-located.
- Setup/verification: [Setup](skills/setup-requirements/SKILL.md),
  [Development commands](skills/development-commands/SKILL.md), [Troubleshooting](skills/common-issues/SKILL.md).
- Package/dependency work: [Packages](skills/packages/SKILL.md), [Common tasks](skills/common-tasks/SKILL.md),
  [Publishing metadata](skills/publish-config/SKILL.md). Orientation: [Project structure](skills/project-structure/SKILL.md).
- Persistence/browser APIs: [IDB migrations](skills/idb-migrations/SKILL.md),
  [Security headers](skills/security-headers/SKILL.md). Migration default exports are a specific exception
  to the general named-export rule.
- Commits/PRs: [Git conventions](skills/git-and-commit-guidelines/SKILL.md).
  Style proposals: [Contribution guide](skills/skills-and-code-style-contribution/SKILL.md).

The architecture and verification rules below supersede conflicting generalizations in the Packages
and Development Commands skills, including the latter's prohibition on affected typechecks and
once-only limit. Diagnose failures before applying troubleshooting recipes; cache deletion, dependency
reinstallation and killing development servers are not routine prerequisites.

## Architecture and code map

This is a Yarn workspaces monorepo orchestrated by Nx. `package.json` also includes `networks/*/*`,
`packages/connect-examples/*` and `scripts` workspaces. Read package names from manifests, not paths.

- `packages/` (`@trezor/*`): Reusable libraries: `connect` SDK,
  `connect-web`/`connect-webextension`/`connect-mobile` entry points, `transport*`,
  `blockchain-link`, `protobuf`/`protocol`; UI libraries `components`, `styles`, `theme`. Keep
  reusable libraries independent of app layers.
- `suite-common/` (`@suite-common/*`): Shared wallet/domain logic, including `wallet-core`,
  `device`, `message-system`. May use shared peers and reusable `@trezor/*` libraries; must not
  depend on desktop/web or native app code.
- `suite/` (`@suite/*`): Desktop/web features; may use peers, shared logic and reusable libraries,
  never native app code. `suite/e2e` is the Playwright workspace (`@trezor/suite-e2e`).
- `suite-native/` (`@suite-native/*`): Mobile features and `app` (Expo/React Native); may use peers,
  shared logic and reusable libraries, never desktop/web app code.
- `packages/suite*`: Existing app-layer exception to the `packages/` convention: `suite` contains
  the web/desktop React app; `suite-web` and `suite-build` host/build it; `suite-desktop` and
  `suite-desktop-core` contain Electron code. Existing app composition depends on `@suite/*` and
  `@suite-common/*`; this is not permission to introduce app dependencies into reusable libraries.

Keep dependencies acyclic. Web/desktop Redux assembly is in `packages/suite/src/reducers/store.ts`;
native assembly is in `suite-native/state/src/store.ts`. Shared slices live in
`suite-common/wallet-core`; follow the Redux skill's state and dependency contracts.
IndexedDB storage and migrations live in `packages/suite/src/storage`.
Project gates are in `.github/workflows/check-code-validation.yml`; target prerequisites are in `nx.json`.

## Setup and commands

Run commands from the repository root unless stated otherwise. Use Node from `.nvmrc` (Node 24) and
Yarn pinned by `package.json` / `.yarnrc.yml` (4.18.0); do not substitute npm or pnpm. macOS/Linux are the
primary development platforms; see `README.md` for Windows and Nix setup.

For a fresh checkout, follow `README.md`: initialize submodules with
`git submodule update --init --recursive`, install Git LFS once with `git lfs install`, run `git lfs pull`,
then `nvm install`, `yarn` and `yarn build:essential`. Reuse an already prepared environment.
Use `yarn --immutable` when installing without intended lockfile changes, as validation CI does.
Preserve `.yarnrc.yml` install-script allowlisting and dependency age gates. Skipping dependency builds
is not a substitute for runtime prerequisites.

- Web development: `yarn suite:dev` at `http://localhost:8000`; `yarn suite:dev:vite` is
  experimental and development-only.
- Electron development: `yarn suite:dev:desktop`; requires a graphical environment.
- Mobile development: Follow `suite-native/app/README.md` for Android SDK/emulator or macOS/Xcode
  setup and `yarn native:prebuild`; run `yarn native:start` and `yarn native:android` or `yarn native:ios`. Android localhost services use `yarn native:reverse-ports`.
- Focused unit test: `yarn workspace <package-name> test:unit --coverage=0 path/to/file.test.ts`
  (path relative to that workspace); also supports `.test.tsx`. Direct workspace scripts bypass Nx
  prerequisites: prepare generated dependencies first, including `yarn workspace @suite-common/message-system build:lib` when needed.
- Package typecheck: `yarn nx run <package-name>:type-check --no-tui`; can also check dependencies
  and fetch guide content per `nx.json`.
- Package lint: `ESLINT_RUN_EXPENSIVE_CHECKS=true yarn workspace <package-name> lint:js`; use the
  package's `lint:styles` script for styles where present.
- Formatting changed files: `yarn prettier --check <files>`; use `--write` only on intended files.
- Affected checks: `yarn test:unit --no-tui`, `yarn type-check --no-tui`,
  `ESLINT_RUN_EXPENSIVE_CHECKS=true yarn lint:js --no-tui`, `yarn lint:styles --no-tui`, `yarn format:verify`. Styles also runs local Stylelint rule tests.
- Library build validation: `yarn build:libs:verify --no-tui` builds affected libraries; `yarn build:libs` rebuilds all libraries without Nx cache, so reserve it for a demonstrated need.
- Production web behavior: `yarn suite:build:web`; `yarn suite:build:web:preview` builds and serves
  with production security headers. For an existing build: `yarn workspace @trezor/suite-web preview`.
- Web/desktop E2E: `yarn workspace @trezor/suite-e2e test:e2e:web <test-file> --project=<project>`
  or `test:e2e:desktop`; inspect `suite/e2e/playwright-config` for projects. Requires Playwright
  browsers/system dependencies, a running web app or built Electron app, and scenario
  services/emulators (Trezor User Env/Docker). Setup reference:
  `.github/workflows/template-suite-run-e2e.yml`.

Nx affected commands default to `origin/develop` but `NX_BASE` / `NX_HEAD` or `--base` / `--head` can
override the comparison; CI sets SHAs in `.github/actions/nx-checkout/action.yml`. Ensure the comparison
covers the intended changes and the base/history exist. A successful run with zero selected projects
is not verification of changed code. Use an explicit package target when appropriate. Repo-wide
variants exist for `test:unit:all`, `type-check:all`, `lint:js:all` and `lint:styles:all`;
`lint:js:all` excludes the root and scripts workspaces. Do not assume every command has an `:all` alias.

## Verification and completion

Choose checks from the owning package and affected consumers. For behavior changes, reproduce the
issue or establish the expected behavior, add meaningful regression coverage where applicable, and
confirm the fix plus relevant failure/edge cases. Run scoped lint and typechecks for TypeScript changes;
expand to affected checks for shared contracts, dependencies or configuration. Match CI's
`ESLINT_RUN_EXPENSIVE_CHECKS=true` when validating JS/TS. Build changed publishing/bundling surfaces;
exercise changed UI/runtime behavior in the relevant app when available, including production headers
for browser-permission changes. Documentation-only edits need link/command/diff and formatting checks,
not application builds or tests.

Complete relevant project gates from `.github/workflows/check-code-validation.yml`. Package/dependency
changes also require `yarn requirements:verify`, `yarn verify-project-references`,
`yarn check-workspace-resolutions`, `yarn dedupe --check` and `yarn depcheck`; inspect the workflow for
additional domain-specific gates (translations, message-system config, circular imports, etc.).
`yarn validate` includes autofixes and does not include unit tests; it is not a complete substitute.

After checks pass, repeat or broaden them only for subsequent edits, failures or unresolved risks.
Inspect actual exit status and selected targets; distinguish Nx cache hits, passes, failures and checks
not run. If prerequisites or permissions block a check, report the exact limitation and continue checks
that remain possible. Finish by reviewing the diff for scope, correctness and accidental generated or
formatting changes. Report the resulting behavior, verification commands/results and concrete remaining
limitations concisely; do not describe inspected commands as executed or untested behavior as verified.

## Confidential data — never send it off the device

Account/device confidential data must never leave the device to any external sink (analytics, Sentry,
off-device logging, breadcrumbs, request URLs, any remote endpoint). Trace the actual value at the call
site, not just the field type, and check the whole repo for outbound reporting.

Confidential (see `redactAccount`/`redactDevice` in `suite-common/logger/src/utils.ts`): device
id/label/state, static session id, `session_id`; account descriptor/xpub/key, addresses, UTXOs, txids;
exact balances/amounts; labels and free-form user text; passphrase/seed/PIN/wipe code.
