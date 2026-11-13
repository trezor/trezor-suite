---
name: typescript
description: 'Use when writing or reviewing Trezor Suite TypeScript, including native API result types. Covers suppression comments, unknown vs any, typed helpers instead of casts, const assertions and types vs interfaces.'
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

## Prefer typed helpers to casting native API results

Do not cast (`value as T`) the result of a loosely typed native API. A type assertion is barely checked: TypeScript accepts any target type comparable to the source, and any target at all when the source is `any`. The cast compiles when the claim is wrong and keeps compiling after the data changes shape. Use a typed helper instead, so the type comes from the input and is checked where it is used. Unless noted, the helpers are in `@trezor/utils`:

| Instead of                                            | Use                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `Object.keys(obj) as (keyof typeof obj)[]`            | `typedObjectKeys(obj)`                                                           |
| `Object.entries(obj) as [Key, Value][]`               | `typedObjectEntries(obj)`                                                        |
| `Object.values(obj) as Value[]`                       | `typedObjectValues(obj)`                                                         |
| `Object.fromEntries(entries) as Result`               | `typedObjectFromEntries(entries)`                                                |
| `Object.fromEntries(Object.entries(obj).map(…)) as …` | `typedObjectTransformValues(obj, transform)`                                     |
| `Object.hasOwn(obj, key)`, then a cast                | `hasOwn(obj, key)`, which narrows a union by the key                             |
| `list.includes(value as Member)` (strings)            | `isArrayMember(value, list)`, which also narrows `value`                         |
| `list.filter(Boolean) as Item[]`                      | `list.filter(isNotNullOrUndefined)`, or `isNotUndefined` / `isNotNull`           |
| `list.reduce(…, {} as Record<string, Item>)`          | `arrayToDictionary(list, getKey)`, or `list.reduce<Record<string, Item>>(…, {})` |
| `JSON.parse(text) as Data`                            | `parseJSON(text)`, which returns `unknown`, then a schema                        |
| `(await response.json()) as Data`                     | a schema; `@suite-common/http-client` endpoints take one                         |

🔴 Both casts compile, although `medium` is not a key, and `code` stays a `string`:

```tsx
const levels = Object.keys(feeLevels) as ('low' | 'medium')[];

if (PIN_CODES.includes(code as PinCode)) {
    // code is still a string here
}
```

🟢 The helpers derive the types:

```tsx
const levels = typedObjectKeys(feeLevels);

if (isArrayMember(code, PIN_CODES)) {
    // code is a PinCode here
}
```

- `typedObjectKeys`, `typedObjectEntries` and `typedObjectValues` assume the object has no keys beyond its type. Use them on objects your code builds, not on external data that may carry extra keys.
- `Object.fromEntries` returns `any` when its entries are not tuples, for example when they are built in a variable first. `typedObjectFromEntries` rejects such entries instead.
- `Boolean` also drops `0`, `''` and `false`, which `isNotNullOrUndefined` keeps. To drop another value, filter with an arrow function such as `item => item !== false`: TypeScript infers the type guard from it.
- Array methods take inline type guards as well. When the check is specific to a domain type rather than general-purpose, give the callback a type predicate instead of adding a helper or casting the result, as in `tokens.filter((token): token is TokenWithBalance => token.balance !== undefined)`. `filter` and `find` return the narrowed type. TypeScript trusts the predicate without checking it, so the condition has to prove the type.
- `{}` does not satisfy a record keyed by a union of literals, because keys are missing. Build such a record with `typedObjectFromEntries(KEYS.map(key => [key, value]))` instead of casting the seed.
- Data from outside the app, such as a server response, a `postMessage` payload or a file, takes its type from a schema (`z.infer<typeof DataSchema>`), never from a cast.
- `as const` and `satisfies` are not casts: they keep the checked type and stay fine.
- If no helper fits a general-purpose operation and the same cast keeps coming back, add a helper with a type test to `@trezor/utils`, so the cast lives in one place.

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
