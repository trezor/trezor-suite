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

Check `AGENTS.md` files along the path to files you will edit, including nested directories when
starting at the repository root. More specific directory instructions govern that subtree.
Read applicable skills once before making changes, using the task and their descriptions to select
them; unrelated skills need not be loaded.
Nested mandatory skills still apply within their stated scope.

- General: [Asymptotic complexity](skills/performance-complexity/SKILL.md).
- TypeScript changes: [Syntax](skills/basic-syntax/SKILL.md), [TypeScript](skills/typescript/SKILL.md),
  [Naming](skills/naming/SKILL.md), [Imports](skills/import-export/SKILL.md),
  [Defensive programming](skills/defensive-programming/SKILL.md), [Comments](skills/comments/SKILL.md).
- React/UI: [Components](skills/components/SKILL.md), [React hooks](skills/performance-react-hooks/SKILL.md).
  For relevant operations: [DOM/CSS](skills/performance-dom/SKILL.md),
  [Scheduling](skills/performance-scheduling/SKILL.md),
  [Code splitting](skills/performance-code-splitting/SKILL.md).
- State/services: [Redux](skills/redux/SKILL.md),
  [Dependency injection](skills/dependency-injection/SKILL.md) where the package uses DI.
  For relevant operations: [Code splitting](skills/performance-code-splitting/SKILL.md).
- Tests: [Test conventions](skills/tests/SKILL.md),
  [Common tests](skills/tests-common/SKILL.md) or [Native tests](skills/tests-native/SKILL.md).
  Preserve suite-common's test-first feature workflow and platform test utilities. E2E tests follow
  [Suite E2E instructions](suite/e2e/AGENTS.md), including their `tests/` layout; unit tests are co-located.
- Setup/verification: [Development commands](skills/development-commands/SKILL.md),
  [Troubleshooting](skills/common-issues/SKILL.md).
- Package/dependency work: [Packages](skills/packages/SKILL.md), [Common tasks](skills/common-tasks/SKILL.md),
  [Publishing metadata](skills/publish-config/SKILL.md). Orientation: [Project structure](skills/project-structure/SKILL.md).
- Persistence/browser APIs: [IDB migrations](skills/idb-migrations/SKILL.md),
  [Security headers](skills/security-headers/SKILL.md). Migration default exports are a specific exception
  to the general named-export rule.
- Analytics/Sentry reporting: [Analytics and Sentry privacy](skills/analytics-and-sentry-privacy/SKILL.md).
- Commits: [Git conventions](skills/git-and-commit-guidelines/SKILL.md).
- GitHub PRs and issues: any write action (creating a PR or issue, review, comment, description,
  approval, merge) follows the mandatory [write rules](skills/github-write-actions/SKILL.md).
  Pull requests (create, review): [Pull requests](skills/pull-requests/SKILL.md).
  Issues: [GitHub issues](skills/github-issues/SKILL.md).
  Style proposals: [Contribution guide](skills/skills-and-code-style-contribution/SKILL.md).

The architecture and verification rules below supersede conflicting generalizations in the Packages
and Development Commands skills; typechecks follow the limits in Verification and completion.
Diagnose failures before applying troubleshooting recipes; cache deletion, dependency reinstallation
and killing development servers are not routine prerequisites.

## Architecture and code map

This is a Yarn workspaces monorepo orchestrated by Nx. `package.json` also includes `networks/*/*`,
`networks/network-module/*/*`, `packages/connect-examples/*` and `scripts` workspaces. Read package
names from manifests, not paths.

- `packages/` (`@trezor/*`): Reusable libraries: `connect` SDK,
  `connect-web`/`connect-webextension`/`connect-mobile` entry points, `transport*`,
  `blockchain-link`, `protobuf`/`protocol`; UI libraries `components`, `styles`, `theme`. Keep
  reusable libraries independent of app layers.
- `suite-common/` (`@suite-common/*`): Shared wallet/domain logic, including `wallet-core`,
  `device`, `message-system`. May use shared peers and reusable `@trezor/*` libraries; must not
  depend on desktop/web or native app code.
- `suite-app/` (`@suite-app/*`): Desktop/web application assembly. `web-app` is the web
  composition root. `desktop-app` owns Electron packaging, distribution and installers, composed
  from `desktop-app-renderer` (React entry point) and `desktop-app-main` (main and preload processes).
  Reusable features and network modules must not depend on app assembly.
- `suite/` (`@suite/*`): Desktop/web features and application code awaiting migration; may use peers,
  shared logic and reusable libraries, never native app code. `suite/e2e` is the Playwright
  workspace (`@trezor/suite-e2e`). The applications use `app-assets` (static assets and generation),
  `desktop-app-api` (desktop API contract), `desktop-app-api-electron` (Electron implementation)
  and `desktop-app-native-bindings` (compiled OS bindings).
