---
name: tests-native
description: TDD practices and test utilities for suite-native packages, including @suite-native/test-utils usage and translation ID conventions. Use when writing tests for suite-native packages.
---

# Writing Native Tests (TDD)

This skill enforces Test-Driven Development (TDD) practices for suite-native packages and ensures proper usage of the
`@suite-native/test-utils` package.

## Core Principles

### 1. Test-First Development

- **ALWAYS** write tests before implementing features in suite-native packages.
- Follow the Red-Green-Refactor cycle:
    1. **Red**: Write a failing test that describes the desired behavior. Run test to confirm it fails for the right
       reason (e.g., "Cannot find element" or "Expected value to be X but got Y").
    2. **Green**: Write the minimum code to make the test pass. Run test to confirm it passes.
    3. **Refactor**: Clean up the code while keeping tests green. Run test to confirm it still passes after refactoring.

### 2. Writing tests

- Focus on testing behavior and user interactions, not implementation details.
- Use translation IDs instead of literal text to avoid breaking tests with Crowdin updates.
- Follow arrange-act-assert pattern for test structure.

### 3. Use @suite-native/test-utils Package

- **REQUIRED**: Use `@suite-native/test-utils` for all suite-native testing.
- **NEVER** import directly from `@testing-library/react-native`.
- The test-utils package provides all necessary utilities and proper test setup.

## Checklist

Before submitting code, ensure:

- [ ] Tests were written BEFORE implementation
- [ ] Using `@suite-native/test-utils` (not direct `@testing-library/react-native`)
- [ ] Correct render function used (renderWithStoreProvider, renderWithProviders, render)
- [ ] Translation IDs used instead of literal strings
- [ ] Fixtures are properly typed
- [ ] Tests focus on behavior, not implementation
- [ ] All interactions use `userEvent`
- [ ] All tests pass locally
