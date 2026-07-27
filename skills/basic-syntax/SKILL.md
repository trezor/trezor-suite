---
name: basic-syntax
description: If-else formatting, spacing, function parameters, and conditional rendering rules for the Trezor Suite codebase. Use when writing or reviewing TypeScript/React code.
---

# Basic Syntax

## If - else

```tsx
// bad - we don't like inline-if with else branch, harder to read
if (condition) doSomething();
else doSomethingElse();

// good
if (condition) {
    doSomething();
} else {
    doSomethingElse();
}

// also good - inline if without else is fine
if (condition) doSomething();
```

## Spacing

Try to use empty lines as a tool for structuring the code even better.

🔴 Hard to read function without spaces:

```tsx
export const getPrerequisites = ({ router, device, transport }: PrerequisitesInput) => {
    const excluded = getExcludedPrerequisites(router);
    const prerequisite = getPrerequisiteName({ router, device, transport });
    if (typeof prerequisite === 'undefined') return;
    if (excluded.includes(prerequisite)) return;
    return prerequisite;
};
```

🟢 Well-arranged code:

```tsx
export const getPrerequisites = ({ router, device, transport }: PrerequisitesInput) => {
    const excluded = getExcludedPrerequisites(router);
    const prerequisite = getPrerequisiteName({ router, device, transport });

    if (typeof prerequisite === 'undefined') {
        return;
    }

    if (excluded.includes(prerequisite)) {
        return;
    }

    return prerequisite;
};
```

As you can see, there is no line between `excluded` and `prerequisite` – that's because in this context that separation adds little benefit, instead the constants become the group. Base the groups not only on type of code _(method call, if-block, declaration)_ but on what that code does.

## Function parameters

Functions accepting multiple parameters tend to be less readable and more error-prone. This can be solved by wrapping the params (all of them, or just some, i.e. "config" params) in an object, thus effectively naming the parameters. A rule of thumb is to use wrapping for functions with more than two params, but it depends on the specific case.

🔴 Confusing function call with many arguments:

```tsx
const logAnimalNames = (cat: string, dog: string, guineaPig?: string, showHeading?: boolean) => {
    if (showHeading) {
        console.log('My Animals');
    }
    console.log(cat);
    console.log(dog);
    if (guineaPig) {
        console.log(guineaPig);
    }
};

logAnimalNames('Nancy', 'Rob', null, true);
```

What is the correct order? Why do I have to specify `null` for an optional param? What does `true` mean here?

🟢 Tidy function call with wrapped arguments:

```tsx
interface LogAnimalParams {
    cat: string;
    dog: string;
    guineaPig?: string;
    showHeading?: boolean;
}

const logAnimalNames = ({ cat, dog, guineaPig, showHeading }: LogAnimalParams) => {
    if (showHeading) {
        console.log('My Animals');
    }
    console.log(cat);
    console.log(dog);
    if (guineaPig) {
        console.log(guineaPig);
    }
};

logAnimalNames({ cat: 'Nancy', dog: 'Rob', showHeading: true });
```

## Conditional rendering

Make sure that a condition in JSX can only be `true`/`false` . If it could
be `0` or `""` , `-42` , `[]` etc. React can render some of those values. In React Native it can also cause text outside Text component!

🔴 Do not use random value as condition

```tsx
// BAD
{
    value && <Component value={value} />;
}
```

🟢 Prefer

```tsx
// typeof hasValue === 'boolean'
{
    hasValue && <Component value={value} />;
}
```

```tsx
{
    !!value && <Component value={value} />;
}
```

```tsx
if (!value) return null;

return <Component value={value} />;
```
