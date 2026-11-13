---
name: tests-commands
description: 'Use when choosing commands to run Trezor Suite unit tests for a file, package or the whole project.'
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
