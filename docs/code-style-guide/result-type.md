# Result Type

## Do not use exceptions

Always prefer passing errors via `return` and do not `throw`. Throwing exceptions is not TypeSafe

There is a `Result` type that shall be used.

Good:

```ts
const result = await action();

if (result.error) {
    const {type} = result.error;

    switch (type) {
        case 'ErrorA':
        // ... do stuff
        case 'ErrorB':
        // ... do different stuff

        default:
            return exhaustive(type);
    }
}
```

Bad:

```ts
try {
    const result = await action();
} catch (error) { // Possible errors cannot be typed
    // ...
}
```
