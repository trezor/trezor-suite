---
name: common-tasks
description: 'Use for Trezor Suite dependency changes, package scaffolding, submodule updates or build-environment repairs after diagnosis. Covers Yarn commands and related Nix pins.'
---

# Common Tasks

## Managing npm dependencies via yarn

Prefer existing dependencies. Add a new npm dependency only when no suitable dependency is already available in the repo.

```bash
yarn workspace @trezor/package-name add dependency-name
```

After adding or updating a dependency, run:

```bash
yarn dedupe
yarn requirements:verify
```

Review all changes made by `yarn dedupe` before keeping them.
Do not bypass `.yarnrc.yml` `npmMinimalAgeGate`.
If a blocked version is required to fix a bug, add a targeted exception to `npmPreapprovedPackages`.

Keep Nix pins in sync in the same PR:

- `react-native` or `expo`: `.nix/android.nix` must include `compileSdk`, `buildTools` and `ndkVersion` from `node_modules/react-native/gradle/libs.versions.toml`.
- `electron` or `.nvmrc`: `flake.nix` and `shell.nix`.
- `@playwright/test`: `playwright-web-flake` in `flake.nix`.

## Monorepo Package Management

```bash
yarn generate-package      # Create new package
yarn update-submodules     # Update trezor-common submodule (see git-and-commit-guidelines)
```

## Troubleshooting

```bash
# Reset environment if builds fail
rm -rf node_modules .yarn/cache
yarn --mode=skip-build
yarn build:essential

# Clear NX cache
yarn nx reset

# Restart development server
pkill -f "webpack-dev-server"
yarn suite:dev
```