- `suite-native/` (`@suite-native/*`): Mobile features and reusable building blocks; may use peers,
  shared logic and reusable libraries, never desktop/web app code.
- `suite-native-app/` (`@suite-native-app/*`): Mobile application assembly, including the Expo/React
  Native `app` entry point; may compose native features, shared logic and reusable libraries.
- `packages/suite`: Remaining app-layer exception to the `packages/` convention. It contains the
  web/desktop React app shared by both application roots. `suite-app/app/webpack` holds the
  Webpack pieces they share; each application owns its own `webpack.config.ts`. Existing app
  composition depends on `@suite/*` and `@suite-common/*`; this is not permission to introduce
  app dependencies into reusable libraries.

Keep dependencies acyclic. Web/desktop Redux assembly is in `suite-app/app/src/store.ts`;
native assembly is in `suite-native-app/state/src/createReduxStore.ts`. Shared slices live in
`suite-common/wallet-core`; follow the Redux skill's state and dependency contracts.
IndexedDB storage and migrations live in `packages/suite/src/storage`.
Project gates are in `.github/workflows/check-code-validation.yml`; target prerequisites are in `nx.json`.

## Setup and commands

Run commands from the repository root unless stated otherwise.
An install with `yarn --mode=skip-build`, as CI validation uses, is enough only for lint and typecheck;
running the app, E2E or tests that load native modules requires a full install.

- Web/desktop development: follow `README.md`.
- Mobile development: follow `suite-native-app/app/README.md`.
- Web/desktop E2E: follow `suite/e2e/docs/e2e-playwright-suite.md`.
- Workspace `test:unit` and `type-check` scripts bypass Nx prerequisites: on a fresh checkout run
  `yarn workspace @suite-common/message-system build:lib` first.

Root `test:unit`, `type-check`, `lint:js`, `lint:styles` and `build:libs:verify` run `nx affected`
against `origin/develop`. A run that selects zero projects verified nothing: run the targets
explicitly, e.g. `yarn nx run <package-name>:<target>`, including dependents when a shared contract
changed.

## Verification and completion

Typechecks are slow even per package: for isolated changes rely on focused tests, and IDE diagnostics
when available; run the package typecheck at most once near final validation, only for integration
risk or on request, and warn first. Run affected or repo-wide typechecks, including the CI type-check
gate, only on request. The default lint run skips the type-aware rules that CI enforces: before
finishing, lint the changed packages with `ESLINT_RULE_SET=all`.
Documentation-only edits need only `yarn format:verify`,
`yarn requirements:verify --only=docs-summary-exhaustive` and working relative links, not application
builds or tests.

Complete relevant project gates from `.github/workflows/check-code-validation.yml`. Package/dependency
changes also require `yarn requirements:verify`, `yarn verify-project-references`,
`yarn check-workspace-resolutions`, `yarn dedupe --check` and `yarn depcheck`.

After checks pass, repeat or broaden them only for subsequent edits, failures or unresolved risks.
Do not describe inspected commands as executed or untested behavior as verified.

## Confidential data

Account and device confidential data stays on the device. Confidential: device id, label, state and
serial number, static session id, `session_id`; account descriptor, xpub and public key, addresses, UTXOs,
txids; exact balances, amounts and fees; labels and free-form user text; passphrase, seed, PIN, wipe code.
Passphrase, seed, PIN and wipe code have no exception anywhere.

Never send off the device, or log in committed code, error messages, response bodies, logs or whole objects
(account, device, form state, Connect responses) as they are: they can carry confidential data. Pick the
non-sensitive fields or lines. A temporary local debug log removed before committing is fine.
Not confidential, so keep it where it helps: network symbol, coingeckoId, derivation type, account type
and index, firmware version and revision, device model.

- Code: before it sends a value to any remote sink (analytics, Sentry, off-device logs, request URLs, any
  other endpoint), check what the value actually holds where it is sent, not what its name or type
  suggests. Search the whole repo for other places that send it out, not only the analytics folders.
  Data a wallet feature already sends to its own backend, such as an address to a blockchain backend, is
  not a leak. Analytics events and Sentry reports follow
  [Analytics and Sentry privacy](skills/analytics-and-sentry-privacy/SKILL.md).
- Your own output: the same data stays out of issues, PR descriptions, comments, commit messages and any
  external tool or service. Fixtures use public test wallets only, never data from a real wallet. The only
  exception is in [GitHub issues](skills/github-issues/SKILL.md): issue screenshots from public QA and
  dev wallets may show addresses, balances, txids and labels.
