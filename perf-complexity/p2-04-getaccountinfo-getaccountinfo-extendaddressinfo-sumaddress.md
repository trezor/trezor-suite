# Electrum `extendAddressInfo` rescans the whole transaction history twice per address — index the vin/vout sums once instead of calling `sumAddressValues` per address

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. The scan is the `.filter(({ addresses }) => addresses?.includes(address))` inside `sumAddressValues`, and the loop is the three `.map(extendAddressInfo)` calls that run it once per derived address of the account.

## Where

- [`packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts:158`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts#L158) and [`:159`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts#L159) — the two `sumAddressValues` calls inside `extendAddressInfo`
- [`packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts:61`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts#L61), [`:69`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts#L69) — `sumAddressValues` itself, and its per-vin/vout `addresses?.includes(address)` membership test
- [`packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts:181-183`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/methods/getAccountInfo.ts#L181) — `extendAddressInfo` mapped over `change`, `unused` and `used`

`extendAddressInfo` needs two numbers per address: the total value of vins that mention it and the total value of vouts that mention it. It gets them by walking the account's entire transaction array — every transaction, every vin or vout, an `Array.prototype.includes` per entry — twice, for each of the account's addresses. The same information can be produced by one pass over the transactions, keyed by address.

## Before

```ts
export const sumAddressValues = <T>(
    transactions: T[],
    address: string,
    getVinVouts: (tr: T) => VinVout[],
) =>
    transactions
        .flatMap(tx =>
            getVinVouts(tx)
                .filter(({ addresses }) => addresses?.includes(address))
                .map(({ value }) => (value ? Number.parseFloat(value) : 0)),
        )
        .reduce((a, b) => a + b, 0);
```

```ts
    const extendAddressInfo = ({ address, path, transfers, balance }: Address): Address => ({
        address,
        path,
        transfers,
        balance: '0',
        sent: '0',
        received: '0',
        ...(['tokenBalances', 'txids', 'txs'].includes(details) && transfers
            ? {
                  balance,
                  sent: sumAddressValues(transactions, address, tx => tx.details.vin).toString(),
                  received: sumAddressValues(
                      transactions,
                      address,
                      tx => tx.details.vout,
                  ).toString(),
              }
            : {}),
    });

    return {
        // ... unchanged
        addresses:
            details !== 'basic'
                ? {
                      change: addresses.change.map(extendAddressInfo),
                      unused: addresses.unused.map(extendAddressInfo),
                      used: addresses.used.map(extendAddressInfo),
                  }
                : undefined,
```

## After

`sumAddressValues` stays exactly as it is — it is public API of `@trezor/blockchain-link` (re-exported at [`src/index.ts:368`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/index.ts#L368)) and `@trezor/coinjoin` calls it. Only this file stops using it:

```ts
type AddressValues = { sent: number; received: number };

// One pass over the account's transactions, accumulating the per-address vin/vout sums,
// so extendAddressInfo does not rescan the whole history once per address.
const sumValuesByAddress = (transactions: Transaction[]) => {
    const sums = new Map<string, AddressValues>();

    const addValues = (vinVouts: VinVout[], key: keyof AddressValues) =>
        vinVouts.forEach(({ addresses, value }) =>
            addresses?.forEach((address, index, all) => {
                // a vin/vout listing the same address twice contributed its value once before
                if (all.indexOf(address) !== index) return;
                const entry = sums.get(address) ?? { sent: 0, received: 0 };
                entry[key] += value ? Number.parseFloat(value) : 0;
                sums.set(address, entry);
            }),
        );

    transactions.forEach(({ details }) => {
        addValues(details.vin, 'sent');
        addValues(details.vout, 'received');
    });

    return sums;
};
```

```ts
const valuesByAddress = sumValuesByAddress(transactions);

const extendAddressInfo = ({ address, path, transfers, balance }: Address): Address => {
    const { sent, received } = valuesByAddress.get(address) ?? { sent: 0, received: 0 };

    return {
        address,
        path,
        transfers,
        balance: '0',
        sent: '0',
        received: '0',
        ...(['tokenBalances', 'txids', 'txs'].includes(details) && transfers
            ? {
                  balance,
                  sent: sent.toString(),
                  received: received.toString(),
              }
            : {}),
    };
};
```

## Why it matters

Today the address-extension step costs **O(addresses × transactions × (vin + vout))**; the replacement is **O(transactions × (vin + vout))** for the pre-pass plus **O(1)** per address. The address factor is the account's full derived-address list: `change` (one new address per outgoing transaction, plus the gap limit ahead of it), `used` and `unused` receive addresses — three lists that are all mapped at `:181-183`, so _every_ discovered address pays two full history walks, not just the ones with a balance. The transaction factor is the complete, unpaginated history — the electrum backend has no pagination (see the comment at `:56`), so `transactions` at `:142-146` is every transaction the account ever made.

The caller that makes both factors large at once is the electrum worker's `GET_ACCOUNT_INFO` handler ([`workers/electrum/index.ts:70`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/electrum/index.ts#L70)), issued on every account load and every account refresh for users running their own node or connecting over Tor. An account with 2 000 addresses and 5 000 transactions averaging 8 vin+vout entries performs roughly 8·10⁷ `includes` membership tests, on the worker's single thread, before the account can render — and it does it again on the next refresh. The fix does ~4·10⁴ map writes instead. For scale on the same shape of defect, #31126 reports a _measured_ 167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs — that is #31126's measurement of a different function, not a measurement of this code; nothing here was benchmarked.

## Notes

- **`sumAddressValues` must stay exported.** The audit note attached to this finding claims it has no other importer; that is wrong. It is re-exported from `packages/blockchain-link/src/index.ts:368` and consumed by [`packages/coinjoin/src/backend/getAccountInfo.ts:45-46`](https://github.com/trezor/trezor-suite/blob/develop/packages/coinjoin/src/backend/getAccountInfo.ts#L45). Deleting it is a breaking change to `@trezor/blockchain-link`'s public surface — leave the function in place (unused inside this module) or migrate the coinjoin caller in the same PR.
- **Arithmetic must stay float.** Values are parsed with `Number.parseFloat` and summed as JS numbers, which is lossy above 2⁵³ satoshi; the `After` keeps exactly that. Switching to `BigInt`/`BigNumber` here would change the emitted `sent`/`received` strings and is a separate decision.
- **Summation order is preserved,** which matters because float addition is not associative. The pre-pass visits transactions in array order and, within a transaction, vin/vout in index order — the same order the per-address `flatMap` produced — and `sent`/`received` accumulate independently, so each address's running sum sees the same operands in the same sequence and yields bit-identical results.
- **The per-vin/vout dedup guard is load-bearing.** `addresses?.includes(address)` is a boolean, so a vin/vout that lists the same address twice (bare multisig outputs do list several addresses) contributed its `value` exactly once. Iterating `addresses` without the `all.indexOf(address) !== index` guard would double-count. `k` there is 1 for every ordinary script and ≤ 15 for bare multisig, so the guard's O(k²) is free; a per-entry `new Set(addresses)` would work too but allocates per vin/vout.
- **The pre-pass must run after `transactions` is built** (`:142-146`), not on raw electrum data: it reads `tx.details.vin` / `tx.details.vout` of _transformed_ transactions, and `details.vin`/`details.vout` are `EnhancedVinVout[]` produced by `transformTransaction`. Place `sumValuesByAddress` between that block and `extendAddressInfo`.
- No behaviour change on the cheap paths: `transactions` is `[]` unless `details` is one of `tokenBalances` / `txids` / `txs` (`:142`), so the pre-pass over an empty array is a no-op and the existing `['tokenBalances', 'txids', 'txs'].includes(details) && transfers` ternary still zeroes `balance`/`sent`/`received` exactly as before.
- **TypeScript.** `transactions` is `Transaction[]` (`transformTransaction` → `sortTxsFromLatest`, [`blockchain-link-utils/src/utils.ts:51`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/utils.ts#L51)), and `Transaction.details` is non-optional (`blockchain-link-types/src/common.ts:253`), so no guard is needed. `Transaction` and `VinVout` are both already imported as types at `:1-8`. `noUncheckedIndexedAccess` is on (`tsconfig.base.json:17`) but nothing here indexes an array; `Map.get` is already `AddressValues | undefined` and the `??` handles it. `entry[key] += …` with `key: keyof AddressValues` type-checks because both properties are `number`. **This has not been type-checked** — if the compound assignment through a union key is rejected, expand it to two explicit branches.
- **No test cover.** `allTestWorkers` (`packages/blockchain-link/src/__fixtures__/allTestWorkers.ts`) lists blockbook, ripple and blockfrost only, so `getAccountInfo.test.ts` never reaches this file. The one electrum test, `packages/blockchain-link/src/workers/electrum/electrum.integration.test.ts:47`, requests a single _address_ descriptor with an empty history, i.e. the `parsed.valid` early-return branch at `:79-108` — it never touches `extendAddressInfo`. Worth adding a unit test for `sumValuesByAddress` covering the multisig duplicate-address case and an address appearing in both a vin and a vout of the same transaction.
- Worker-thread code, no React surface — the React Compiler notes that apply elsewhere in this audit are irrelevant here.
- **Related anchors.** The same call chain contains two more findings from this audit: `getTransactions` (`workers/electrum/utils/transaction.ts:103`, `:115`) is fed the unpaginated history from `:143` of this file and dedups with the O(n²) `arrayDistinct`, and `createAddressManager.getInfo` (`workers/electrum/utils/addressManager.ts:81`) rebuilds the address list per notification. Note that this file already dedups `history` with a `Map` at `:122-124`, which the sibling `getAccountBalanceHistory.ts:110-113` does not.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
