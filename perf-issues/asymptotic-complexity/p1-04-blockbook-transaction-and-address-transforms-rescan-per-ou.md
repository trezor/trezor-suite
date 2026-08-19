# Blockbook transaction and address transforms rescan per output and per address — `isNonChangeOutput` is O(vout² × change) and both account transforms copy the `reduce` accumulator

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. Two of the four hunks below (`transformTokenInfo`, `transformAddresses`) break _"Don't spread the accumulator in `.reduce()`"_ instead; all four are bundled into one issue because they live in the same file and are reached from the same entry point, `transformAccountInfo`, which is the default backend transform for every bitcoin-like _and_ EVM account.

## Where

- [`packages/blockchain-link-utils/src/blockbook.ts:238`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L238) — `isNonChangeOutput`, used at `:277` and `:290`
- [`packages/blockchain-link-utils/src/blockbook.ts:66`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L66), [`:74-75`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L74) — `filterTokenTransfers`
- [`packages/blockchain-link-utils/src/blockbook.ts:396`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L396) — `transformTokenInfo`
- [`packages/blockchain-link-utils/src/blockbook.ts:415`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L415), [`:431-432`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L431) — `transformAddresses`

`isNonChangeOutput` closes over nothing that depends on its argument except the final `.includes(o)`, yet it recomputes the account's whole change-output set on every call, and it is used as a `.filter` predicate. The two account transforms build their result with `arr.concat([x])`, which copies everything accumulated so far per kept element, and `transformAddresses` then partitions its own output with a linear identity scan per address.

## Before

### 1. `isNonChangeOutput` re-derives the change set per output

```ts
const isNonChangeOutput = (o: VinVout) =>
    addresses ? !filterTargets(addresses.change, tx.vout).includes(o) : true;
```

Used twice, in both cases as a `.filter` predicate over the transaction's outputs:

```ts
type = 'sent';
targets = myTokens.length ? outputs.filter(isNonZero) : outputs.filter(isNonChangeOutput);
```

```ts
type = 'self';
amount = tx.fees;
const intentionalOutputs = outputs.filter(isNonChangeOutput);
targets = intentionalOutputs.length ? intentionalOutputs : outputs;
```

### 2. `filterTokenTransfers` scans the address list three times per transfer

```ts
    const all: (string | null)[] = addresses.map(a => {
        if (typeof a === 'string') return a;
        if (typeof a === 'object' && typeof a.address === 'string') return a.address;

        return null;
    });

    return transfers
        .filter(transfer => {
            if (transfer && typeof transfer === 'object') {
                return (
                    (transfer.from && all.includes(transfer.from)) ||
                    (transfer.to && all.includes(transfer.to))
                );
            }

            return false;
        })
        .map(transfer => {
            const isIncoming = transfer.from && all.includes(transfer.from);
            const isOutgoing = transfer.to && all.includes(transfer.to);
            // ... unchanged
```

### 3. `transformTokenInfo` copies the accumulator per token

```ts
export const transformTokenInfo = (
    tokens: BlockbookAccountInfo['tokens'],
): TokenInfo[] | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const info = tokens.reduce((arr, token) => {
        if (token.type === 'XPUBAddress') return arr;

        return arr.concat([
            {
                ...token,
                decimals: token.decimals || DEFAULT_TOKEN_DECIMALS,
                standard: token.standard,
            },
        ]);
    }, [] as TokenInfo[]);

    return info.length > 0 ? info : undefined;
};
```

### 4. `transformAddresses` copies the accumulator per address, then partitions by identity scan

```ts
export const transformAddresses = (
    tokens: BlockbookAccountInfo['tokens'],
): AccountAddresses | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const addresses = tokens.reduce((arr, t) => {
        if (t.type !== 'XPUBAddress') return arr;

        return arr.concat([
            {
                address: t.name,
                path: t.path,
                transfers: t.transfers,
                balance: t.balance,
                sent: t.totalSent,
                received: t.totalReceived,
            },
        ]);
    }, [] as Address[]);

    if (addresses.length < 1) return undefined;
    const internal = addresses.filter(a => a.path.split('/')[4] === '1');
    const external = addresses.filter(a => !internal.includes(a));

    return {
        change: internal,
        used: external.filter(a => a.transfers > 0),
        unused: external.filter(a => a.transfers === 0),
    };
};
```

## After

