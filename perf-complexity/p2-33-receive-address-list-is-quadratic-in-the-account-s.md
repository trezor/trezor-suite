# Receive-address list is quadratic in the account's address count

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Keep a sort comparator to O(1) field reads"_.

## Where

[`suite-common/address/src/getReceiveAddressHistory.ts:37`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/address/src/getReceiveAddressHistory.ts#L37) (also 39,102,163) — `sortReceiveAddressesByHighestPath`

`account.addresses.used` concatenated with the visible unused addresses — the derived-address list of a UTXO account

[`suite-common/address/src/getFirstFreshAddress.ts:32`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/address/src/getFirstFreshAddress.ts#L32) — `getFreshAddresses`

[`suite-common/address/src/getReceiveAddressHistory.ts:142`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/address/src/getReceiveAddressHistory.ts#L142) — `getReceiveAddressHistoryList`

## Before

```ts
    currentFreshAddress?: CurrentFreshAddressInHistory;
    includeCurrentFreshAddress?: boolean;
};

const sortReceiveAddressesByHighestPath = (addresses: AccountAddress[]): AccountAddress[] =>
    addresses.sort(
        (firstAddress, secondAddress) => comparePath(firstAddress.path, secondAddress.path) * -1,
    );

const getPendingUnusedAddresses = (account: Account, pendingAddresses: string[]): ReceiveInfo[] =>
    account.addresses?.unused.reduce<ReceiveInfo[]>((result, { path, address }) => {
```

## After

Decorate-sort-undecorate with a single parse per address: `const parsed = new Map(addresses.map(a => [a, getHDPath(a.path)]))` above the sort, then compare the two pre-parsed number arrays element-wise inside the comparator. Note the function also sorts the argument in place; prefer `toSorted` so callers holding the array are not mutated.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### 2. `getFreshAddresses` runs three scans per unused address — `getFirstFreshAddress.ts:32`

```ts
const isPathLowerThanAnyUsedPath = (path: string, usedPaths: string[]) =>
    usedPaths.some(usedPath => comparePath(path, usedPath) < 0);

// ...

return unused.filter(
    address =>
        !alreadyUsedAddresses.find(receiveAddress => receiveAddress.path === address.path) &&
        !pendingAddresses.includes(address.address) &&
        !isPathLowerThanAnyUsedPath(address.path, usedPaths),
);
```

Two of the three are lookups and become sets; the third is a comparison and becomes a precomputed bound:

```ts
const usedPathSet = new Set(alreadyUsedAddresses.map(receiveAddress => receiveAddress.path));
const pendingAddressSet = new Set(pendingAddresses);
const lowestUsedPath = usedPaths.reduce<string | undefined>(
    (lowest, usedPath) =>
        lowest === undefined || comparePath(usedPath, lowest) < 0 ? usedPath : lowest,
    undefined,
);

return unused.filter(
    address =>
        !usedPathSet.has(address.path) &&
        !pendingAddressSet.has(address.address) &&
        !(lowestUsedPath !== undefined && comparePath(address.path, lowestUsedPath) < 0),
);
```

### 3. `getReceiveAddressHistoryList` scans the durable list per unused address — `getReceiveAddressHistory.ts:142`

`isUnusedAddressDurablyVisible` scans `touchedAddresses` and `pendingAddresses` per address (:141–142), and the `unused.reduce` at :148 then scans `durableVisibleAddresses` — which is `used + filtered unused` — per address again.

```ts
const isUnusedAddressDurablyVisible = (address: AccountAddress) =>
    touchedAddresses.some(touchedAddress => touchedAddress.path === address.path) ||
    pendingAddresses.includes(address.address) ||
    !!addressLabels[address.address] ||
    !!address.transfers;

const durableVisibleAddresses = used.concat(unused.filter(isUnusedAddressDurablyVisible));

const visibleUnusedAddresses = unused.reduce<AccountAddress[]>((result, address) => {
    const isLowerThanDurableAddress = durableVisibleAddresses.some(
        durableVisibleAddress => comparePath(address.path, durableVisibleAddress.path) < 0,
    );
```

Hoist a `Set` for each membership test, and reduce the `some` to a single precomputed maximum path:

```ts
const touchedPaths = new Set(touchedAddresses.map(touchedAddress => touchedAddress.path));
const pendingAddressSet = new Set(pendingAddresses);

const isUnusedAddressDurablyVisible = (address: AccountAddress) =>
    touchedPaths.has(address.path) ||
    pendingAddressSet.has(address.address) ||
    !!addressLabels[address.address] ||
    !!address.transfers;

const durableVisibleAddresses = used.concat(unused.filter(isUnusedAddressDurablyVisible));
const highestDurablePath = durableVisibleAddresses.reduce<string | undefined>(
    (highest, durable) =>
        highest === undefined || comparePath(durable.path, highest) > 0 ? durable.path : highest,
    undefined,
);
// then: isLowerThanDurableAddress === highestDurablePath !== undefined && comparePath(address.path, highestDurablePath) < 0
```

## Why it matters

**`O(n log n) with ~10 allocations per comparison (2 full BIP-path re-parses); order unchanged`** — warm path.

`comparePath` re-parses BOTH derivation-path strings on every comparison. Each `getPathParts` call runs `getHDPath`, which does `path.toLowerCase()`, `.split('/')`, `.filter(...)`, builds a `number[]`, and wraps it in an `ok()`/`err()` Result object — roughly 5 allocations, so ~10 per comparison, i.e. 2*n*log2(n) full path parses where n parses would do. n is the account's address list: `getReceiveAddressHistoryList` sorts `used.concat(visibleUnusedAddresses)` (line 163), and a well-used BTC/LTC account has hundreds to thousands of used addresses. Runs on the Receive tab list build and via `getFirstFreshAddress` (line 102) on every receive-address request.

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Should be folded into the fix for the already-filed :142/:150 finding rather than filed separately — one hoisted `Map<AccountAddress, number[]>` of pre-parsed paths serves both the `.some()` scan and this comparator. The other call site (:102, via getFirstFreshAddress) is bounded by the gap limit (~20 fresh addresses), so only :163 matters. CAUTION on the sweeper's `toSorted` suggestion: `addresses.sort()` currently mutates, and :163 passes a freshly built `used.concat(visibleUnusedAddresses)` while :102 passes a freshly built array too — so switching to toSorted is safe but is a behaviour change unrelated to perf; keep it out of a perf PR or call it out explicitly. `toSorted` also needs an ES2023 lib target — already used elsewhere in the repo (useAgregatedAccountsWithTokens.ts:163), so that is fine.

- Spans more than one file — see also `packages/crypto-utils/src/bipPath/comparePath.ts:10`.

- **Audit guidance.** Audit findings #47 and the wave-2 P3 at getReceiveAddressHistory.ts:37. Cover: getFirstFreshAddress.ts:32 (alreadyUsedAddresses.find), :33 (pendingAddresses.includes), :5-6 (isPathLowerThanAnyUsedPath -> usedPaths.some); getReceiveAddressHistory.ts:142 (touchedAddresses.some), :150 (durableVisibleAddresses.some inside unused.reduce), :37 (sortReceiveAddressesByHighestPath comparator allocation). Note `unused` is capped by the gap limit (20) but `used` is NOT. isPathLowerThanAnyUsedPath genuinely needs a comparison not a lookup — precompute the max used path once above the filter.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
