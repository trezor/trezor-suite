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

- Tests MUST be placed directly next to the file they are testing (co-located tests).
- `tests` and `__tests__` directories are NOT allowed for test files.
- The goal is fast navigation and clear coverage visibility: when you open a source file,
  you should immediately see whether it has a nearby test.
- Use `.test.ts` / `.test.tsx` suffix for test files.
- When testing types, suffix should be `.type-test.ts`, to prevent from being executed by jest.
  (For example: `typedObjectFromEntries.type-test.ts`)
- Fixtures are placed in `mocks` folders and have `mock` prefix.
- `mocks` folder is placed in the root of the package, not in `src`.

### Example:

```
my-module/
├── mocks/
│   └── mockMyComponent.ts
└── src/
    ├── MyComponent.tsx
    ├── MyComponent.test.tsx
    ├── useMyData.ts
    ├── useMyData.test.ts
    ├── utils.ts
    └── utils.test.ts
```

### Reusability

To keep things simple, avoid creating complex mocks to be shared between multiple test suites. In case you do reuse a
mock, keep it generic and non-opinionated.

Simple test: change in shared mock SHALL NOT break existing tests (or make fixes trivial).

## Type tests

Keep type-test assertions module-local. Do not export test-only values or types, because exports
pollute the generated declaration files. Use `void` statements to mark assertion values as used:

```ts
const valid: ExpectedType = value;

// @ts-expect-error The value must not accept an incompatible type.
const invalid: ExpectedType = incompatibleValue;

void valid;
void invalid;
```

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

## Dependencies in tests

### Always use declared dependency types

Test dependency objects (`deps`, thunk `extra`, provider `services`, etc.) MUST use the subject's
declared, named dependency type. Reuse its exported type; export it if needed instead of redefining
it in the test.

When assigning an object literal, annotate the variable explicitly: `const deps: SubjectDeps = { ... }`,
`const extra: SubjectExtra = { ... }` or `const services: SubjectServices = { ... }`.

```ts
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(mock()),
};
```

With `createMockDeps<SubjectDeps>`, the generic argument supplies the dependency type; do not repeat
it as a variable annotation.

### Use DI mock helpers whenever possible

Tests MUST use `createMockDeps` and `mock` from `@suite-common/dependency-injection` wherever
applicable. Use bare `jest.fn` only when these helpers cannot represent the required mock.

- `createMockDeps<TDeps>(deps)` recursively mocks dependency functions. Supply every required key;
  use `null` for functions that must throw if called. Assert directly on the returned mocks.
- `mock<TFn>(implementation?)` types a function mock from its service signature.
- `mockNotExpected<TFn>(key)` creates a function mock that throws when called.

```ts
const deps = createMockDeps<WriteAccountLabelDeps>({
    analytics: { report: null },
    getAccountLabel: () => null,
});
```

Shared service mock factories in the package's `mocks` directory MUST also use `mock`, using the
service contract as the type argument:

```ts
export const mockGetHttpReceiverAddress = (address = 'http://localhost:21325') =>
    mock<DesktopApi['getHttpReceiverAddress']>(() => Promise.resolve(address));
```
