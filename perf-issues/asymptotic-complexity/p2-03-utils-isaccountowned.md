# `isAccountOwned` runs a linear `includes` scan of the account's whole address list per vin/vout — take a `Set` built once per transaction

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. `isAccountOwned` is the innermost predicate of the blockbook and blockfrost transaction transforms: every membership test it performs is a full array scan, and the array it scans is the account's complete derived-address list.

## Where

- [`packages/blockchain-link-utils/src/utils.ts:7`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/utils.ts#L7) — `isAccountOwned`, the `addresses.includes(a)` on line 8
- [`packages/blockchain-link-utils/src/utils.ts:26`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/utils.ts#L26) — `filterTargets`, which also re-materialises the mapped address array on every call
- [`packages/blockchain-link-utils/src/utils.ts:33`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/utils.ts#L33) — `enhanceVinVout`

The predicate answers "does this vin/vout touch one of my addresses?" by scanning a `string[]`. Nothing about that list changes between calls within a transaction, yet neither of the two helpers that wrap it accepts a prebuilt index — `filterTargets` rebuilds the mapped `string[]` from scratch on every invocation, and `enhanceVinVout` re-closes over the same array for every vin and every vout.

## Before

`packages/blockchain-link-utils/src/utils.ts:5-34`:

```ts
export type Addresses = ({ address: string } | string)[] | string;

export const isAccountOwned = (addresses: string[]) => (vinVout: VinVout) =>
    Array.isArray(vinVout?.addresses) && vinVout.addresses.some(a => addresses.includes(a));

export const filterTargets = (addresses: Addresses, targets: VinVout[]): VinVout[] => {
    if (typeof addresses === 'string') {
        addresses = [addresses];
    }
    // neither addresses or targets are missing
    if (!addresses || !Array.isArray(addresses) || !targets || !Array.isArray(targets)) return [];

    const all = addresses
        .map(a => {
            if (typeof a === 'string') return a;
            if (typeof a === 'object' && typeof a.address === 'string') return a.address;

            return undefined;
        })
        .filter(isNotUndefined);

    return targets.filter(isAccountOwned(all));
};

export const enhanceVinVout =
    (addresses: string[]) =>
    (vinVout: VinVout): EnhancedVinVout => ({
        ...vinVout,
        isAccountOwned: isAccountOwned(addresses)(vinVout) || undefined,
    });
```

The callers, `packages/blockchain-link-utils/src/blockbook.ts:220-239` and `:382-384`:

```ts
// combine all addresses into array
const myAddresses = addresses
    ? addresses.change.concat(addresses.used, addresses.unused).map(a => a.address)
    : (descriptor && [descriptor]) || [];

const inputs = Array.isArray(tx.vin) ? tx.vin : [];
const totalInput = inputs.reduce(sumVinVout, 0);
const myInputs = filterTargets(myAddresses, tx.vin);
const myTotalInput = myInputs.reduce(sumVinVout, 0);

const outputs = Array.isArray(tx.vout) ? tx.vout : [];
const totalOutput = outputs.reduce(sumVinVout, 0);
const myOutputs = filterTargets(myAddresses, tx.vout);
const myTotalOutput = myOutputs.reduce(sumVinVout, 0);
```

```ts
        details: {
            vin: inputs.map(enhanceVinVout(myAddresses)),
            vout: outputs.map(enhanceVinVout(myAddresses)),
```

and `packages/blockchain-link-utils/src/blockfrost.ts:229-252`, `:336-338`:

```ts
const myAddresses = accountAddress
    ? accountAddress.change.concat(accountAddress.used, accountAddress.unused).map(a => a.address)
    : (descriptor && [descriptor]) || [];
```

```ts
const outgoing = filterTargets(myAddresses, inputs);
const incoming = filterTargets(myAddresses, outputs);
const internal = accountAddress ? filterTargets(accountAddress.change, outputs) : [];
```

```ts
            vin: inputs.map(enhanceVinVout(myAddresses)),
            vout: outputs.map(enhanceVinVout(myAddresses)),
```

## After

Split the normalisation out of `filterTargets` so the index can be built once and passed in. `packages/blockchain-link-utils/src/utils.ts`:

```ts
export type Addresses = ({ address: string } | string)[] | string;

export const isAccountOwned = (addresses: ReadonlySet<string>) => (vinVout: VinVout) =>
    Array.isArray(vinVout?.addresses) && vinVout.addresses.some(a => addresses.has(a));

export const toAddressSet = (addresses: Addresses): Set<string> => {
    if (typeof addresses === 'string') return new Set([addresses]);
    // addresses is not guaranteed to match its type at runtime, it comes straight off the wire
    if (!addresses || !Array.isArray(addresses)) return new Set();

    return new Set(
        addresses
            .map(a => {
                if (typeof a === 'string') return a;
                if (typeof a === 'object' && typeof a.address === 'string') return a.address;

                return undefined;
            })
            .filter(isNotUndefined),
    );
};

export const filterTargetsBySet = (
    addresses: ReadonlySet<string>,
    targets: VinVout[],
): VinVout[] => {
    // targets is not guaranteed to match its type at runtime either
    if (!targets || !Array.isArray(targets)) return [];

    return targets.filter(isAccountOwned(addresses));
};

export const filterTargets = (addresses: Addresses, targets: VinVout[]): VinVout[] =>
    filterTargetsBySet(toAddressSet(addresses), targets);

export const enhanceVinVout = (addresses: ReadonlySet<string>) => {
    const isOwned = isAccountOwned(addresses);

    return (vinVout: VinVout): EnhancedVinVout => ({
        ...vinVout,
        isAccountOwned: isOwned(vinVout) || undefined,
    });
};
```

`packages/blockchain-link-utils/src/blockbook.ts` — keep the array (it still has two other consumers) and add the index next to it:

```ts
// combine all addresses into array
const myAddresses = addresses
    ? addresses.change.concat(addresses.used, addresses.unused).map(a => a.address)
    : (descriptor && [descriptor]) || [];
// build the membership index once per transaction, not once per filterTargets/enhanceVinVout call
const myAddressSet = new Set(myAddresses);

const inputs = Array.isArray(tx.vin) ? tx.vin : [];
const totalInput = inputs.reduce(sumVinVout, 0);
const myInputs = filterTargetsBySet(myAddressSet, tx.vin);
const myTotalInput = myInputs.reduce(sumVinVout, 0);

const outputs = Array.isArray(tx.vout) ? tx.vout : [];
const totalOutput = outputs.reduce(sumVinVout, 0);
const myOutputs = filterTargetsBySet(myAddressSet, tx.vout);
const myTotalOutput = myOutputs.reduce(sumVinVout, 0);
```

```ts
        details: {
            vin: inputs.map(enhanceVinVout(myAddressSet)),
            vout: outputs.map(enhanceVinVout(myAddressSet)),
```

`packages/blockchain-link-utils/src/blockfrost.ts` — `myAddresses` has no other consumer there, so it becomes the index outright:

```ts
const myAddressSet = new Set(
    accountAddress
        ? accountAddress.change
              .concat(accountAddress.used, accountAddress.unused)
              .map(a => a.address)
        : (descriptor && [descriptor]) || [],
);
```

```ts
const outgoing = filterTargetsBySet(myAddressSet, inputs);
const incoming = filterTargetsBySet(myAddressSet, outputs);
const internal = accountAddress ? filterTargets(accountAddress.change, outputs) : [];
```

```ts
            vin: inputs.map(enhanceVinVout(myAddressSet)),
            vout: outputs.map(enhanceVinVout(myAddressSet)),
```

Both import lists gain `filterTargetsBySet`; `filterTargets` stays imported in both files because the `addresses.change` call sites still use it.

## Why it matters

`isAccountOwned` is O(|vinVout.addresses| × A) per element, where **A is the account's total derived-address count** — `addresses.change.concat(addresses.used, addresses.unused)`, i.e. everything `transformAddresses` returned for the xpub. A grows by one change address per outgoing transaction plus every used receive address, so a few thousand entries is ordinary on a long-lived BTC account. `filterTargets` compounds it: lines 17-24 rebuild a fresh A-element `string[]` on **every** call before any scanning starts.

One `transformTransaction` on the blockbook path pays this five times over the transaction's vins and vouts — `filterTargets` at [`:227`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L227), [`:232`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L232) and [`:239`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L239), plus the two `enhanceVinVout` maps at [`:383-384`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L383) — giving **O((vin + vout) × A)** plus five A-element array allocations per transaction. The `:239` call is worse still because it sits inside a `.filter` predicate; that O(vout² × change) shape is filed separately.

Both factors are unbounded in practice. `vin + vout` is small for a normal payment but reaches hundreds for wallet consolidations and exchange batch payouts. The multiplier on top is the caller: `transformAccountInfo` ([`blockbook.ts:484`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L484)) maps `transformTransaction` over every transaction of every page, so account discovery and every account refresh pays it for the whole history, and the blockbook worker's `onTransaction` ([`workers/blockbook/index.ts:234`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/blockbook/index.ts#L234)) pays it again per address notification — which arrive in bursts during sync. `blockfrost.ts` has the identical shape for Cardano. All of it is worker-thread work standing between the user and a rendered account.

For scale on the same defect shape — an address-membership scan inside a per-element loop replaced by a `Set` — #31126 reports a _measured_ 167 ms → 1.7 ms at 5 000 UTXOs / 20 000 transactions. That is #31126's measurement of its own code path, not a measurement of this one; nothing here was benchmarked.

## Notes

- **Changing only `isAccountOwned` to take a `Set` is not a win.** `filterTargets` would then build a fresh `Set` per call, which is the same per-call allocation it does today. The entire benefit comes from hoisting the `Set` into `transformTransaction`, where `myAddresses` is already computed once, and threading it through — hence the new `toAddressSet` / `filterTargetsBySet` pair rather than a one-line signature swap.
- **Keep the `Array.isArray(vinVout?.addresses)` guard.** `VinVout.addresses` is optional and coinbase vins arrive without it. The fixture case `targets: ['A', null, 1, {}]` in [`src/__fixtures__/utils.ts`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/__fixtures__/utils.ts) feeds non-objects straight into the predicate, so `vinVout?.` and the `Array.isArray` check are both load-bearing. `some` + `has` is otherwise exactly equivalent to `some` + `includes`: both use SameValueZero, and address strings raise no `NaN`/`-0` edge cases.
- **`filterTargets` keeps its public signature and its runtime tolerance.** The `typeof addresses === 'string'`, `!addresses`, and `!Array.isArray(addresses)` branches move verbatim into `toAddressSet`, so the fixture cases `addresses: 1`, `addresses: null`, `addresses: [1]`, `addresses: [{ foo: 'bar' }]` still produce an empty result, and the `!targets || !Array.isArray(targets)` guard moves into `filterTargetsBySet`. `packages/blockchain-link-utils/src/utils.test.ts:8` therefore needs no edit — its `// @ts-expect-error incorrect params` still fires on the same call.
- One behaviour delta worth stating: today `filterTargets` returns `[]` _before_ normalising when `targets` is not an array; the split version normalises `addresses` first and then bails. Same return value, one wasted `Set` construction on a path that only garbage input reaches.
- **This is published API.** `packages/blockchain-link-utils/src/index.ts:1` is `export * from './utils'`, so `isAccountOwned` and `enhanceVinVout` are part of `@trezor/blockchain-link-utils` (currently `10.0.0-beta.1`). Narrowing their parameters from `string[]` to `ReadonlySet<string>` is breaking for any external consumer; in-repo the only callers are `blockbook.ts` and `blockfrost.ts`. Flag it in the changeset. Leaving `filterTargets`'s `Addresses` signature untouched keeps the blast radius to those two symbols.
- **`myAddresses` must stay an array in `blockbook.ts`.** It is still passed to `filterTokenTransfers` at [`:235`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L235) and spliced into a synthetic target on the tron-staking branch at [`:255`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L255) (`addresses: myAddresses`, where `VinVout['addresses']` is `string[]`). Converting it to a `Set` in place breaks both. `blockfrost.ts` has no such constraint.
- Hoisting `isAccountOwned(addresses)` out of `enhanceVinVout`'s returned closure removes one closure allocation per vin and per vout — small, but free, and it is the reason `enhanceVinVout` grows a body.
- Order is preserved everywhere: `.filter` is order-preserving and the predicate result is unchanged, so `myInputs` / `myOutputs` / `outgoing` / `incoming` come out identical. Nothing downstream depends on `Set` iteration order — the `Set` is only ever queried with `has`.
- TypeScript: `new Set(string[])` gives `Set<string>`, which satisfies `ReadonlySet<string>`; `isNotUndefined` still narrows the mapped array to `string[]` before it reaches the constructor, so the import stays used. **This has not been type-checked** — if the `Addresses` union's object branch fails to narrow inside `toAddressSet` (it is the same `.map` body as today, so it should not), keep the existing local `const` shape.
- **Test cover.** `packages/blockchain-link-utils/src/utils.test.ts` drives `filterTargets` against the fixture matrix above; `blockbook.test.ts` and `blockfrost.test.ts` drive `transformTransaction` end to end; `packages/blockchain-link/src/getAccountInfo.test.ts` and `notifications.test.ts` cover the worker path including the per-notification `transformTransaction`. There is **no direct unit test** for `isAccountOwned` or `enhanceVinVout` — worth adding one for the coinbase-vin (`addresses` absent) case alongside this change.
- No React or React Compiler surface: this is worker-thread code in `@trezor/blockchain-link-utils`, shared by the web/desktop and native apps.
- **Overlaps to sequence.** `blockbook.ts:239` `isNonChangeOutput` is filed separately; landing that one's hoisted change-output `Set` together with this one drops it from O(vout² × change) to O(vout). `blockfrost.ts:175-176` calls `filterTargets` inside the doubly-nested `filterTokenTransfers` loop and is covered by the blockfrost `filterTokenTransfers` issue — it should adopt `filterTargetsBySet` with a `Set` hoisted above the `forEach`. `utils.ts:45` (`transformTarget`, `incoming.includes(target)`) is a separate P3 finding in this same file and call chain.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