### 1. `isNonChangeOutput` re-derives the change set per output

```ts
const changeOutputs = addresses ? new Set(filterTargets(addresses.change, tx.vout)) : undefined;

const isNonChangeOutput = (o: VinVout) => !changeOutputs?.has(o);
```

### 2. `filterTokenTransfers` scans the address list three times per transfer

```ts
    const all = new Set<string | null>(
        addresses.map(a => {
            if (typeof a === 'string') return a;
            if (typeof a === 'object' && typeof a.address === 'string') return a.address;

            return null;
        }),
    );

    return transfers
        .filter(transfer => {
            if (transfer && typeof transfer === 'object') {
                return (
                    (transfer.from && all.has(transfer.from)) ||
                    (transfer.to && all.has(transfer.to))
                );
            }

            return false;
        })
        .map(transfer => {
            const isIncoming = transfer.from && all.has(transfer.from);
            const isOutgoing = transfer.to && all.has(transfer.to);
            // ... unchanged
```

### 3. `transformTokenInfo` copies the accumulator per token

```ts
export const transformTokenInfo = (
    tokens: BlockbookAccountInfo['tokens'],
): TokenInfo[] | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const info: TokenInfo[] = tokens
        .filter(token => token.type !== 'XPUBAddress')
        .map(token => ({
            ...token,
            decimals: token.decimals || DEFAULT_TOKEN_DECIMALS,
            standard: token.standard,
        }));

    return info.length > 0 ? info : undefined;
};
```

### 4. `transformAddresses` copies the accumulator per address, then partitions by identity scan

