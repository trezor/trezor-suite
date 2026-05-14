---
name: common-tasks
description: Dependency management, package creation, and troubleshooting commands for the Trezor Suite monorepo. Use when managing dependencies or debugging build issues.
---

# Common Tasks

## Managing Dependencies

```bash
yarn workspace @trezor/package-name add dependency-name
yarn build:libs  # Rebuild after dependency changes
```

## Package Management

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
