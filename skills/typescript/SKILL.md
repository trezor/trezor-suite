---
name: typescript
description: TypeScript-specific conventions including ts-expect-error usage, unknown vs any, what to reach for instead of an `as` cast, narrowing an account to one network type, const assertions, and type vs interface preferences. Use when writing TypeScript code, when you are about to write `as`, or when a function takes an Account but only works for one network.
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

## Replace an `as` cast with `satisfies`, a guard, a parse, or a better type

An `as` cast is an unchecked claim, so it is the wrong tool at exactly the places it is most tempting. It
silences the compiler where the shape is decided, so a later field rename — or a value that was never a
`NetworkSymbol` — keeps compiling and fails at runtime, far from the cast that caused it. Each case has a
tool that keeps the code compiling only while it is still true:

- **Constructing a value** — `satisfies`. It checks the shape without erasing what the compiler knows.
- **Narrowing a string you did not construct** — the
  [`isNetworkSymbol`](../../suite-common/wallet-config/src/utils.ts) guard where there is a fallback to fall
  back to, or the sanctioned [`asNetworkSymbol`](../../suite-common/wallet-config/src/types.ts) wrapper at a
  parse boundary where the string comes from outside and there is no alternative.
- **An object payload from outside the type system** — parse it. `safeParse` on a schema in
  `@suite-common/schemas`, the way [`parseEvmFeeHex`](../../suite-common/schemas/src/evm/fees/index.ts) does;
  HTTP responses already get this from `createHttpClient`'s per-endpoint `schema`.
- **None of the above fits** — the type is wrong. Change it instead of casting around it.

```ts
// bad - useEthereumCancelTxCompose.ts:105 - the cast is the only reason this literal type-checks, so a
// renamed field on PrecomposedTransactionFinalCancelRbf keeps compiling here
return {
    composedCancelTx: {
        ...normalLevel,
        rbfType: 'cancel',
        prevTxid: tx.txid,
    } as PrecomposedTransactionFinalCancelRbf,
    cancelFormState: formState,
};

// good - `satisfies` checks the same shape without erasing it; if it stops compiling, the type is wrong
// and that is the thing to fix rather than assert past
const composedCancelTx = {
    ...normalLevel,
    rbfType: 'cancel',
    prevTxid: tx.txid,
} satisfies PrecomposedTransactionFinalCancelRbf;
```

## Take `AccountWithNetworkType<T>`, not `Account`

When code only makes sense for one network type, type its input as `AccountWithNetworkType<'tron'>`
([account.ts:111](../../suite-common/wallet-types/src/account.ts)) instead of `Account` or a hand-rolled
`Account & { networkType: 'tron' }`. Do the "is this the right account?" check once at the boundary that
produces the account, so nothing downstream needs a guard for a case that cannot happen.

Passing the wide `Account` pushes that check into every consumer, and the fallbacks it forces are what hide
the bug: `getTronResources` returns `undefined` for every non-tron account, so an all-zero card is
indistinguishable from a real one.

```tsx
// bad - TronResourcesCard.tsx:18 - any Account gets in, so the card re-derives the network check (:26)
// and every read needs a `?? 0` that renders an all-zero card for a non-tron account
interface TronResourcesCardProps {
    account: Account;
}

const resources = getTronResources(account);
const energyAvailable = resources?.availableEnergy ?? 0;

// good - the network check happens once upstream, so the redundant call and its chain are gone
type TronResourcesCardProps = {
    account: AccountWithNetworkType<'tron'>;
};

const energyAvailable = account.misc.tronResources?.availableEnergy ?? 0;
```

The narrower type earns its keep by deleting impossible branches rather than handling them defensively — see
[Defensive programming](../defensive-programming/SKILL.md). On the ethereum variant it also makes
`misc.nonce: string` non-optional outright.

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
