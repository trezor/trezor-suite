# Solana worker rescans the subscription list per account and per token account

Extracted from the `skills/performance-complexity/SKILL.md` audit — the same "work grows faster than the collection" principle as _"Index by key before iterating, don't scan inside a loop"_, on a non-array-method surface.

## Where

[`packages/blockchain-link/src/workers/solana/index.ts:71`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/solana/index.ts#L71) (also 57,58,59) — `getAllSignatures`

`allSignatures` — every transaction signature of a Solana account, paged 100 at a time

[`packages/blockchain-link/src/workers/solana/index.ts:591`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/solana/index.ts#L591) — `subscribeAccounts`

[`packages/blockchain-link/src/workers/solana/index.ts:633`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/solana/index.ts#L633) — `unsubscribeAccounts`

## Before

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

Append in place: `allSignatures.push(...signatures);` (or `for (const s of signatures) allSignatures.push(s)` to avoid spread-argument stack limits on large pages).

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### 2. `subscribeAccounts` rescans the subscription list per new account — `solana/index.ts:591`

O(new × subscribed), where `newAccounts` is `accounts + extractTokenAccounts(...)`.

```ts
const subscribedAccounts = state.getAccounts();
// ...
const newAccounts = [...accounts, ...tokenAccounts].filter(
    account =>
        !subscribedAccounts.some(
            subscribedAccount => account.descriptor === subscribedAccount.descriptor,
        ),
);
```

```ts
const subscribedAccounts = state.getAccounts();
const subscribedDescriptors = new Set(subscribedAccounts.map(a => a.descriptor));
// ...
const newAccounts = [...accounts, ...tokenAccounts].filter(
    account => !subscribedDescriptors.has(account.descriptor),
);
```

### 3. `unsubscribeAccounts` scans inside a triple-nested loop — `solana/index.ts:633`

This is the deepest nesting found anywhere in the audit: `accounts.forEach` → `a.tokens?.forEach` → `t.accounts?.forEach` → `subscribedAccounts.find(...)`.

```ts
accounts.forEach(a => {
    // ...
    // unsubscribe token accounts as well
    a.tokens?.forEach(t => {
        t.accounts?.forEach(ta => {
            const tokenAccount = subscribedAccounts.find(sa => sa.descriptor === ta.publicKey);
```

`state.getAccounts()` is already called on the line above the loop — the index goes right there:

```ts
const subscribedAccounts = state.getAccounts();
const subscribedByDescriptor = new Map(subscribedAccounts.map(sa => [sa.descriptor, sa] as const));

accounts.forEach(a => {
    // ...
    a.tokens?.forEach(t => {
        t.accounts?.forEach(ta => {
            const tokenAccount = subscribedByDescriptor.get(ta.publicKey);
```

## Why it matters

**`O(signatures^2 / 100) element copies`** — cold path.

`allSignatures = [...allSignatures, ...signatures]` reallocates and copies the whole accumulated array once per page. With a page size of 100 and n total signatures there are n/100 iterations, so the total copy work is n^2/200 elements. n is a Solana account's full transaction history when `fullHistory` is true — an active or bot-driven account has tens of thousands of signatures, giving millions of wasted element copies plus the GC churn of n/100 progressively larger arrays inside a worker. Entry point: `getAccountInfo` with `details: 'txs' | 'txids'` in the Solana blockchain-link worker (account discovery / full history load).

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- One-line fix: `allSignatures.push(...signatures);` — the page is capped at 100 elements so the spread-argument stack limit is not a concern, but a `for (const s of signatures) allSignatures.push(s)` is equally fine. `allSignatures` must stay `const` after the change (the `let` at :54 becomes unnecessary and ESLint prefer-const will flag it — companion edit). Order is preserved (pages are appended oldest-last, same as today).

- **Audit guidance.** Audit finding #51 plus the wave-2 P3 at :71 (getAllSignatures). :633 is a TRIPLE-nested forEach (accounts -> tokens -> token accounts) with a scan inside — the worst nesting depth in the whole audit. Fix: one `new Map(subscribedAccounts.map(a => [a.descriptor, a]))` per function; state.getAccounts() is already on the line above in both.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
