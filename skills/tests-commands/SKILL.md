---
name: tests-commands
description: Commands for running unit tests in the Trezor Suite monorepo. Use when you need to run tests for specific packages or the entire project.
---

# Testing

## Commands

```bash
yarn test:unit             # Run unit tests
yarn workspace @package-scope/package-name test:unit  # Test specific package
```

To run single test file:

```bash
yarn workspace @package-scope/package-name test:unit --coverage=0 file.test.ts
```
