---
name: defensive-programming
description: Type safety practices including exhaustive checks, explicit return types, Result-based error handling, and non-mutating array methods. Use when writing TypeScript logic that handles multiple cases or error conditions, or when sorting, reversing, splicing, or replacing an element (indexed assignment) in an array you did not create.
---

# Defensive Programming

## Do not fall back to default

Whenever possible, cover all cases. If a new case is added in the future, TypeScript should force the developer to set behavior for it.

### Force explicit return types

Makes sure all cases are covered in a function.

```ts
// TS Error: Function lacks ending return statement and return type does not include 'undefined'
export const isEnabled = (status: 'a' | 'b' | 'c'): boolean => {
    if (status === 'a') {
        return true;
    }

    if (status === 'b') {
        return false;
    }
};
```

### Use `exhaustive` switch

Makes sure all cases are covered in a switch statement.

```ts
// TS Error: Argument of type '"c"' is not assignable to parameter of type 'never'
export const isEnabled = (status: 'a' | 'b' | 'c') => {
    switch (status) {
        case 'a':
            return true;
        case 'b':
            return false;
        default:
            return exhaustive(status);
    }
};
```

### Use type-mapping technique

Alternative to an exhaustive switch statement.

```ts
type Schema = {
    a: number;
    b: number;
};

// TS Error: Property 'b' is missing in type '{ a: () => string; }' but required in type '{ a: () => void; b: () => void; }'.
const result: { [K in keyof Schema]: () => void } = {
    a: () => console.log('This is A'),
};
```

## Prefer the non-mutating array methods to copy-then-mutate

`[...items].sort()` and `items.slice().sort()` are workarounds for `sort` mutating in place, and they only work if you remember the copy. `toSorted`, `toReversed`, `toSpliced` and [`with`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/with) return a new array, so forgetting is not an option — and forgetting matters here, because the arrays in play are usually a selector result or Redux state that something else is still holding. Nothing will catch it either: `immutableCheck` is `false` in both stores ([suite](../../packages/suite/src/reducers/store.ts), [native](../../suite-native/state/src/store.ts)), so a mutated slice surfaces later as a stale render or a wrong total, far from the `.sort()` that caused it.

```ts
// bad - two steps to say "sorted copy", and `.sort()` mutates whatever it is handed
const sorted = [...accounts].sort(byBalance);

// good - one call, nothing to forget
const sorted = accounts.toSorted(byBalance);
```

## Do not use exceptions

Unless failures are unpredictable, pass errors via `return` and do not `throw`. Throwing exceptions is not type-safe. There is a `Result` type that shall be used.

Bad:

```ts
try {
    const result = await action();
} catch (error) {
    // Possible errors cannot be typed
    // ...
}
```

Good:

```ts
const result = await action();

if (result.error) {
    const { type } = result.error;

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
