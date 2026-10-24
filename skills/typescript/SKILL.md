---
name: typescript
description: TypeScript-specific conventions including ts-expect-error usage, unknown vs any, typed object helpers instead of native Object.* calls, const assertions, and type vs interface preferences. Use when writing TypeScript code.
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

## Prefer typed helpers to casting native APIs

When a native API's TypeScript signature loses type information, use the typed wrapper from
`@trezor/utils` instead of casting the result. A cast only checks that the two types overlap, so it
usually keeps compiling after the data changes shape. Before writing `as` on the result of a
built-in call, check `@trezor/utils` and `@trezor/type-utils` for a wrapper. If the same cast keeps
coming back and no wrapper exists, add one there instead of repeating the cast.

| Native               | Native result type              | Helper                   |
| -------------------- | ------------------------------- | ------------------------ |
| `Object.keys`        | `string[]`                      | `typedObjectKeys`        |
| `Object.entries`     | `[string, T][]`                 | `typedObjectEntries`     |
| `Object.values`      | `T[]` (`any[]` for some inputs) | `typedObjectValues`      |
| `Object.fromEntries` | `{ [k: string]: T }` or `any`   | `typedObjectFromEntries` |
| `Object.hasOwn`      | `boolean` (no narrowing)        | `hasOwn`                 |

`typedObjectKeys`, `typedObjectEntries` and `typedObjectValues` assume the object has no keys
beyond its type. Use them on objects whose keys you control, not on parsed external data.

`Object.fromEntries` returns `any` when its entries do not resolve to tuples. Entries passed inline
are usually contextually typed as tuples, so `Object.fromEntries(items.map(item => [item.id, item]))`
is already checked. Entries built in a variable or an earlier `.then()` are not. Neither are
callbacks whose branches return different value types, such as
`tx.type === 'error' ? [key, tx] : [key, { ...tx, extra }]`:

🔴 Entries stored before the call infer as `string[][]`, so the result is `any`:

```tsx
const entries = addresses.map(({ address, path }) => [address, path]);
const paths: AddressPaths = Object.fromEntries(entries);
```

🟢 Pass the entries inline, type them as tuples, or use the helper:

```tsx
const paths: AddressPaths = Object.fromEntries(
    addresses.map(({ address, path }) => [address, path]),
);
const entries = addresses.map(({ address, path }) => [address, path] as const);
const pathsFromTuples: AddressPaths = Object.fromEntries(entries);
```

ESLint enforces this: `no-restricted-syntax` rejects casts of `Object.keys/entries/values/fromEntries`,
and `local-rules/no-any-object-from-entries` (type-aware, `ESLINT_RUN_EXPENSIVE_CHECKS=true`) rejects
`Object.fromEntries` calls that return `any`. Packages that cannot depend on `@trezor/utils` use
tuple entries.

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
