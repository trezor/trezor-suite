# `createPendingTransaction` rescans the whole account address list once per input and per output — index by serialized path

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. `allAddresses` is correctly hoisted out of the loop, but the linear scan over it is not — it just moved inside `findAddress`, which is then called once per input and once per change output.

## Where

[`packages/connect/src/api/bitcoin/createPendingTx.ts:31`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/createPendingTx.ts#L31)

`findAddress` maps a signed input/output back to the account addresses that own it, by comparing serialized derivation paths. The lookup is a full `.filter().map()` over every known address of the account, repeated for every input (line 54) and every non-explicit output (line 68), so the work is the product of the two collections and each call allocates two throwaway arrays.

## Before

```ts
const allAddresses = addresses.unused.concat(addresses.used, addresses.change);
const findAddress = ({ address_n }: { address_n?: number[] }) => {
    const path = address_n ? getSerializedPath(address_n) : undefined;

    return allAddresses.filter(address => address.path === path).map(address => address.address);
};
```

Both call sites — once per input, once per output without an explicit `address`:

```ts
        vin: inputs.map((ins, n) => ({
            n,
            txid: ins.prev_hash,
            vout: ins.prev_index,
            isAddress: true,
            addresses: findAddress(ins),
            value: ins.amount.toString(),
            sequence: ins.sequence,
        })),
```

```ts
            } else {
                transformedAddresses = findAddress(out);
            }
```

## After

```ts
const allAddresses = addresses.unused.concat(addresses.used, addresses.change);
const addressesByPath = new Map<string, string[]>();
allAddresses.forEach(({ path, address }) => {
    const grouped = addressesByPath.get(path);
    if (grouped) {
        grouped.push(address);
    } else {
        addressesByPath.set(path, [address]);
    }
});

const findAddress = ({ address_n }: { address_n?: number[] }): string[] => {
    const path = address_n ? getSerializedPath(address_n) : undefined;

    return path === undefined ? [] : (addressesByPath.get(path) ?? []);
};
```

Call sites are unchanged. `O((inputs + outputs) x accountAddresses)` with two array allocations per lookup becomes `O(inputs + outputs + accountAddresses)` with one Map built once.

## Why it matters

n here is two collections multiplied: the number of signed inputs plus outputs, and the number of addresses the account knows about (`unused` + `used` + `change`, as returned by blockbook). Neither is bounded. A long-lived receive-heavy or coinjoin account carries thousands of derived addresses, and a consolidation or send-max sweep signs hundreds of inputs — the scan then runs hundreds of times over thousands of entries, allocating two intermediate arrays each time.

The entry point is `packages/connect/src/api/signTransaction.ts:373`, which calls `createPendingTransaction(bitcoinTx, { addresses: params.addresses, inputs, outputs })` on every successful Bitcoin-like signature that produced a serialized transaction. That is a cold path: it runs exactly once per signing, immediately after a multi-second device confirmation, so the realistic saving is a few milliseconds. The reason to fix it is that the cost is unbounded in account size, not that it is currently user-visible.

## Notes

- Cold path — do not oversell this as a latency fix. It is filed because the growth is `inputs x addresses` with no ceiling, on a code path whose inputs are attacker-independent but user-data-driven.
- Behaviour delta: with a `Map`, two `vin`/`vout` entries that share a derivation path now receive the **same** array instance instead of two fresh copies. That is safe for the current use — the object becomes `response.signedTransaction` and is serialized across postMessage in the iframe/webextension transports, which breaks the shared identity anyway. It is observable when `@trezor/connect` is consumed in-process (core used directly, no iframe): a caller mutating `vin[i].addresses` would then also mutate its siblings. Nothing in the repo does this, but it is worth stating in the changelog for a published package.
- Ordering is preserved. The concat order `unused` -> `used` -> `change` is the order in which entries are pushed into each per-path bucket, so `findAddress` returns the same array contents in the same order as the `.filter()` did, duplicates included.
- The `undefined` path case must keep returning `[]`. Today `.filter(a => a.path === path)` matches nothing because `Address['path']` is a non-optional `string`; the ternary reproduces that explicitly. Prefer this over `(path !== undefined && addressesByPath.get(path)) || []`, which types as `string[] | false | undefined` before the `||`.
- The explicit `: string[]` return annotation is there on purpose: without it the ternary infers `never[] | string[]`. Assignment to `transformedAddresses: string[]` (line 59) works either way, but the annotation keeps the inferred shape identical to today's. `noUncheckedIndexedAccess` is on repo-wide; `Map.get` already returns `string[] | undefined`, so the `?? []` is required, not defensive noise.
- No companion edits. The `getSerializedPath` import stays used, `allAddresses` stays (it feeds the Map build), and `__btcUnknownTxDebug__` is untouched.
- No test coverage exists for this function. `packages/connect/src/api/bitcoin/` has unit tests for `inputs`, `outputs`, `refTx`, `signtxVerify` and `enhanceSignTx`, but nothing imports `createPendingTransaction`, and no e2e fixture asserts on `signedTransaction`. Anyone taking this should add a small unit test covering: an input whose path matches several stored addresses, an input with no `address_n`, and an output with an explicit `address` (which must not hit `findAddress` at all).
- Adjacent, non-blocking smell in the same file (lines 19-26): the `valueOut`/`valueIn` reducers call `BigNumber(sum).plus(...)` where `sum` is already a `BigNumber`, constructing a redundant wrapper per element. Still `O(n)`, so a constant-factor cleanup only — `sum.plus(out.amount)` would do.
- `packages/coinjoin/src/backend/createPendingTx.ts` exports a function with the same name but a different implementation that reads addresses straight off the broadcast payload; it does not have this pattern and is out of scope here.
- No React Compiler or Hermes considerations — this is a plain SDK module with no hooks and no `toSorted`.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