```ts
export const transformAddresses = (
    tokens: BlockbookAccountInfo['tokens'],
): AccountAddresses | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const addresses: Address[] = tokens
        .filter(t => t.type === 'XPUBAddress')
        .map(t => ({
            address: t.name,
            path: t.path,
            transfers: t.transfers,
            balance: t.balance,
            sent: t.totalSent,
            received: t.totalReceived,
        }));

    if (addresses.length < 1) return undefined;

    const internal: Address[] = [];
    const external: Address[] = [];
    addresses.forEach(a => {
        // BIP44 change level: `m/purpose'/coin'/account'/change/index`
        (a.path.split('/')[4] === '1' ? internal : external).push(a);
    });

    return {
        change: internal,
        used: external.filter(a => a.transfers > 0),
        unused: external.filter(a => a.transfers === 0),
    };
};
```

## Why it matters

**Hunk 1** is the headline. `isNonChangeOutput` is O(vout × changeAddresses) on its own — `filterTargets` ([`utils.ts:10`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/utils.ts#L10)) re-materialises a fresh mapped string array of every change address and then runs `addresses.includes(a)` per output — and it is called once per output, so the predicate costs **O(vout² × changeAddresses)** per transaction. Both factors grow with real data: consolidation and exchange batch-payout transactions carry hundreds to thousands of vouts, and `addresses.change` gains one entry for every outgoing transaction the account has ever made. The hot callers are `transformAccountInfo` ([`:484`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L484)), which maps `transformTransaction` over every transaction of every page, and the blockbook worker's `onTransaction` ([`workers/blockbook/index.ts:234`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/blockbook/index.ts#L234)), which runs it per address notification.

**Hunks 3 and 4** are the `reduce`-accumulator shape: `arr.concat([x])` allocates a new array holding everything accumulated so far, so building an n-element result copies n(n+1)/2 elements and leaves n dead intermediate arrays. For `transformTokenInfo`, n is the token list blockbook returns for an EVM account — which includes every airdrop and spam token ever sent to the address, routinely hundreds and thousands on an old ETH/BSC/Polygon address. For `transformAddresses`, n is the account's full derived-address list, which grows by one change address per outgoing transaction plus every used receive address; 3 000 addresses is ordinary, i.e. ~4.5·10⁶ element copies per response. Both run on `transformAccountInfo` ([`:470-471`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/blockbook.ts#L470)), i.e. on every account discovery and every account refresh. `:432`'s `!internal.includes(a)` adds a second **O(addresses²)** identity scan on top. For scale on the same defect shape, #31122 reports a _measured_ 227 ms at n=2000 for a spread accumulator — that is #31122's measurement of `arrayToDictionary`, not a measurement of this code; nothing here was benchmarked.

**Hunk 2** is the cheapest of the four and is included only because it is the same file and the same "scan a list inside a loop" shape: `all` is the descriptor list, which is a single element on the EVM path (where `tokenTransfers` actually exist) and is never exercised on the bitcoin-like path. It is a `Set` for tidiness, not for a measurable win.

## Notes

- **Hunk 1 must use a reference-identity `Set`, not an address-string `Set`.** `filterTargets` returns elements of `tx.vout` by reference and `outputs` is that same array, so `changeOutputs.has(o)` is exactly equivalent to today's `.includes(o)`. Matching on address strings instead would change the rule from object identity to address equality and would drop the `Array.isArray(vinVout.addresses)` guard that `isAccountOwned` applies.
- `!changeOutputs?.has(o)` preserves the `addresses === undefined → true` branch: optional chaining yields `undefined`, and `!undefined` is `true`. The EVM/descriptor path is therefore unaffected — when `addressesOrDescriptor` is a string, `addresses` is `undefined` and the predicate short-circuits, so the quadratic only ever fired for xpub-style accounts.
- Hunk 1 moves `filterTargets(addresses.change, tx.vout)` from lazy to eager: it now runs even when `isNonChangeOutput` is never called (the `joint`, `recv`, `contract`, tron-staking and `unknown` branches). That is one `filterTargets` call instead of zero on those paths, against `vout` calls instead of one on the `sent`/`self` paths — a clear net win, but worth stating.
- **TypeScript narrowing in hunks 3 and 4.** The `[] as TokenInfo[]` / `[] as Address[]` seeds exist because the early `return arr` inside the reduce is what narrows `token`/`t`. A plain `.filter()` only narrows the element type from TypeScript 5.5's inferred type predicates onward; the repo is on `typescript@6.0.3` (root `package.json`), so `t => t.type === 'XPUBAddress'` should infer `t is XPUBAddress` and `t.path` / `t.balance` / `t.totalSent` / `t.totalReceived` resolve. **This has not been type-checked** — if inference does not kick in (e.g. the predicate gets wrapped or the union widens), use `.flatMap(t => (t.type === 'XPUBAddress' ? [{ address: t.name, ... }] : []))` or an explicit `for…of` with `push`, both of which keep the same order and the same result.
- Order is preserved by every variant above, including the single-pass partition in hunk 4 (`forEach` + `push` appends in input order, matching two sequential `filter`s).
- The sentinels must stay: `transformTokenInfo` returns `undefined` when `info.length === 0`, `transformAddresses` returns `undefined` when `addresses.length < 1`. Both are load-bearing — `transformAccountInfo` passes `addresses ?? descriptor` into `transformTransaction`, so an empty-array return would silently switch every transaction onto the xpub path.
- Hunk 4 deliberately does **not** use `arrayPartition` from `@trezor/utils`: that helper is itself O(n²) in allocations (`packages/utils/src/arrayPartition.ts:12`, separately reported in this audit) and would reintroduce the cost the hunk removes. Revisit once that one is fixed.
- The single-pass partition also removes the second `a.path.split('/')` per address that the two-`filter` form would pay.
- `noUncheckedIndexedAccess` is on (`tsconfig.base.json:17`), so `a.path.split('/')[4]` is `string | undefined`; comparing it to `'1'` is fine and unchanged from today.
- **Test cover.** `packages/blockchain-link-utils/src/blockbook.test.ts` drives `filterTokenTransfers` and `transformTransaction` from `src/__fixtures__/blockbook.ts`, which includes the sent/self/joint classification cases that hunk 1 touches; `packages/blockchain-link/src/getAccountInfo.test.ts` and `notifications.test.ts` exercise the worker path end to end. There is **no direct unit test** for `transformTokenInfo` or `transformAddresses` — worth adding one for the `undefined` sentinels and the change/used/unused split alongside this change.
- No React or React Compiler surface here: this is worker-thread code in `@trezor/blockchain-link-utils`, shared by the web/desktop and native apps.
- Other anchors in this file are all covered by this issue. `packages/blockchain-link-utils/src/utils.ts:8` (`isAccountOwned`) and `:45` (`transformTarget`) are separate findings in the same call chain — fixing `isAccountOwned` to take a `ReadonlySet<string>` built once in `transformTransaction` would reduce hunk 1 from O(vout² × changeAddresses) to O(vout²), so sequence the two or merge them into one PR.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
