# Tests

## Reading

- Avoid testing implementation details - https://kentcdodds.com/blog/testing-implementation-details

## Translations in tests

Copy in the app may change as translators and copywriters update the strings in Crowdin, independently of developers. To
avoid failing tests in Crowdin sync PRs, get a string by its translation ID instead of using the literal text.

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

## Fixtures in tests shall be typed

Although it may produce some boilerplate code, the fixtures shall be declaratively typed. In case the type is changed,
without typed fixtures, this will produce a hardly fixable failed test instead of easily fixable type-error.

## Naming conventions

- Tests are placed in `__tests__` folders and have `.test.ts` extension.
- When testing components suffix should be `.comp.test.tsx`.
- When testing hooks suffix should be `.hook.test.ts`.
- Fixtures are placed in `__fixtures__` folders and have `.fixture.ts` or `.mock.ts` extension.

### Example:

```
my-module/src/
├── __fixtures__/
│   └── myState.fixture.ts
├── __tests__/
│   ├── MyComponent.comp.test.tsx
│   ├── useMyData.hook.test.ts
│   └── utils.test.ts
├── MyComponent.tsx
├── useMyData.ts
└── utils.ts
```
