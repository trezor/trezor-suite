# Tests

## Reading

- Avoid testing implementation details - https://kentcdodds.com/blog/testing-implementation-details

## Translations in tests

Copy in the app may change as translators and copywriters update the strings in Crowdin, independently from developers. To avoid failing tests in Crowdin sync PRs, get a string by its translation ID instead of using the literal text.

```ts
// bad
expect(screen.getByText(
	'This can change with a Crowdin sync and someone will have to fix the test.'
).toBeTruthy();

// good
expect(screen.getByText(getTranslation(
	'path.to.translation'
))).toBeTruthy();

// In case there is some string that must not be changed:
expect(screen.getByText(getTranslation(
	'path.to.translation'
))).toBe(
	'I want a developer to check this important text if it is changed in Crowdin.'
);
```

## Fixtures in tests shall be typed

Although it may produce some boilerplate code, the fixtures shall be declaratively typed. In case the type is changed, without typed fixtures, this will produce a hardly fixable failed test instead of easily fixable type-error.
