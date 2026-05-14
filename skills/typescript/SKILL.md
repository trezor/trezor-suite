---
name: typescript
description: TypeScript-specific conventions including ts-expect-error usage, unknown vs any, const assertions, and type vs interface preferences. Use when writing TypeScript code.
---

# TypeScript

## Prefer `@ts-expect-error` to `@ts-ignore`

TypeScript allows you to suppress all errors on a line by placing a single-line comment or a comment block line starting with `@ts-ignore` immediately before the erroring line. While powerful, there is no way to know if a `@ts-ignore` is actually suppressing an error without manually investigating what happens when the `@ts-ignore` is removed.

This means it's easy for `@ts-ignore`s to be forgotten about and remain in code even after the error they were suppressing is fixed. This is dangerous, as if a new error arises on that line, it'll be suppressed by the forgotten about `@ts-ignore`, and so be missed.

To address this, TS3.9 ships with a new single-line comment directive: `// @ts-expect-error`.

This directive operates in the same manner as `@ts-ignore`, but will error if the line it's meant to be suppressing doesn't actually contain an error, making it a lot safer.

> 💡 Sometimes in very rare cases you may still need `@ts-ignore`. In that case you need to disable ESLint for that line first; otherwise, ESLint will automatically change it to `@ts-expect-error`.

## Prefer `unknown` to `any`

Use `unknown` for situations where a function _doesn't know_ the incoming type and not when it _doesn't care_ about the type. With better type safety, `unknown` can help us catch possible errors early on.

🟢 Type guard using `unknown`:

```tsx
const validateKey = (key: unknown): key is DictionaryKey => {
    if (['string', 'number'].includes(typeof key)) {
        return true;
    }

    return false;
};
```

If the above type guard marked `key` as `any`, calling `key()` would not throw.

## Prefer direct type assignment to indirect

Prefer directly importing types used in a file rather than accessing them indirectly.

🔴 Indirect assignment:

```tsx
const doSomething = (networkSymbol: Account['symbol']) => {};
```

🟢 Direct assignment:

```tsx
import { NetworkSymbol } from '@suite-common/wallet-config';

const doSomething = (networkSymbol: NetworkSymbol) => {};
```

Direct assignment may add an import, but it prevents the need to refactor if the `NetworkSymbol` detaches from `Account`, is easier to read and makes it easier to navigate to the `NetworkSymbol` type definition in the editor.

## Consider using const assertion on objects instead of TS enums

See https://www.youtube.com/watch?v=0fTdCSH_QEU. TypeScript enums are not native to JavaScript and sometimes behave unpredictably. The desired functionality can be achieved using plain objects. Follow the same naming conventions as you would with enums. Despite the object and the type having the same name, TypeScript is able to tell them apart.

```tsx
// definition
const AuthMethod = {
    Push: 'Push',
    Sms: 'SMS',
} as const;

type AuthMethod = (typeof AuthMethod)[keyof typeof AuthMethod];

// usage
function doThing(authMethod: AuthMethod): void {
    console.log(authMethod);
}
doThing(AuthMethod.Sms);
doThing('SMS');
```

## Prefer types to interfaces

Just to be consistent. Interfaces offer advanced functionality we don't really use. Related video: https://www.youtube.com/watch?v=zM9UPcIyyhQ
