---
name: tests
description: Test style guidelines including naming conventions, mock organization, translation handling, and file structure. Use when writing or organizing tests in the Trezor Suite codebase.
---

# Tests

## Reading

- Avoid testing implementation details: https://kentcdodds.com/blog/testing-implementation-details

## Translations in tests

Text in the app may change as translators and copywriters update strings in Crowdin, independently of developers. To
avoid failing tests in Crowdin sync PRs, get the string by its translation ID instead of using the literal text.

```ts
// bad
expect(
    screen.getByText('This can change with a Crowdin sync and someone will have to fix the test.'),
).toBeTruthy();

// good
expect(screen.getByText(getTranslation('path.to.translation'))).toBeTruthy();

// In case there is some string that must not be changed:
expect(screen.getByText(getTranslation('path.to.translation'))).toBe(
    'I want a developer to check this important text if it is changed in Crowdin.',
);
```

## Naming conventions

- Tests are placed in `__tests__` folders and have `.test.ts` extension.
- Test folder is placed in the same directory as an actual implementation.
- When testing types, suffix should be `.type-test.ts`, to prevent from being executed by jest. (For example: `packages/utils/tests/typedObjectFromEntries.type-test.ts`)
- Fixtures are placed in `mocks` folders and have `mock` prefix.
- `mocks` folder is placed in the root of the package, not in `src`.

### Example:

```
my-module/
├── mocks/
│   └── mockMyComponent.ts
└── src/
    ├── __tests__/
    │   └── utils.test.ts
    └── utils.ts
```

### Reusability

To keep things simple, avoid creating complex mocks to be shared between multiple test suites. In case you do reuse a
mock, keep it generic and non-opinionated.

Simple test: change in shared mock SHALL NOT break existing tests (or make fixes trivial).

## Mocks (& Fixtures)

### Typing

All fixtures and mocks shall be typed and declaratively defined; using `as` to cast an incomplete object is only a last
resort. This may add boilerplate, but it ensures type changes surface as type errors instead of hard-to-fix failing
tests.

### Organization & Naming Convention

- Mock/fixture files shall be placed in the same package where the subject being mocked resides.
- Putting them in a types package is OK. A mock for `Device` shall be in the same package where the _type declaration_
  is located.
- Use `mock` prefix to distinguish it from type or original implementation. `Device` => `mockDevice`.
- Prefer factories to static objects. A factory is better because it can provide an API to create a mock with desired
  changes. (`mockDevice(data: Partial<Device>): Device => ({ ... })`)
- Put mocks into a `mocks` directory within the same package.
- Export them from the package via a separate file. In this example:
  `import { mockDevice } from '@common/device-types/mocks'`
    ```
    device-types
      - mocks
         - mockDevice.ts
         - index.ts // If you need to export them in `package.json`
      - src
         - device.ts
    ```
- Name the file the same as the exported mock.
