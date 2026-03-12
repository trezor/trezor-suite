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
- The test-utils package has two entry points:
    - `@suite-native/test-utils` — basic providers, render helpers (`renderWithBasicProvider`,
      `renderHookWithBasicProvider`), and re-exports from `@testing-library/react-native`.
    - `@suite-native/test-utils/store` — store-related utilities (`initStore`, `renderWithStoreProvider`,
      `renderHookWithStoreProvider`, `PreloadedState`, `TestStore`). Only import from here when the
      test actually needs a Redux store; this avoids loading `@suite-native/state` in tests that don't
      need it.

## Checklist

Before submitting code, ensure:

- [ ] Tests were written BEFORE implementation
- [ ] Using `@suite-native/test-utils` or `@suite-native/test-utils/store` (not direct `@testing-library/react-native`)
- [ ] Correct render function used (renderWithStoreProvider, renderWithBasicProvider, render)
- [ ] Translation IDs used instead of literal strings
- [ ] Fixtures are properly typed
- [ ] Tests focus on behavior, not implementation
- [ ] All interactions use `userEvent`
- [ ] All tests pass locally
