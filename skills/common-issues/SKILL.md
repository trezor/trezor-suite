---
name: common-issues
description: Known issues and their solutions in the Trezor Suite monorepo. Use when encountering build failures, test failures, or environment problems.
---

# Common Issues

- **Playwright failures**: Use `yarn --mode=skip-build` during installation
- **Network timeouts**: Retry commands; common in restricted environments
- **Build failures**: Run `yarn build:libs` after dependency changes
- **Type errors**: Allow sufficient time for `yarn type-check` (10-15 minutes)
