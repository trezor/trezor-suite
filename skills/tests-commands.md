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

### Describe

If you test function, use `function.name` to reference it, to make renaming easier.
Make sure you are not using it for anonymous functions.

```ts
describe(calculateCircle.name, () => {}
```
