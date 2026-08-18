# P3 complexity cleanups — blockchain-link and network backends

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_.

## Where

[`packages/blockchain-link-utils/src/utils.ts:45`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/utils.ts#L45) (also 39) — `transformTarget`

[`packages/blockchain-link/src/workers/solana/index.ts:71`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/solana/index.ts#L71) (also 57,58,59) — `getAllSignatures`

`incoming` is myOutputs — the subset of the transaction's vouts owned by the account — and the outer loop is the transaction's target list, itself derived from vout

## Before

### `transformTarget` — `utils.ts:45`

```ts
export const sumVinVout = (sum: BigNumberValue, { value }: VinVout): BigNumberValue =>
    typeof value === 'string' ? new BigNumber(value || '0').plus(sum) : sum;

export const transformTarget = (target: VinVout, incoming: VinVout[]) => ({
    n: target.n || 0,
    addresses: target.addresses,
    isAddress: target.isAddress,
    amount: target.value,
    coinbase: target.coinbase,
    isAccountTarget: incoming.includes(target) ? true : undefined,
});

const adjustHeight = ({ blockHeight }: { blockHeight?: number }) =>
```

### `getAllSignatures` — `index.ts:71`

```ts
) => {
    const { address } = await solana();
    let lastSignature: SignatureWithSlot | undefined;
    let keepFetching = true;
    let allSignatures: SignatureWithSlot[] = [];

    const defaultValueLimit = 100; // default value of getSignaturesForAddress
    while (keepFetching) {
        const signaturesInfos = await api.rpc
            .getSignaturesForAddress(address(descriptor), {
                before: lastSignature?.signature,
                limit: defaultValueLimit,
            })
            .send();

        const signatures = signaturesInfos.map(info => ({
```

## After

### `transformTarget`

Take a Set instead of an array: `export const transformTarget = (target: VinVout, incoming: ReadonlySet<VinVout>) => ({ ..., isAccountTarget: incoming.has(target) ? true : undefined })`, and build `new Set(myOutputs)` / `new Set(incoming)` once at the two call sites before the .map().

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `getAllSignatures`

Append in place: `allSignatures.push(...signatures);` (or `for (const s of signatures) allSignatures.push(s)` to avoid spread-argument stack limits on large pages).

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

## Why it matters

**`O(targets x myOutputs), both bounded by one transaction's vout count`** — hot path.

transformTarget is called inside `.map()` at blockbook.ts:371 (`targets.filter(...).map(target => transformTarget(target, myOutputs))`) and blockfrost.ts:327 (`targets.map(t => transformTarget(t, incoming))`), so the array membership test re-scans the owned-output array once per target. Both arrays are slices of the same vout list, so this is quadratic in the transaction's output count. The callers are the same hot ones as the other blockbook/blockfrost transform defects: transformAccountInfo over a whole page, and the workers' onTransaction per notification. Self-send consolidations owning hundreds of outputs make this hundreds of thousands of reference comparisons per transaction.

**`O(signatures^2 / 100) element copies`** — cold path.

`allSignatures = [...allSignatures, ...signatures]` reallocates and copies the whole accumulated array once per page. With a page size of 100 and n total signatures there are n/100 iterations, so the total copy work is n^2/200 elements. n is a Solana account's full transaction history when `fullHistory` is true — an active or bot-driven account has tens of thousands of signatures, giving millions of wasted element copies plus the GC churn of n/100 progressively larger arrays inside a worker. Entry point: `getAccountInfo` with `details: 'txs' | 'txids'` in the Solana blockchain-link worker (account discovery / full history load).

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- The Set must hold VinVout object references, not addresses or `n` values — `incoming` (blockfrost) / `myOutputs` (blockbook) are the exact objects returned by filterTargets out of the same vout array, so identity works; keying on address or index would change classification for transactions with two outputs to the same address. `isAccountTarget` is emitted as `true | undefined` (never `false`) and is serialised into the notification payload — keep the `? true : undefined` ternary or the blockbook/blockfrost notification fixtures in packages/blockchain-link/tests/unit/fixtures/ fail on added `isAccountTarget: false` keys. Low enough value that folding it into the utils.ts:8 issue is reasonable rather than filing separately.

- Spans more than one file — see also `packages/blockchain-link-utils/src/blockfrost.ts:327`.

- One-line fix: `allSignatures.push(...signatures);` — the page is capped at 100 elements so the spread-argument stack limit is not a concern, but a `for (const s of signatures) allSignatures.push(s)` is equally fine. `allSignatures` must stay `const` after the change (the `let` at :54 becomes unnecessary and ESLint prefer-const will flag it — companion edit). Order is preserved (pages are appended oldest-last, same as today).

- **Audit guidance.** BATCH doc: one section per anchor, each with a short Before/After. These are low-risk mechanical cleanups; be honest about which are asymptotic and which are constant-factor only. Keep it scannable — do NOT write a full essay per anchor.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
