# `getInfo` rescans the whole address map and rebuilds every account's address list on each electrum notification — keep reverse indexes instead

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. `createAddressManager` already owns two dictionaries keyed the wrong way round for the one query it has to answer, so every scripthash notification pays a full linear reverse lookup plus a fresh concatenated array per subscribed account.

## Where

[`packages/blockchain-link/src/workers/electrum/utils/addressManager.ts:81`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/utils/addressManager.ts#L81) (and `:84`, `:86`)

`getInfo` maps an electrum scripthash back to the address and the account descriptor that owns it. Both maps are keyed by the thing `getInfo` is trying to find, not by the thing it is given, so the lookup is done by materialising `Object.entries` and scanning — and the account scan allocates `change.concat(used, unused)` inside the `find` callback, once per account, on every call.

## Before

```ts
const getCount = () => Object.keys(subscribedAddrs).length;

const getInfo = (scripthash: string) => {
    const [address, _sh] =
        Object.entries(subscribedAddrs).find(([_addr, sh]) => sh === scripthash) || [];
    if (!address) return { descriptor: scripthash };
    const [account, addresses] =
        Object.entries(subscribedAccs).find(
            ([_acc, { change, unused, used }]) =>
                !!change.concat(used, unused).find(ad => ad.address === address),
        ) || [];

    return {
        descriptor: account || address,
        addresses,
    };
};
```

## After

```ts
export const createAddressManager = (getNetwork: () => Network | undefined) => {
    let subscribedAddrs: AddressMap = {};
    let subscribedAccs: AccountMap = {};
    // Reverse indexes, kept in sync with the two maps above so that getInfo is O(1).
    const addressByScripthash = new Map<string, string>();
    const accountByAddress = new Map<string, string>();

    const addAddresses = (addresses: string[]) => {
        // ... unchanged: `toAdd`, `network`, and the `subscribedAddrs` reduce

        toAdd.forEach(addr => {
            const scripthash = subscribedAddrs[addr];
            if (scripthash) addressByScripthash.set(scripthash, addr);
        });

        return toAdd.map(addr => subscribedAddrs[addr]).filter((addr): addr is string => !!addr);
    };

    const removeAddresses = (addresses?: string[]) => {
        // ... unchanged: `toRemove`/`toPreserve` partition and the `subscribedAddrs` assignment

        const removed = Object.values(toRemove);
        removed.forEach(scripthash => addressByScripthash.delete(scripthash));

        return removed;
    };

    const addAccounts = (accounts: SubscriptionAccountInfo[]) => {
        // ... unchanged: `toAdd` and the `subscribedAccs` reduce

        const addresses = toAdd.flatMap(({ descriptor, addresses: accAddresses }) => {
            const accAddrs = addressesFromAccounts([accAddresses]);
            // First account wins, matching the `.find()` this replaces.
            accAddrs.forEach(addr => {
                if (!accountByAddress.has(addr)) accountByAddress.set(addr, descriptor);
            });

            return accAddrs;
        });

        return addAddresses(addresses);
    };

    const removeAccounts = (accounts?: SubscriptionAccountInfo[]) => {
        // ... unchanged: `toRemove`/`toPreserve` partition and the `subscribedAccs` assignment

        const addresses = addressesFromAccounts(Object.values(toRemove));
        addresses.forEach(addr => accountByAddress.delete(addr));

        return removeAddresses(addresses);
    };

    const getCount = () => Object.keys(subscribedAddrs).length;

    const getInfo = (scripthash: string) => {
        const address = addressByScripthash.get(scripthash);
        if (!address) return { descriptor: scripthash };

        const account = accountByAddress.get(address);

        return {
            descriptor: account || address,
            addresses: account ? subscribedAccs[account] : undefined,
        };
    };

    // ... unchanged: returned object
};
```

## Why it matters

`getInfo` is `O(A + K x P)` per call — `A` = every subscribed address (one `Object.entries` array materialised and scanned), `K` = subscribed accounts, `P` = addresses per account (a fresh `change.concat(used, unused)` array allocated _inside_ the `find` callback, then scanned). It is called once per electrum `blockchain.scripthash.subscribe` notification from `txListener.onTransaction` ([`listeners/txListener.ts:40`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/listeners/txListener.ts#L40)) — i.e. for every new block or mempool event touching any subscribed address. With 20 accounts x 500 addresses that is ~10,000 element allocations plus two full scans per notification, and during initial sync notifications arrive in bursts of hundreds, all on the worker's single thread. After the fix it is two `Map.get` calls and zero allocations.

Nothing here was benchmarked. For scale of a comparable scan-inside-a-loop defect, #31123 measured 322 ms at n=2000 on its own hot path — that is that issue's measurement, not one taken for this code.

## Notes

- This is a module-level refactor, not a hoist. The two indexes must be written in `addAddresses` (:21-33) / `addAccounts` (:45-59) and pruned in `removeAddresses` (:35-43) / `removeAccounts` (:61-73), or `getInfo` resolves stale descriptors after an unsubscribe. `removeAddresses` returns `Object.values(toRemove)`, which are scripthashes, so `addressByScripthash` is pruned directly from that array; `removeAccounts` must prune `accountByAddress` _before_ delegating to `removeAddresses`.
- Cheaper interim fix with no state to maintain, if the index refactor is judged too invasive for one PR: replace `change.concat(used, unused).find(ad => ad.address === address)` with three `.some(ad => ad.address === address)` calls. That removes the per-account array allocation while keeping the scan, and is a two-line change.
- Contract to preserve: when no address matches, `getInfo` returns `{ descriptor: scripthash }`, and `txListener.ts:41-44` treats `descriptor === scripthash` as "subscribed to only internally, not explicitly from Suite" and drops the notification. The early return must keep returning the scripthash unchanged.
- Ordering delta: the current `Object.entries(subscribedAccs).find(...)` resolves an address shared by two accounts to whichever was added first. The `if (!accountByAddress.has(addr))` guard reproduces that. One residual divergence: if the first of two accounts sharing an address is unsubscribed, the reverse entry is deleted and the address stops resolving to the second account, whereas the current `find` would fall through to it. Distinct xpubs do not share addresses, so this is theoretical — but it is the one behaviour the index cannot express exactly.
- `noUncheckedIndexedAccess` is on repo-wide, so `subscribedAddrs[addr]` is `string | undefined` and `subscribedAccs[account]` is `AccountAddresses | undefined`. The latter matches the current `addresses` type exactly (it comes from a `|| []` destructure today), so `txListener.ts:58`'s `addresses ?? descriptor` still type-checks unchanged.
- Same function body as **#31129**, which names the spread-accumulator reduce at `:25`; the sibling reduce at `:49` and the `arrayDistinct` scan at `:22` were flagged in the same sweep. All four lines are within 60 lines of each other and the `After` above touches the same two functions — these should land in one PR rather than four.
- `removeAddresses`/`removeAccounts` call `objectPartition` (`packages/utils/src/objectPartition.ts:9`), which rest-spreads the remaining map per key and is itself quadratic; that is reported separately. The fix here does not depend on it and does not fix it.
- No unit test covers `createAddressManager`. The only electrum test is `packages/blockchain-link/src/workers/electrum/electrum.integration.test.ts`, which needs a live regtest electrum server at `127.0.0.1:50001` and does not exercise `getInfo` directly. A plain unit test for add/remove/`getInfo` round-trips is worth adding with this change, since the fix introduces state that can go out of sync.
- Not a React path — no compiler or Hermes considerations. Electrum is an opt-in custom backend (own node / Tor), which caps the blast radius.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
