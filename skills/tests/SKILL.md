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

All fixtures and mocks shall be typed and declaratively defined; `as unknown as T` — the form actually in the
tree — is only a last resort. This may add boilerplate, but it ensures type changes surface as type errors
instead of hard-to-fix failing tests. The double cast disables checking for every field inside, so renaming or
retyping a field leaves the fixture compiling and the test asserting on a shape production no longer produces;
the failure then surfaces as a mysterious assertion far from the fixture.

Reach for `satisfies` instead, and for a deliberately partial fixture say which part is missing with
`satisfies Omit<T, 'field'>[]` or `satisfies Pick<T, …>`.

```ts
// bad - useSubscribeForSolanaBlockUpdates.test.ts:20 - the double cast turns off checking for every field
// inside, so a renamed Account field keeps compiling here
const solanaAccount = {
    key: 'sol-account-1',
    symbol: 'sol',
    networkType: 'solana',
} as unknown as Account;

// good - the fields present stay checked, and the type says what was deliberately left out
const tokens = [{ contract, symbol: 'USDC', decimals: 6, balance: '25' }] satisfies Omit<
    TokenInfo,
    'standard'
>[];
```

Two exceptions are unavoidable: a cast on a branded primitive (`'eth-account-key' as AccountKey`, since
[`AccountKey`](../../suite-common/wallet-types/src/account.ts) is a branded template literal), and
`} satisfies T as unknown as T` for a fixture that is structurally complete but nominally incompatible.

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
