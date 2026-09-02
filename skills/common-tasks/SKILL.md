---
name: common-tasks
description: Dependency management, package creation, and troubleshooting commands for the Trezor Suite monorepo. Use when managing dependencies or debugging build issues.
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

## Monorepo Package Management

```bash
yarn generate-package      # Create new package
yarn update-submodules     # Update trezor-common submodule
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
