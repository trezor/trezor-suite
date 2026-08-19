---
name: defensive-programming
description: Type safety practices including exhaustive checks, explicit return types, Result-based error handling, never failing with a bare null, keeping an absent value undefined instead of '' or '0', deciding per-network behaviour from network features, checksum-agnostic EVM address comparison, and non-mutating array methods. Use when writing TypeScript logic that handles multiple cases or error conditions, when a value may be missing, when branching on a coin's capabilities, when comparing addresses, or when sorting, reversing or splicing an array you did not create.
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

## Do not substitute a placeholder for a missing value

When a value is genuinely missing, pass `undefined` (or `null` where that is the domain type) and let the
consumer decide what to render. `''` and `'0'` are indistinguishable from real data, so the absence stops
being visible: an empty symbol renders as a confident blank instead of a placeholder, a `?? '0'` balance as
a confident zero, and every reader downstream has to re-guess whether the empty value meant "absent" or
"empty". The type-checker cannot help — the sentinel is a valid inhabitant of the declared type.

Where the absence makes the surrounding computation meaningless, guard on it and let the type narrow rather
than manufacturing a value that satisfies the compiler.

```tsx
// bad - useYieldFlow.ts:217 - the symbol is typed `string` (:80) and rendered by YieldWithdrawForm
// (:240), so a missing token shows an empty symbol where the UI should show a placeholder
const inputTokenSymbol = isSharesInput ? (receiptToken?.symbol ?? '') : (token?.symbol ?? '');

// good - useYieldBadge.tsx:41 - the value is meaningless without a symbol, so guard and narrow;
// `token.symbol` needs no `??` after it
if (!networkSymbol || !token?.symbol) return [];
```

A controlled form input's `value` and string concatenation are the boundary: there `''` is the real empty
state, not a stand-in for absence. Beware the sentinel that is not even reachable —
`YourPositionCard.tsx:77` writes `vaultId={yieldBadge.vaultId ?? ''}` on a value its own hook already types
as `vaultId: string`.

## Decide per-network behaviour from network `features`, not a symbol list

Whether a coin supports a capability is declared in the `networks` config as `features: NetworkFeature[]`
([types.ts:99](../../suite-common/wallet-config/src/types.ts)). Read it from there: `hasNetworkFeatures`
([accountUtils.ts:1045](../../suite-common/wallet-utils/src/accountUtils.ts)) is the default because it
honours per-`accountType` overrides, `getNetworkFeatures(symbol)` covers a symbol-level check, and
config-derived sets like `STAKING_SYMBOLS` / `isStakingSymbol`
([networksConfig.ts:810](../../suite-common/wallet-config/src/networksConfig.ts),
[stakingUtils.ts:86](../../suite-common/wallet-utils/src/stakingUtils.ts)) cover the whole-set case.

Adding a network sets its `features` once, but every hardcoded symbol comparison has to be found by hand.
Miss one and the capability silently disappears for that coin in that one view — no type error, no failing
test, just a coin that never shows up. The exhaustiveness guidance above cannot help here: a boolean chain
type-checks perfectly while being incomplete.

```tsx
// bad - useStakingTableData.ts:47 - a second list of staking coins that nothing keeps in sync with the
// network config, so a fifth staking network silently skips this view
const stakingAccounts = accounts.filter(
    account =>
        account.symbol === 'eth' ||
        account.symbol === 'sol' ||
        account.symbol === 'ada' ||
        account.symbol === 'trx',
);

// good - useStakingListData.ts:36 - the same filter in the mobile app, derived from `features`
const stakingAccounts = accounts.filter(account => isStakingSymbol(account.symbol));
```

A constant deliberately pinned to an external contract is the exception and must say so: `EVM_SPENDER_LABELS`
([evm.ts](../../suite-common/suite-constants/src/evm.ts)) is a flattened copy of the firmware's
`KNOWN_ADDRESSES` precisely so the approve flow cannot drift out of clear-signing.

## Prefer the non-mutating array methods to copy-then-mutate

