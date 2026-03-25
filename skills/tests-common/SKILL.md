---
name: tests-common
description: TDD practices and test utilities for suite-common packages, including Red-Green-Refactor workflow and @suite-common/test-utils usage. Use when writing tests for suite-common packages.
---

# Writing Common Tests (TDD)

This skill enforces Test-Driven Development (TDD) practices for suite-common packages and ensures proper usage of the
`@suite-common/test-utils` package.

## Core Principles

### 1. Test-First Development

- **ALWAYS** write tests before implementing features in suite-common packages.
- Follow the Red-Green-Refactor cycle:
    1. **Red**: Write a failing test that describes the desired behavior. Run test to confirm it fails for the right
       reason (e.g., "Expected value to be X but got Y").
    2. **Green**: Write the minimum code to make the test pass. Run test to confirm it passes.
    3. **Refactor**: Clean up the code while keeping tests green. Run test to confirm it still passes after refactoring.

### 2. Writing tests

- Focus on testing behavior and user interactions, not implementation details.
- Follow arrange-act-assert pattern for test structure.

### 3. Use @suite-common/test-utils Package

- **REQUIRED**: Use `@suite-common/test-utils` for all suite-common testing that involves React hooks.
- **NEVER** import directly from `@testing-library/react` when testing hooks.
- The test-utils package provides all necessary utilities including `renderHookWithStoreProvider`.

## Checklist

Before submitting code, ensure:

- [ ] Tests were written BEFORE implementation
- [ ] Using `@suite-common/test-utils` for hook tests (not direct `@testing-library/react`)
- [ ] Correct render function used (`renderHookWithStoreProvider` for hooks needing store, `renderHook` otherwise)
- [ ] Fixtures are properly typed
- [ ] Tests focus on behavior, not implementation
- [ ] Tests follow naming conventions (.hook.test.ts, .test.ts)
- [ ] All tests pass locally
