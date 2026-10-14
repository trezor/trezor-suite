# Contributing to Trezor Suite

Thanks for your interest in contributing to Trezor Suite! This monorepo hosts three
products — **Trezor Suite** (desktop & web), **Trezor Suite Mobile**, and
**Trezor Connect** — and we welcome improvements from the community.

This guide is aimed at **external contributors**. It describes how to report issues,
set up your development environment, meet our code-quality bar, and get your changes
merged. It is inspired by the
[GitLab Contributing Guide](https://docs.gitlab.com/ee/development/contributing/).

> **Security vulnerabilities: do not open a public issue.**
> Please report suspected vulnerabilities in private to
> **security@satoshilabs.com**. See the
> [Responsible Disclosure](https://trezor.io/security) policy for details.

## Table of contents

1. [Ways to contribute](#ways-to-contribute)
2. [Before you start](#before-you-start)
3. [Development environment](#development-environment)
4. [Running the apps](#running-the-apps)
5. [Code quality requirements](#code-quality-requirements)
6. [Testing](#testing)
7. [Commit messages](#commit-messages)
8. [Pull request workflow](#pull-request-workflow)
9. [Reporting issues](#reporting-issues)
10. [Translations](#translations)
11. [Project conventions & skills](#project-conventions--skills)
12. [Communication & support](#communication--support)

---

## Ways to contribute

There are many ways to help, not all of them require writing code:

- **Report bugs** using the relevant issue template.
- **Propose improvements** via the Code Improvement Proposal template.
- **Fix bugs** or **implement features** tracked in existing issues — look for issues
  that are not yet assigned and, ideally, labelled as good first issues.
- **Improve documentation** in `README.md`, the `docs/` folder, or package-level READMEs.
- **Help with translations** via our Crowdin project (see [Translations](#translations)).
- **Triage issues** by reproducing bugs, providing additional logs, or linking duplicates.

If you are unsure where to start, browse [open issues](https://github.com/trezor/trezor-suite/issues)
and pick one that matches your interest and skill set.

## Before you start

1. **Search first.** Check
   [open issues](https://github.com/trezor/trezor-suite/issues) and
   [pull requests](https://github.com/trezor/trezor-suite/pulls) to avoid duplicate
   work. If something similar exists, join that thread instead of opening a new one.
2. **Discuss larger changes first.** For anything beyond a small bug fix or a
   self-contained improvement, please open an issue _before_ you start coding. This
   lets maintainers give direction, flag constraints (security, hardware, protocol
   compatibility), and avoid wasted effort.
3. **Scope your PR.** One logical change per PR. Split refactors from behavioural
   changes; they are easier to review and safer to revert.
4. **No obligation to accept.** Maintainers may close PRs that don't fit the project
   direction. When in doubt, ask first.

## Development environment

### Prerequisites

- **Node.js** — exact version is pinned in [`.nvmrc`](.nvmrc). Use
  [`nvm`](https://github.com/nvm-sh/nvm) (or an equivalent) and run `nvm install`
  inside the repo to get the right version.
    > The Node version must stay consistent with `suite-native/app/eas.json`.
- **Yarn** — the version is pinned in the `packageManager` field of the root
  [`package.json`](package.json). Yarn is vendored via `.yarn/` and Corepack, so
  running `yarn` in the repo root uses the correct version automatically.
- **Git LFS** — required for binary assets. Install per
  [Git LFS docs](https://git-lfs.com) (on Debian/Ubuntu:
  `sudo apt-get install git-lfs`).
- **Git submodules** — the repo uses submodules; initialise them after cloning.

### Clone & initial setup

```bash
git clone https://github.com/trezor/trezor-suite.git
cd trezor-suite

# Use the pinned Node version
nvm install

# Initialise submodules & LFS (run once per clone)
git submodule update --init --recursive
git lfs install
git lfs pull

# Install dependencies
yarn
# If Playwright post-install fails, use: yarn --mode=skip-build

# Build essential libraries (required before running any app; ~3–5 min)
yarn build:essential
```

> **Tip:** `git config --global submodule.recurse true` makes submodules update
> automatically with normal `git pull` / `git checkout`.

**Platform notes**

- **Windows:** use Git Bash (not cmd or PowerShell); WSL2 is recommended for
  performance.
- **macOS / Linux:** supported directly.
- **Nix users:** a `.nix` config is provided for a reproducible shell.
- **Build times:** first-time setup typically takes 15–20 minutes; full builds
  10–15 minutes.

IDE-specific settings (VS Code, JetBrains, etc.) are documented in
[`docs/misc/IDE.md`](docs/misc/IDE.md).

## Running the apps

Common entry points (see [`README.md`](README.md) for the full list):

| What you want to run                        | Command                                     |
| ------------------------------------------- | ------------------------------------------- |
| Suite web (dev, production-fidelity)        | `yarn suite:dev`                            |
| Suite web (Vite dev — faster, experimental) | `yarn suite:dev:vite`                       |
| Suite desktop (Electron)                    | `yarn suite:dev:desktop`                    |
| Suite mobile (React Native / Expo)          | `yarn native:start` _(plus platform steps)_ |
| Suite web — production build preview        | `yarn suite:build:web:preview`              |

You **do not need a physical Trezor device** to develop: use the
[`trezor/trezor-user-env`](https://github.com/trezor/trezor-user-env) emulator.

For mobile (iOS / Android) you need additional native tooling; follow the mobile
setup steps in the README before running `yarn native:start`.

**Optional local config:** copy `env.local.example` to `.env.local` in the repo
root. Setting `TANSTACK_REACT_QUERY_DEV_TOOLS=true` enables React Query Devtools
on localhost.

## Code quality requirements

Every PR must pass a set of automated checks. You can (and should) run them
locally before pushing.

| Check                                      | Command                | Enforced by              |
| ------------------------------------------ | ---------------------- | ------------------------ |
| TypeScript type-check                      | `yarn type-check`      | `check-code-validation`  |
| ESLint (JS/TS)                             | `yarn lint:js`         | `check-code-validation`  |
| Stylelint (CSS-in-JS)                      | `yarn lint:styles`     | `check-code-validation`  |
| Prettier formatting                        | `yarn format:verify`   | `check-code-validation`  |
| Shell script validation (shellcheck)       | `yarn lint:shellcheck` | `check-shell-validation` |
| Unit tests                                 | `yarn test:unit`       | `check-test-health`      |
| Dependency hygiene                         | `yarn depcheck`        | `check-code-validation`  |
| Project references / workspace resolutions | `yarn validate`        | `check-code-validation`  |
| CodeQL security analysis                   | _(runs in CI)_         | `check-codeql-analysis`  |

A single convenience command to run most local validation at once:

```bash
yarn validate
```

**Autofix before you push:**

```bash
yarn lint:js:fix
yarn format
```

**Husky hooks** (`.husky/pre-commit`) run lint and formatting on staged files
automatically. Do not bypass them unless you have a very good reason
(`--no-verify`).

### General style & design rules

We follow a set of conventions documented as "skills" in the
[`skills/`](skills/) directory. The most relevant ones for contributors are
summarised in [Project conventions & skills](#project-conventions--skills) below.
In short:

- **TypeScript first** — prefer explicit types over `any`; exhaustive checks for
  discriminated unions.
- **Named exports**, organised imports.
- **Functional React components** with hooks; keep components small and
  co-locate files per component.
- **Redux Toolkit** for state where Redux is already used.
- **No silent catches** — handle errors defensively or propagate them.

## Testing

- **Framework:** Jest (runs via `yarn test:unit`, `yarn test:unit:suite`,
  `yarn test:unit:native`, `yarn test:unit:all`).
- **Location:** tests live in `__tests__/` folders next to the code they cover,
  with a `.test.ts` / `.test.tsx` extension. Type-only tests use the
  `.type-test.ts` suffix so Jest does not execute them.
- **Fixtures:** placed in a `mocks/` folder at the **package root** (not inside
  `src/`), with a `mock` prefix in file names.
- **Translations in tests:** when asserting UI text, look strings up by their
  translation ID (`getTranslation('path.to.key')`) rather than hard-coded
  English. This prevents Crowdin sync PRs from breaking your tests. Hard-coded
  text is acceptable only when the exact wording is intentionally load-bearing
  and must not change without review.
- **E2E:** Suite has web (`build-suite-web-e2e`), desktop
  (`build-suite-desktop-e2e`) and native (`build-suite-native-adhoc`) E2E
  pipelines. For most PRs you do not need to run E2E locally — CI will do it.
- **CI flakiness** is tracked via `check-test-health-nightly`. If you think a
  failure is a flake, re-run the job; if it flakes repeatedly, mention it in the
  PR so maintainers can investigate.

## Commit messages

We use [**Conventional Commits**](https://www.conventionalcommits.org/en/v1.0.0/)
and this is **enforced by CI** (`check-commit-message.yml`). See
[`COMMITS.md`](COMMITS.md) for the canonical rules and the optional local
`commit-msg` hook.

**Format:**

```
<type>(<scope>): <short description>

[optional body]

[optional footer — e.g. "Closes #1234"]
```

**Allowed types:** `build`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`,
`style`, `test`, `chore`, `revert`.

**Common scopes:** `suite`, `suite-native`, `connect`, `components`, `analytics`,
plus package-specific scopes.

**Good examples:**

```
feat(suite): add transaction history CSV export
fix(components): correct modal z-index on Safari
docs: clarify Git LFS requirement in README
chore(deps): bump eslint to 9.x
```

**Further rules:**

- One logical change per commit where practical.
- Reference issues in the body (`Closes #1234`, `Refs #5678`).
- `Revert ...` and `fixup! ...` commits skip the format check.
- If you need to break the format during local WIP, squash or rewrite before
  opening the PR.

## Pull request workflow

1. **Fork** the repository and create your branch from `develop` (the default
   branch). Use a descriptive branch name, e.g.
   `feat/suite-export-history` or `fix/mobile-keyboard-overlay`.
2. **Keep your branch up to date** with `develop`. Prefer rebase for clean
   history, merge if the diff is complex.
3. **Open the PR against `develop`.** Fill in the template
   ([`.github/pull_request_template.md`](.github/pull_request_template.md))
   completely:
    - **Description** — what and why (not just _what_).
    - **Notes for QA** — steps, edge cases, affected areas, known side-effects,
      or anything QA should _not_ need to test. This section matters: QA is a
      required stage before release.
    - **Related Issue** — link it (`Resolve #1234`) so automation can close it.
    - **Screenshots / screen recordings** — mandatory for any visible UI change.
4. **Mark as Draft** while you are still iterating. Switch to _Ready for review_
   once CI is green and you want human eyes on it.
5. **Wait for CI.** All required checks must pass:
   `check-code-validation`, `check-commit-message`, `check-codeql-analysis`,
   `check-project-assignment`, `check-shell-validation`, and the relevant
   `build-*` / `check-test-health` jobs. Flakes do happen — a maintainer can
   re-run failed jobs on external PRs.
6. **Respond to review comments.** Push follow-up commits; do **not** force-push
   during review (it breaks reviewer diffs). A maintainer will squash on merge
   if needed.
7. **QA.** Once approved, a PR is labelled for QA. Keep the branch available for
   testing until it is merged.
8. **Merge.** Maintainers merge PRs; external contributors do not have merge
   rights. The PR title becomes the squash commit message, so it must also
   follow Conventional Commits format.

**What to avoid**

- Large, multi-purpose PRs — they will be asked to split.
- Unrelated reformatting or "drive-by" refactors inside a feature PR.
- Committing **build artefacts** (`dist/`, `build/`, compiled `.js` / `.d.ts`
  next to `.ts` sources, `tsconfig.tsbuildinfo`, `coverage/`, `.nx/cache/`,
  `storybook-static/`, native build dirs like `ios/Pods/` or `android/.gradle/`),
  **`node_modules`**, unintentional **lockfile** (`yarn.lock`) changes, or
  secrets / `.env.local` contents. Auto-generated sources that _are_ tracked
  (e.g. output of `yarn update-project-references`, Crowdin-synced locale
  files) should be committed by the right PR — the Crowdin sync bot's PR, or
  a dedicated chore PR — not rolled into a feature PR.

## Reporting issues

Use the correct template from
[`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/):

- **Suite issue** — general product issue.
- **Suite bug** — a reproducible bug. Include: Suite version, OS, device model &
  firmware, reproduction steps, expected vs actual behaviour, and logs /
  screenshots where possible.
- **Code improvement proposal** — refactors, dev-experience improvements.
- **Dependency maintenance task** — upgrade / replace / remove a dependency.

**Please provide enough information to reproduce.** Issues without reproduction
steps are much harder to triage and may be closed.

> Reminder: **never file a public issue for a suspected security vulnerability.**
> Email **security@satoshilabs.com** instead.

## Translations

User-facing strings are managed through **Crowdin** and synced back into the
repo by an automated bot (`bot-crowdin-sync.yml`).

- **Do not** hand-edit translated locale JSON files in PRs that are not the
  Crowdin sync PR — your edits will be overwritten on the next sync.
- **English source strings** live in the codebase (e.g. `messages.ts`). Add new
  strings there; Crowdin will pick them up and expose them to translators.
- **Translating into other languages** — join the Crowdin project instead of
  editing files directly. Ask in an issue if you need access.
- If you spot a **translation bug** (typo, wrong language in a file, broken
  placeholder), feel free to open an issue; linguists will fix it in Crowdin.

## Project conventions & skills

Detailed coding conventions live in the [`skills/`](skills/) directory. These
are the same guidelines referenced by `AGENTS.md` for AI coding assistants; they
apply equally to human contributors. Key entries:

- [Project structure](skills/project-structure/SKILL.md) — what lives where in
  the monorepo.
- [Setup requirements](skills/setup-requirements/SKILL.md)
- [Development commands](skills/development-commands/SKILL.md)
- [Git and commit guidelines](skills/git-and-commit-guidelines/SKILL.md)
- [TypeScript](skills/typescript/SKILL.md),
  [Basic syntax](skills/basic-syntax/SKILL.md),
  [Naming](skills/naming/SKILL.md),
  [Import/Export](skills/import-export/SKILL.md),
  [Comments](skills/comments/SKILL.md)
- [Components](skills/components/SKILL.md),
  [Redux](skills/redux/SKILL.md),
  [Defensive programming](skills/defensive-programming/SKILL.md)
- [Packages](skills/packages/SKILL.md),
  [Publish config](skills/publish-config/SKILL.md)
- [Tests](skills/tests/SKILL.md),
  [Tests commands](skills/tests-commands/SKILL.md),
  [Tests common](skills/tests-common/SKILL.md),
  [Tests native](skills/tests-native/SKILL.md)
- [Common issues](skills/common-issues/SKILL.md) — known gotchas and their
  fixes.

Please skim at least _Project structure_, _Git and commit guidelines_, and the
skill matching the area you are touching before opening a PR.

## Communication & support

- **Questions about contributing** — open a discussion or comment on a related
  issue.
- **General Trezor support / user questions** — these belong on the
  [Trezor support site](https://trezor.io/support), not the GitHub tracker.
- **Security contact** — **security@satoshilabs.com** (private disclosures only).

## License

By contributing, you agree that your contributions will be licensed under the
same license as the project (see [`LICENSE`](LICENSE) / the relevant
package-level license file). Make sure you have the right to submit the code
you are contributing.

---

Thank you for helping make Trezor Suite better! 🧡