`[...items].sort()` and `items.slice().sort()` are workarounds for `sort` mutating in place, and they only work if you remember the copy. `toSorted`, `toReversed`, `toSpliced` and [`with`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/with) return a new array, so forgetting is not an option — and forgetting matters here, because the arrays in play are usually a selector result or Redux state that something else is still holding. Nothing will catch it either: `immutableCheck` is `false` in both stores ([suite](../../packages/suite/src/reducers/store.ts), [native](../../suite-native/state/src/store.ts)), so a mutated slice surfaces later as a stale render or a wrong total, far from the `.sort()` that caused it.

```ts
// bad - two steps to say "sorted copy", and `.sort()` mutates whatever it is handed
const sorted = [...accounts].sort(byBalance);

// good - one call, nothing to forget
const sorted = accounts.toSorted(byBalance);
```

## Compare EVM addresses with `areEvmAddressesEqual`

EVM addresses reach Suite in mixed EIP-55 casing, so every equality check has to be checksum-agnostic. Use
[`areEvmAddressesEqual`](../../suite-common/address/src/evmChecksumUtils.ts) from `@suite-common/address`
rather than lowercasing at the call site; it handles both sides plus missing and invalid input, so there is
nothing left to remember. Where a value is stored or passed on, normalize once at the parse boundary instead
(`address.ts:39`) and two already-normalized values may then compare with `===`.

A `.toLowerCase()` missing on one side compiles, type-checks and silently answers "not ours". Nothing fails
loudly — the wrong boolean just propagates.

```ts
// bad - transactionUtils.ts:76 - drop either `.toLowerCase()` and this mis-attributes the signer of any
// mixed-case address, which then feeds EVM nonce arithmetic
vin.addresses?.some(address => address.toLowerCase() === descriptor.toLowerCase());

// good - checksum-agnostic and null-safe in one call, and the name carries the intent that the
// surrounding comment currently has to explain
vin.addresses?.some(address => areEvmAddressesEqual(address, descriptor));
```

Two boundaries: the helper is EVM-only — it returns `false` for bech32 and base58 addresses — and it pulls
viem in, so a consumer reachable from `build-connect` may keep a hand-rolled comparison with a comment
saying why ([wrappedNativeToken.ts:43](../../networks/ethereum/network-ethereum/src/constants/wrappedNativeToken.ts)).

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

## Never fail with a bare `null`

The rule above is about _how_ to pass an expected failure, not about staying silent. A bare `null` return is
neither a `Result` nor a `throw`: it collapses every distinct precondition into one indistinguishable value,
and the caller is left able to render only "something went wrong". Its harness twin is logging "skipping"
and returning.

So pick one deliberately. A typed `Result` or discriminated variant for a failure the caller branches on;
a `throw` naming the missing field for an invariant the caller cannot act on. On the signing path the
message string is the entire diagnostic that survives, because `createThunk` serializes a thrown error down
to `{ name, message, stack }` before it reaches the slice, the toast and Sentry.

```ts
// bad - the pre-fix shape from #27718 - one `null` for a missing fee and for an unparsable payload, so
// the reason has to be re-derived by bisecting the helper by hand
const getTransactionWithSelectedFee = (
    parsedTransaction: StablecoinYieldParsedTransactionForSigning,
    selectedFee?: EvmSelectedFee | null,
): StablecoinYieldParsedTransactionForSigning | null => {
    const parsedSelectedFee = parseEvmFeeHex(selectedFee);

    if (!parsedSelectedFee) return null;

    return { ...parsedTransaction, ...flattenEvmFees(parsedSelectedFee) };
};

// good - stablecoinYieldSigningUtils.ts:64 - the message names the missing field, and the return type
// loses its `| null` along with it (:56)
if (!parsedSelectedFee) {
    throw new Error('Fee information is missing for the transaction.');
}
```

Name the missing field (`fee`, `gasLimit`), never its value — these strings reach Sentry and user-facing
toasts, and an amount, address or label in one is confidential data leaving the device.
