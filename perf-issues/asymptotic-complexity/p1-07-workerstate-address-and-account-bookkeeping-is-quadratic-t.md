# `WorkerState` address and account bookkeeping is quadratic throughout — replace the `includes` scans and the `concat` reduces

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. Six sites in one 149-line file: four `Array.prototype.includes` membership tests evaluated once per candidate, plus two `reduce` accumulators that `concat` a fresh array per account (the sibling _"Don't spread the accumulator in `.reduce()`"_ rule on the array-concat surface). They compound: a single `addAccounts` call runs all three shapes over the same address union.

## Where

[`packages/blockchain-link/src/workers/state.ts:25`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/state.ts#L25)
[`packages/blockchain-link/src/workers/state.ts:33`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/state.ts#L33)
[`packages/blockchain-link/src/workers/state.ts:45`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/state.ts#L45)
[`packages/blockchain-link/src/workers/state.ts:56`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/state.ts#L56)
[`packages/blockchain-link/src/workers/state.ts:80`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/state.ts#L80)
[`packages/blockchain-link/src/workers/state.ts:112`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/state.ts#L112)

`WorkerState` is the per-worker registry of which addresses and accounts a blockchain backend is subscribed to. Every mutation of that registry — dedup, membership test, rebuilding the address union — is expressed as a linear array scan, so each one costs O(n) per element handled while `n` is the whole subscribed address set of the wallet.

## Before

### 1. Dedup helpers rescan `seen` per element (`validateAddresses`, `validateAccounts`)

```ts
    private validateAddresses(addr: string[]) {
        if (!Array.isArray(addr)) throw new CustomError('invalid_param', '+addresses');
        const seen: string[] = [];

        return addr.filter(a => {
            if (typeof a !== 'string') return false;
            if (seen.includes(a)) return false;
            seen.push(a);

            return true;
        });
    }
```

```ts
    private validateAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
        if (!Array.isArray(acc)) throw new CustomError('invalid_param', '+accounts');
        const seen: string[] = [];

        return acc.filter(a => {
            if (a && typeof a === 'object' && typeof a.descriptor === 'string') {
                if (seen.includes(a.descriptor)) return false;
                seen.push(a.descriptor);

                return true;
            }

            return false;
        });
    }
```

### 2. `addAddresses` / `removeAddresses` scan the subscribed list per candidate

```ts
export class WorkerState {
    addresses: string[];
    accounts: SubscriptionAccountInfo[];
    subscription: { [key: string]: unknown };
    cache: Cache;
    url?: string;

    constructor() {
        this.addresses = [];
        this.accounts = [];
        this.subscription = {};
        this.cache = new Cache();
    }
```

```ts
    addAddresses(addr: string[]) {
        const unique = this.validateAddresses(addr).filter(a => !this.addresses.includes(a));
        this.addresses = this.addresses.concat(unique);

        return unique;
    }

    getAddresses() {
        return this.addresses;
    }

    removeAddresses(addr: string[]) {
        const unique = this.validateAddresses(addr);
        this.addresses = this.addresses.filter(a => !unique.includes(a));

        return this.addresses;
    }
```

### 3. `addAccounts` / `removeAccounts` rebuild the address union with `concat` inside `reduce`

```ts
    addAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
        const valid = this.validateAccounts(acc);
        const others = this.accounts.filter(a => !valid.some(b => b.descriptor === a.descriptor));
        this.accounts = others.concat(valid);
        const addresses = this.accounts.reduce(
            (addr, a) => addr.concat(this.getAccountAddresses(a)),
            [] as string[],
        );
        this.addAddresses(addresses);

        return valid;
    }
```

```ts
    removeAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
        const valid = this.validateAccounts(acc);
        const accountsToRemove = this.accounts.filter(a =>
            valid.find(b => b.descriptor === a.descriptor),
        );
        const addressesToRemove = accountsToRemove.reduce(
            (addr, acc) => addr.concat(this.getAccountAddresses(acc)),
            [] as string[],
        );
        this.accounts = this.accounts.filter(a => !accountsToRemove.includes(a));
        this.removeAddresses(addressesToRemove);

        return this.accounts;
    }
```

## After

### 1. `seen` becomes a `Set`

```ts
    private validateAddresses(addr: string[]) {
        if (!Array.isArray(addr)) throw new CustomError('invalid_param', '+addresses');
        const seen = new Set<string>();

        return addr.filter(a => {
            if (typeof a !== 'string') return false;
            if (seen.has(a)) return false;
            seen.add(a);

            return true;
        });
    }
```

```ts
    private validateAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
        if (!Array.isArray(acc)) throw new CustomError('invalid_param', '+accounts');
        const seen = new Set<string>();

        return acc.filter(a => {
            if (a && typeof a === 'object' && typeof a.descriptor === 'string') {
                if (seen.has(a.descriptor)) return false;
                seen.add(a.descriptor);

                return true;
            }

            return false;
        });
    }
```

### 2. A parallel `Set` carries membership; the array stays authoritative for order

```ts
export class WorkerState {
    addresses: string[];
    accounts: SubscriptionAccountInfo[];
    subscription: { [key: string]: unknown };
    cache: Cache;
    url?: string;
    private subscribedAddresses: Set<string>;

    constructor() {
        this.addresses = [];
        this.accounts = [];
        this.subscription = {};
        this.cache = new Cache();
        this.subscribedAddresses = new Set();
    }
```

```ts
    addAddresses(addr: string[]) {
        const unique = this.validateAddresses(addr).filter(a => !this.subscribedAddresses.has(a));
        // reassign rather than mutate: callers hold the array returned by a previous getAddresses()
        this.addresses = this.addresses.concat(unique);
        unique.forEach(a => this.subscribedAddresses.add(a));

        return unique;
    }

    getAddresses() {
        return this.addresses;
    }

    removeAddresses(addr: string[]) {
        const unique = new Set(this.validateAddresses(addr));
        this.addresses = this.addresses.filter(a => !unique.has(a));
        unique.forEach(a => this.subscribedAddresses.delete(a));

        return this.addresses;
    }
```

### 3. Descriptor `Set` for the account diff, `flatMap` for the union

```ts
    addAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
        const valid = this.validateAccounts(acc);
        const validDescriptors = new Set(valid.map(a => a.descriptor));
        const others = this.accounts.filter(a => !validDescriptors.has(a.descriptor));
        this.accounts = others.concat(valid);
        const addresses = this.accounts.flatMap(a => this.getAccountAddresses(a));
        this.addAddresses(addresses);

        return valid;
    }
```

```ts
    removeAccounts(acc: SubscriptionAccountInfo[]): SubscriptionAccountInfo[] {
        const valid = this.validateAccounts(acc);
        const validDescriptors = new Set(valid.map(a => a.descriptor));
        const accountsToRemove = this.accounts.filter(a => validDescriptors.has(a.descriptor));
        const addressesToRemove = accountsToRemove.flatMap(a => this.getAccountAddresses(a));
        this.accounts = this.accounts.filter(a => !validDescriptors.has(a.descriptor));
        this.removeAddresses(addressesToRemove);

        return this.accounts;
    }
```

## Why it matters

`n` is `this.addresses` — the union of every address of every account the worker is subscribed to, not the accounts themselves. Blockbook returns used + unused + change addresses for a discovered UTXO account, so a single fully discovered BTC account contributes hundreds of entries and a wallet with several accounts sits in the low thousands.

All six sites land in one call. `addAccounts` re-derives the address union of **all** accounts every time **any** account is added, so with `A` accounts of `k` addresses each it does, per call: O((A·k)²) comparisons in `validateAddresses`, another O(A·k × already-subscribed) in `addAddresses`' filter, and an O((A·k)²) element copy in the `reduce`, which also allocates `A·k` throwaway intermediate arrays. At 10 accounts × 300 addresses that is roughly 4.5M string comparisons in the dedup, a similar count in the membership filter, and ~4.5M copied elements in the accumulator — repeated on each of the `A` calls. The account-side scans (`valid.some` / `accountsToRemove.includes`) are O(A²) on top, small by comparison but free to fix in the same edit.

Entry points are the subscription handlers of every backend: [`blockbook/index.ts:258`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/blockbook/index.ts#L258), [`blockfrost/index.ts:162`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/blockfrost/index.ts#L162), [`ripple/index.ts:285`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/ripple/index.ts#L285), [`solana/index.ts:371`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/solana/index.ts#L371) and `:610`. These run on every backend (re)connect, after discovery, and on every account add/remove — i.e. exactly when the address set is at its largest. This is worker-thread work so it does not block the UI directly, but it sits in front of every subscription round-trip and competes with transaction transformation on the same thread.

For scale on the `reduce`-`concat` shape specifically: #31122 reports a measured 227 ms at n=2000 for the equivalent spread accumulator (that issue's measurement, not one taken here); nothing in this audit was benchmarked.

## Notes

- **`addAddresses`' return value is load-bearing.** [`ripple/index.ts:305`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/ripple/index.ts#L305) does `const uniqueAddresses = state.addAddresses(addresses)` and passes it straight to `accounts_proposed` in the XRP `subscribe` command. It must stay _only_ the newly added addresses, in input order — re-subscribing already-subscribed addresses would be a protocol-level change. The `After` preserves this exactly: the filter still runs before the array is extended.
- **Do not switch `this.addresses` to in-place mutation.** [`ripple/index.ts:284-286`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/ripple/index.ts#L284) captures `prevAddresses = state.getAddresses()`, calls `addAccounts`, then diffs against the captured array. That only works because `getAddresses()` hands out a live reference and `addAddresses` _reassigns_ rather than pushes. A `this.addresses.push(...)` refactor would make `uniqueAddresses` come out empty there and silently drop the XRP subscription. The comment in the `After` marks the invariant.
- **New invariant to hold:** `subscribedAddresses` must mirror `this.addresses`. `addresses` is a public field on an exported class (it appears in the published `.d.ts`), so an external writer could desync the two. Nothing in the repo reads or writes `state.addresses` outside this file — only `getAddresses()` is used — so tightening it to `private addresses` is possible but is a public-typing change; left alone here. A reviewer who prefers no extra state can instead build `const subscribed = new Set(this.addresses)` locally inside `addAddresses`; that is O(n) per call rather than O(1) amortised, still strictly better than today's O(n·m), and carries no desync risk.
- **`removeAccounts` identity check becomes a descriptor check.** Today `this.accounts.filter(a => !accountsToRemove.includes(a))` compares object identity; the `After` compares descriptors. Equivalent because `this.accounts` is guaranteed to hold unique descriptors — `validateAccounts` dedups by descriptor and `addAccounts` drops same-descriptor entries from `others` before concatenating.
- **The address union is deliberately still computed over all accounts**, not just the newly valid ones, in `addAccounts`. Narrowing it to `valid.flatMap(...)` would be a behaviour delta: `unsubscribeAddresses` ([`blockbook/index.ts:360`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/blockbook/index.ts#L360)) can drop individual addresses while their account stays subscribed, and today the next `addAccounts` resurrects them. Worth doing as a follow-up with that case decided explicitly; keeping it out of this change keeps the diff behaviour-identical.
- `flatMap` and `Set` are fine here — `tsconfig.base.json` targets ES2023, `lib: ["webworker"]`, and `flatMap` is already used elsewhere in this package (`solana/index.ts:483`, `electrum/methods/getAccountInfo.ts:67`). No `downlevelIteration` concern since the `After` uses `Set.forEach` rather than spreading a `Set`.
- **Tests exist and are strict about ordering.** `packages/blockchain-link/src/workers/state.test.ts` drives one shared `WorkerState` through the `__fixtures__/state.ts` sequences and asserts both the `unique` return value and the exact `getAddresses()` array (`['A', 'B', 'C', 'D']`, `['A', 'B', 'xpub2-A', …]`) with `toEqual`, so any ordering regression fails immediately. Fixtures also feed non-string junk (`false`, `{ invalid: 'value' }`, `'not-an-array'`) through the validators, which the `After` still filters and still throws `invalid_param` for.
- **Adjacent scans in the same file, deliberately out of scope but natural follow-ups:** `getAccount(address)` (:89) is O(accounts × addresses-per-account) and runs per incoming transaction notification (`blockbook/index.ts:131` and `:225`, `blockfrost/index.ts:61` and `:133`, `solana/index.ts:369`) — an address→account `Map` built alongside `subscribedAddresses` makes it O(1). `ripple/index.ts:272-276` scans `getAddresses()` twice per notification, which a `hasAddress()` helper backed by the same `Set` would answer in O(1), and `ripple/index.ts:286` is itself an O(new × prev) `includes` diff that the `addAddresses` return value could replace.
- Same-package siblings from this audit that touch neither this file nor these methods: `blockchain-link-utils/src/blockbook.ts` (`transformAddresses`, and the token `reduce`/`concat`) and the electrum `getAccountInfo` / `arrayDistinct` cluster. Independent changes, no merge conflict expected.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
