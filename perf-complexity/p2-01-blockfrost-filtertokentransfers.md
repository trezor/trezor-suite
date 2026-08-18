# `filterTokenTransfers` rebuilds the entire Cardano transaction for every (output, asset) pair — index the address lists before iterating

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. Two functions in `blockfrost.ts` are affected: `filterTokenTransfers` recomputes per-transaction work inside a doubly-nested loop, and `transformTransaction` nests `change.some()` inside `outputs.every()` and `internal.includes()` inside `outputs.filter()`.

## Where

[`packages/blockchain-link-utils/src/blockfrost.ts:167`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockfrost.ts#L167)
[`packages/blockchain-link-utils/src/blockfrost.ts:173`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockfrost.ts#L173)
[`packages/blockchain-link-utils/src/blockfrost.ts:258`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockfrost.ts#L258)

`filterTokenTransfers` turns a Cardano transaction's non-lovelace outputs into `TokenTransfer[]`. Everything inside its inner `forEach` except the asset's own `unit`/`quantity` is a property of the _transaction_, not of the (output, asset) pair being visited — yet both UTXO sides are re-transformed and the whole account address list is re-scanned on every iteration. `transformTransaction`, which calls it, has the same shape one level up: a linear scan over the change addresses nested inside a scan over the outputs, and an `Array.includes` over `internal` nested inside a filter over `outputs`.

## Before

### 1. `filterTokenTransfers` recomputes the whole transaction per (output, asset) pair — `:167`, `:173`

```ts
export const filterTokenTransfers = (
    accountAddress: AccountAddresses,
    tx: BlockfrostTransaction,
    type: TransferType,
): TokenTransfer[] => {
    const transfers: TokenTransfer[] = [];
    const myNonChangeAddresses = accountAddress.used.concat(accountAddress.unused);
    const myAddresses = accountAddress.change.concat(myNonChangeAddresses);
    tx.txUtxos.outputs.forEach(output => {
        output.amount
            .filter(a => a.unit !== 'lovelace')
            .forEach(asset => {
                const tokenUnit = asset.unit;

                const inputs = transformInputOutput(tx.txUtxos.inputs, tokenUnit);
                const outputs = transformInputOutput(tx.txUtxos.outputs, tokenUnit);
                const outgoing = filterTargets(myAddresses, inputs); // inputs going from account address
                const incoming = filterTargets(myAddresses, outputs); // outputs to account address
                const isChange = accountAddress.change.find(a => a.address === output.address);

                if (incoming.length === 0 && outgoing.length === 0) return null;

                const incomingForOutput = filterTargets(
                    myNonChangeAddresses,
                    transformInputOutput([output], tokenUnit),
                );

                let amount = '0';
                if (type === 'sent') {
                    amount = isChange ? '0' : asset.quantity;
                } else if (type === 'recv') {
                    amount = incomingForOutput.reduce(sumVinVout, 0).toString();
                } else if (type === 'self' && !isChange) {
                    amount = incomingForOutput.reduce(sumVinVout, 0).toString();
                }

                // fingerprint is always defined on tokens
                if (amount === '0' || !asset.fingerprint) return null;

                transfers.push({
                    ...transformToken(asset),
                    type,
                    amount: amount.toString(),
                    from:
                        type === 'sent' || type === 'self'
                            ? tx.address
                            : tx.txUtxos.inputs.find(i => i.amount.find(a => a.unit === tokenUnit))
                                  ?.address || '',
                    to: type === 'recv' ? tx.address : output.address,
                    standard: 'BLOCKFROST',
                });
            });
    });

    return transfers.filter(isNotNullOrUndefined);
};
```

### 2. `transformTransaction` nests `change.some()` in `outputs.every()`, and `internal.includes()` in `outputs.filter()` — `:258`, `:272`, `:302`

```ts
const internal = accountAddress ? filterTargets(accountAddress.change, outputs) : [];
const totalInput = inputs.reduce(sumVinVout, 0);
const totalOutput = outputs.reduce(sumVinVout, 0);
const allOutputsAreChange =
    fullData &&
    blockfrostTxData.txUtxos.outputs.every(o =>
        accountAddress?.change.some(c => c.address === o.address),
    );
```

```ts
// all inputs and outputs are mine
type = 'self';
targets = outputs.filter(o => !internal.includes(o));
```

```ts
type = 'sent';
targets = outputs.filter(o => !internal.includes(o));
```

## After

### 1. `filterTokenTransfers` — hoist every per-transaction lookup above the loops

```ts
export const filterTokenTransfers = (
    accountAddress: AccountAddresses,
    tx: BlockfrostTransaction,
    type: TransferType,
): TokenTransfer[] => {
    const transfers: TokenTransfer[] = [];
    const changeAddressSet = new Set(accountAddress.change.map(a => a.address));
    const myNonChangeAddressSet = new Set(
        accountAddress.used.concat(accountAddress.unused).map(a => a.address),
    );
    const isMine = (address: string) =>
        changeAddressSet.has(address) || myNonChangeAddressSet.has(address);

    // filterTargets only inspects VinVout.addresses, which transformInputOutput fills in
    // regardless of the asset, so this emptiness test has the same result for every
    // (output, asset) pair -- evaluate it once per transaction.
    const txTouchesMyAddresses =
        tx.txUtxos.inputs.some(i => isMine(i.address)) ||
        tx.txUtxos.outputs.some(o => isMine(o.address));
    if (!txTouchesMyAddresses) return transfers;

    // first input carrying a given unit, matching the original first-match `find`
    const firstInputAddressByUnit = new Map<string, string>();
    tx.txUtxos.inputs.forEach(input =>
        input.amount.forEach(a => {
            if (!firstInputAddressByUnit.has(a.unit)) {
                firstInputAddressByUnit.set(a.unit, input.address);
            }
        }),
    );

    tx.txUtxos.outputs.forEach(output => {
        const isChange = changeAddressSet.has(output.address);
        const isNonChangeTarget = myNonChangeAddressSet.has(output.address);

        output.amount
            .filter(a => a.unit !== 'lovelace')
            .forEach(asset => {
                const tokenUnit = asset.unit;

                const incomingForOutput = isNonChangeTarget
                    ? transformInputOutput([output], tokenUnit)
                    : [];

                let amount = '0';
                if (type === 'sent') {
                    amount = isChange ? '0' : asset.quantity;
                } else if (type === 'recv') {
                    amount = incomingForOutput.reduce(sumVinVout, 0).toString();
                } else if (type === 'self' && !isChange) {
                    amount = incomingForOutput.reduce(sumVinVout, 0).toString();
                }

                // fingerprint is always defined on tokens
                if (amount === '0' || !asset.fingerprint) return;

                transfers.push({
                    ...transformToken(asset),
                    type,
                    amount: amount.toString(),
                    from:
                        type === 'sent' || type === 'self'
                            ? tx.address
                            : (firstInputAddressByUnit.get(tokenUnit) ?? ''),
                    to: type === 'recv' ? tx.address : output.address,
                    standard: 'BLOCKFROST',
                });
            });
    });

    return transfers;
};
```

### 2. `transformTransaction` — build both lookups once

```ts
const internal = accountAddress ? filterTargets(accountAddress.change, outputs) : [];
const internalSet = new Set(internal);
const changeAddressSet = new Set(accountAddress?.change.map(c => c.address) ?? []);
const totalInput = inputs.reduce(sumVinVout, 0);
const totalOutput = outputs.reduce(sumVinVout, 0);
const allOutputsAreChange =
    fullData && blockfrostTxData.txUtxos.outputs.every(o => changeAddressSet.has(o.address));
```

```ts
// all inputs and outputs are mine
type = 'self';
targets = outputs.filter(o => !internalSet.has(o));
```

```ts
type = 'sent';
targets = outputs.filter(o => !internalSet.has(o));
```

## Why it matters

`filterTokenTransfers` is `O(outputs × assetsPerOutput × ((inputs + outputs) × accountAddresses))` today. For each (output, asset) pair it allocates two fresh transformed UTXO arrays, then calls `filterTargets` twice — and `filterTargets` re-maps the _entire_ address list to strings and then runs `addresses.includes(a)` per UTXO (`utils.ts:8`). A third `filterTargets` call re-maps `myNonChangeAddresses` for a single-element array. On top of that, `:177` linearly scans the change list and `:205` runs a `find` inside a `find` over all inputs. The rewrite is `O(inputs × amounts + outputs × assetsPerOutput)` with a constant number of allocations.

`n` at runtime is the transaction's output/asset count multiplied by the account's derived address count. Cardano NFT and multi-asset transactions routinely carry dozens of assets spread over several outputs, and a used Cardano account accumulates hundreds of change and receive addresses without bound. A transaction with 50 outputs carrying 5 assets each, against an account with 500 addresses, is on the order of 2.5e7 string comparisons plus ~500 throwaway arrays — for one transaction.

The entry points multiply that: `transformAccountInfo` (`blockfrost.ts:356`) maps `transformTransaction` over every transaction of an account-info page, and the blockfrost worker's `onTransaction` (`packages/blockchain-link/src/workers/blockfrost/index.ts:143`) runs it per notification. `transformTransaction`'s own hunks are `O(outputs × changeAddresses)` at `:258` and `O(outputs²)` at `:272`/`:302`, on the same per-transaction path.

No measurement was taken here. For a sense of scale on a defect of the same class, #31126 measured 167 ms → 1.7 ms at 5000 UTXOs / 20000 txs on the coin-control UTXO scans — that is _that issue's_ number for a different call site, not a benchmark of this code.

## Notes

- The largest win comes from a correctness observation, not from caching: `filterTargets` reads only `VinVout.addresses`, and `transformInputOutput` sets `addresses: [utxo.address]` regardless of the `asset` argument. The `unit` argument only affects `value`. So `incoming`/`outgoing` at `:175`/`:176` differ from each other only in which UTXO side they scan, and are **identical for every asset unit** — which makes the `if (incoming.length === 0 && outgoing.length === 0) return null;` test at `:179` a per-transaction constant. The two full `transformInputOutput` rebuilds at `:173`/`:174` exist solely to feed that test and can be deleted, not cached.
- `return null` at `:179` and `:196` are inside a `forEach` callback: they are `continue`, not a filtered-out value. The After keeps them as bare `return`. Do not convert either `forEach` into `map`/`flatMap` — the function's contract is push-order into `transfers`.
- Because those `return null`s never produce a value, `transfers` only ever contains pushed objects and `transfers.filter(isNotNullOrUndefined)` at `:213` is dead. The After drops it. **Companion edit:** `isNotNullOrUndefined` is imported at `:16` and used nowhere else in the file, so that import must be removed in the same change or lint will fail.
- `isChange` at `:177` is consumed only as a truthiness test (`:188`, `:191`), so `Set.has` returning `boolean` instead of `Address | undefined` is a drop-in. It is also constant per output, so it is hoisted out of the inner loop.
- `from` at `:203-206` must stay **first-wins**: the original returns the address of the first input in `tx.txUtxos.inputs` order that carries the unit. Building `firstInputAddressByUnit` with a `has` guard before `set` reproduces that; a plain `new Map(...)` built from a flattened list would be last-wins and would silently change the `from` field. `?? ''` matches the original `|| ''` here because `Map.get` returns `undefined` (never `null`) and an empty-string address falls through to `''` either way.
- `incomingForOutput` keeps `transformInputOutput([output], tokenUnit)` deliberately: the original result is either `[]` or a one-element array, and the value it produces goes through `reduce(sumVinVout, 0).toString()` — a `BigNumber` round-trip. Keeping the array shape preserves the exact string (including the `'0'` produced by the empty case) instead of substituting `asset.quantity` directly, which would differ for any non-canonical quantity string.
- In `transformTransaction`, `internal` holds references drawn out of `outputs`, so `new Set(internal)` + `.has(o)` is identity-equivalent to `.includes(o)`. Hoist it once at `:253` and reuse at both `:272` and `:302` rather than constructing it in each branch.
- `accountAddress` is optional (the descriptor branch leaves it `undefined`), and `accountAddress?.change.some(...)` currently evaluates to `false` for every output in that case. `new Set(accountAddress?.change.map(c => c.address) ?? [])` reproduces that exactly, including the empty-`outputs` edge case where `.every()` returns `true` both before and after. Keep the `fullData &&` short-circuit — it is what narrows `blockfrostTxData` to `BlockfrostTransaction` and it is what `getSubtype`'s parameter type expects.
- Adjacent, and deliberately _not_ fixed here: `:251`, `:252`, `:253`, `:337` and `:338` all pay `filterTargets`/`enhanceVinVout`'s `addresses.includes(a)` scan. That is the shared `isAccountOwned` defect at `packages/blockchain-link-utils/src/utils.ts:8`, filed separately in this audit. The two changes touch neighbouring lines of `transformTransaction`, so sequence them or land them together; note that fixing `isAccountOwned` alone is not a win unless the `Set` is built once in `transformTransaction` and threaded through.
- Existing coverage: `packages/blockchain-link-utils/src/blockfrost.test.ts` drives `transformTransaction` and `transformAccountInfo` from `src/__fixtures__/blockfrost.ts`, and at least one fixture exercises the token path end to end (a `recv` SNEK transfer with a populated `from`/`to`). `filterTokenTransfers` has no direct unit test, and no fixture covers `type: 'self'` or an output that is a change address, so the `isChange` and first-wins-`from` behaviours are unguarded — worth adding fixtures alongside the fix.
- `packages/blockchain-link-utils` is plain TypeScript with no React involvement, so no React Compiler or Hermes caveats apply. `Set`/`Map` are already used throughout the package.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
