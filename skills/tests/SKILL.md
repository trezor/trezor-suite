---
name: tests
description: Test style guidelines including what a test should cover, naming conventions, mock organization, dispatch and thunk testing, translation handling, and file structure. Use when writing or organizing tests in the Trezor Suite codebase.
---

# Tests

## Reading

- Avoid testing implementation details: https://kentcdodds.com/blog/testing-implementation-details

## What a test covers

A unit test covers the domain: the rules a user or a caller relies on, and the edge cases where those
rules could break, such as an empty or zero balance, a missing rate, a reached limit, an account of
another network or unexpected input. Start from those cases, not from the code's branches.

Do not write tests that only restate the code:

- One test per branch of a `switch` or a mapping, each asserting the literal the code returns.
- That a prop or an option is passed through, or that a component renders exactly what it was given.
- That a mock was called with what the test itself set up.
- A re-check of a constant or of what the type system already guarantees.

Before adding a test, ask whether it would fail for a bug a user could hit. If it would only fail
when the code is rewritten, leave it out. A few tests of real cases are worth more than many
mechanical ones.

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

Tests MUST use `createMockDeps` and `mock` from `@trezor/dependency-injection` wherever
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

## Dispatch in tests

Every `dispatch` in a test comes from `createMockDispatch` or from a store built by the platform
test utilities. Pick by what the test asserts:

| The test asserts                                     | `dispatch` comes from                                                                                                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| which actions were dispatched, which services called | `createMockDispatch` from `@trezor/redux-utils/mocks`                                                                                                                                                        |
| the state or UI after reducers and middleware ran    | `createTestCompositionRoot` ([guide](../../docs/tests/suite-common-test-utils.md#integration-test-with-createtestcompositionroot)); in native, `createLightStore` ([Native tests](../tests-native/SKILL.md)) |

`createMockDispatch({ getState, extra })` returns `{ actions, dispatch, onDispatch }`. `dispatch`
pushes every plain action to `actions` and runs every dispatched thunk, nested ones included, with
the same `dispatch`, `getState` and `extra`.

### A thunk

Redux calls a thunk with `dispatch`, `getState` and `extra`; the unit test passes those three
itself. Build `getState` and `extra` from the thunk's exported contracts and keep the fixture local
to the test:

```ts
const state: XyzThunkState = {
    // Only the state required by xyzThunk.
};
const extra: XyzThunkDeps = {
    services: {
        // Only the services required by xyzThunk.
    },
};
const getState = () => state;
const { actions, dispatch } = createMockDispatch({ getState, extra });

await xyzThunk()(dispatch, getState, extra);

expect(extra.services.someService).toHaveBeenCalled();
expect(actions).toEqual([
    expect.objectContaining({ type: xyzThunk.pending.type }),
    expect.objectContaining({ type: xyzThunk.fulfilled.type }),
]);
```

### A hook or component that dispatches

Render it with the platform store provider, and swap the store's `dispatch` for the mock one so the
test can assert on `actions`:

```ts
const store = createStoreFromPreloadedState(preloadedState);
const { actions, dispatch } = createMockDispatch({ getState: store.getState, extra: undefined });

const { result } = await renderHookWithStoreProvider(() => useXyz(), {
    services: { store: { ...store, dispatch } },
});

await act(() => result.current.submit());

expect(actions).toContainEqual(xyzActions.submitted());
```

A thunk the test replaces with `jest.mock` still goes through this `dispatch`: the mock thunk is
called with the same three arguments.

### Waiting for a dispatched action

Production code often ignores what `dispatch` returns, so awaiting the trigger does not wait for the
thunk. Subscribe with `onDispatch` before triggering, call `resolve` on the action the test waits
for, and await the subscription:

```ts
const finished = onDispatch((action, resolve) => {
    if (action.type === xyzThunk.fulfilled.type) resolve();
});

triggerTheCodeUnderTest();

await finished;
```

A subscription that is neither awaited nor unsubscribed fails the test.
