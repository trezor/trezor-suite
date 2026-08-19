# `getTokens` rebuilds the token-account address list once per Solana instruction — hoist it into a `Set` and a `Map`

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Index by key before iterating, don't scan inside a loop"_. Three loop-invariant scans of `tokenAccountsInfos` sit inside the per-instruction pipeline of one function, and the worst of them allocates a fresh array on every call.

## Where

[`packages/blockchain-link-utils/src/solana.ts:634`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link-utils/src/solana.ts#L634)

`getTokens` walks every instruction of a parsed Solana transaction (top-level plus all flattened inner instructions) and turns the SPL transfers that touch the user's token accounts into `TokenTransfer` records. `tokenAccountsInfos` and `accountAddress` are constant for the whole call, but `getUiType` re-materialises the address list per instruction (`:634`), and the relevance filter (`:669`) and the mint/decimals lookup (`:678`) each linear-scan the same array per instruction.

## Before

```ts
export const getTokens = (
    tx: ParsedTransactionWithMeta,
    accountAddress: string,
    tokenDetailByMint: TokenDetailByMint,
    tokenAccountsInfos: SolanaTokenAccountInfo[],
): TokenTransfer[] => {
    const getUiType = ({ parsed }: TokenTransferInstruction) => {
        const accountAddresses = [
            ...tokenAccountsInfos.map(({ address }) => address),
            accountAddress,
        ];
        const isAccountDestination = accountAddresses.includes(parsed.info.destination);

        const isAccountSource = accountAddresses.includes(
            parsed.info.multisigAuthority || parsed.info.authority || parsed.info.source,
        );

        if (isAccountDestination && isAccountSource) {
            return 'self';
        }
        if (isAccountDestination) {
            return 'recv';
        }

        return 'sent';
    };

    const matchTokenAccountInfo = ({ parsed }: TokenTransferInstruction, address: string) =>
        address === parsed.info?.source ||
        address === parsed.info.destination ||
        address === parsed.info?.authority;

    const instructions = [
        ...tx.transaction.message.instructions,
        ...(tx.meta?.innerInstructions?.flatMap(innerIx => innerIx.instructions) ?? []),
    ];

    const effects = instructions
        // filter token transfer instructions that are relevant to the user token accounts
        .filter(
            (instruction): instruction is TokenTransferInstruction =>
                isTokenTransferInstruction(instruction) &&
                tokenAccountsInfos.some(tokenAccountInfo =>
                    matchTokenAccountInfo(instruction, tokenAccountInfo.address),
                ),
        )
        .map<TokenTransfer>((ix): TokenTransfer => {
            const { parsed, program } = ix;

            // some data, like `mint` and `decimals` may not be present in the instruction, but can be found in the token account info
            // so we try to find the token account info that matches the instruction and use it's data
            const instructionTokenInfo = tokenAccountsInfos.find(tokenAccountInfo =>
                matchTokenAccountInfo(ix, tokenAccountInfo.address),
            );

            // ... unchanged
```

## After

```ts
export const getTokens = (
    tx: ParsedTransactionWithMeta,
    accountAddress: string,
    tokenDetailByMint: TokenDetailByMint,
    tokenAccountsInfos: SolanaTokenAccountInfo[],
): TokenTransfer[] => {
    const accountAddressSet = new Set([
        ...tokenAccountsInfos.map(({ address }) => address),
        accountAddress,
    ]);

    // first entry wins on duplicate addresses, matching the previous `tokenAccountsInfos.find(...)`
    const tokenAccountInfoByAddress = new Map<string, SolanaTokenAccountInfo>();
    tokenAccountsInfos.forEach(tokenAccountInfo => {
        if (!tokenAccountInfoByAddress.has(tokenAccountInfo.address)) {
            tokenAccountInfoByAddress.set(tokenAccountInfo.address, tokenAccountInfo);
        }
    });

    const getUiType = ({ parsed }: TokenTransferInstruction) => {
        const isAccountDestination = accountAddressSet.has(parsed.info.destination);

        const isAccountSource = accountAddressSet.has(
            parsed.info.multisigAuthority || parsed.info.authority || parsed.info.source,
        );

        if (isAccountDestination && isAccountSource) {
            return 'self';
        }
        if (isAccountDestination) {
            return 'recv';
        }

        return 'sent';
    };

    // matches the instruction against the user token accounts, source first, then destination, then authority
    const findTokenAccountInfo = ({ parsed }: TokenTransferInstruction) =>
        tokenAccountInfoByAddress.get(parsed.info?.source) ??
        tokenAccountInfoByAddress.get(parsed.info.destination) ??
        tokenAccountInfoByAddress.get(parsed.info?.authority);

    const instructions = [
        ...tx.transaction.message.instructions,
        ...(tx.meta?.innerInstructions?.flatMap(innerIx => innerIx.instructions) ?? []),
    ];

    const effects = instructions
        // filter token transfer instructions that are relevant to the user token accounts
        .filter(
            (instruction): instruction is TokenTransferInstruction =>
                isTokenTransferInstruction(instruction) &&
                findTokenAccountInfo(instruction) !== undefined,
        )
        .map<TokenTransfer>((ix): TokenTransfer => {
            const { parsed, program } = ix;

            // some data, like `mint` and `decimals` may not be present in the instruction, but can be found in the token account info
            // so we try to find the token account info that matches the instruction and use it's data
            const instructionTokenInfo = findTokenAccountInfo(ix);

            // ... unchanged
```

## Why it matters

The body is **O(instructions × tokenAccounts)** string comparisons with **O(instructions × tokenAccounts)** allocations on top: `getUiType` builds a brand-new array of `tokenAccountsInfos.length + 1` strings every time it is called, and it is called from inside the `.map()` at `:702`, i.e. once per surviving transfer instruction. `instructions` is the top-level instruction list _plus_ every flattened inner instruction (`:659-662`), so a routed Jupiter/DeFi swap expands to dozens of entries in a single transaction.

`tokenAccountsInfos` is built in the Solana worker at [`packages/blockchain-link/src/workers/solana/index.ts:304`](https://github.com/trezor/trezor-suite/blob/develop/packages/blockchain-link/src/workers/solana/index.ts#L304) by mapping **all** accounts returned by `getTokenAccountsByOwner` across every token program, with no filtering — so an airdrop-spammed Solana address carries hundreds to thousands of entries, and each of those entries is scanned three times per instruction (once in the `.some()`, once in the `.find()`, once as a fresh `.map()` inside `getUiType`).

The outer multiplier is modest and this is not an asymptotic collapse: `getTokens` runs once per transaction from `transformTransaction` (`:829`) and the page size defaults to 5 (`index.ts:297`). The win here is deleting the per-instruction allocation and turning three scans into constant-time lookups, on the worker thread that also has to finish the rest of the account page. #31122 measured 227 ms at n=2000 for the same _shape_ of defect (allocate inside the loop) — that is that issue's measurement of its own code, with a much larger outer loop; nothing in this audit was benchmarked.

## Notes

- **Tie-breaking delta — the one real behaviour change.** `matchTokenAccountInfo` matches an instruction against source **or** destination **or** authority, and `.find` at `:678` returns the first entry in `tokenAccountsInfos` _array_ order. `findTokenAccountInfo` instead applies a fixed field priority (source, then destination, then authority). The two differ only when a single instruction has two _different_ owned token accounts in those slots — in practice a self-transfer between two of your own token accounts. Today the winner is whatever order the RPC happened to return from `getTokenAccountsByOwner`, so the priority version is arguably the more defensible behaviour, but it is a change: it decides `from`/`to` rewriting at `:694`/`:696` (`source === instructionTokenInfo?.address ? accountAddress : source`). The final `.filter` at `:713` keeps the effect either way.
- **If exact array-order tie-breaking must be preserved**, index positions instead of objects and take the minimum — no priority, no delta:
    ```ts
    const findTokenAccountInfo = ({ parsed }: TokenTransferInstruction) => {
        const indexes = [parsed.info?.source, parsed.info.destination, parsed.info?.authority]
            .map(address => tokenAccountIndexByAddress.get(address))
            .filter(isNotNullOrUndefined);

        return indexes.length > 0 ? tokenAccountsInfos[Math.min(...indexes)] : undefined;
    };
    ```
    `isNotNullOrUndefined` is already imported at `:36` and is index-0-safe.
- **The `Map` must be first-wins, not last-wins.** `new Map(tokenAccountsInfos.map(t => [t.address, t]))` is last-wins and would silently invert `.find`'s semantics. This is not theoretical: the `parses multiple token transfers` fixture in `packages/blockchain-link-utils/src/__fixtures__/solana.ts:1198-1209` passes _two_ entries with the identical address `ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF` and different mints/decimals (`So111…`/9 and `DH1nKg…`/1). That fixture happens to still pass under last-wins because both its instructions are `transferChecked` and carry their own `mint`/`tokenAmount.decimals`, which take precedence at `:683`/`:685` — a `transfer` instruction without them would resolve to the wrong mint.
- **`getUiType` carries no such hazard.** `accountAddresses.includes(x)` → `accountAddressSet.has(x)` is exactly equivalent (both `===` on strings), the two checks stay in the same order, and `accountAddress` stays appended after the token-account addresses.
- **The `multisigAuthority` asymmetry is preserved, not fixed.** `getUiType` considers `parsed.info.multisigAuthority` but `matchTokenAccountInfo` never did; `findTokenAccountInfo` keeps that gap deliberately so this stays a pure performance change. Worth a separate look.
- **`findTokenAccountInfo` is still called twice per instruction** (once in the type-guard `.filter`, once in the `.map`). That is three `Map.get` calls instead of a full scan, so it is not worth collapsing the `filter`/`map` pair into a `flatMap` and losing the `instruction is TokenTransferInstruction` narrowing.
- **Companion edits:** `matchTokenAccountInfo` is deleted (it has no other caller). No new imports — `SolanaTokenAccountInfo` is already imported as a type at `:32` from `@trezor/network-solana/types`.
- **TypeScript:** the repo runs `noUncheckedIndexedAccess`, but `Map.get` already returns `SolanaTokenAccountInfo | undefined`, so the `??` chain types cleanly and `instructionTokenInfo` keeps its current `SolanaTokenAccountInfo | undefined` type. `parsed.info` is non-optional in `TokenTransferInstruction` (`:573-591`), so `parsed.info?.source` is typed `string` and is a valid `Map` key — the `?.` is kept only to mirror the current defensive spelling. This was not compiled while writing the issue; confirm with `yarn workspace @trezor/blockchain-link-utils type-check`.
- **Tests:** covered. `packages/blockchain-link-utils/src/solana.test.ts:135` drives seven `getTokens` fixtures (including the duplicate-address one above and the associated-token-account rewrite), and the `transformTransaction` block at `:150` exercises the same path end to end. `yarn workspace @trezor/blockchain-link-utils test:unit --coverage=0 solana.test.ts` is the whole verification. No React Compiler or Hermes caveat — this runs in the blockchain-link Solana worker, outside React.
- **Adjacent anchors, out of scope here.** The fallback branch at `:715-722` re-walks `tokenAccountsInfos` and calls `extractAccountBalanceDiff` per entry, each doing a full `accountKeys.findIndex` — only reached when `effects` is empty, filed separately. The worker file also carries its own audit anchors at `solana/index.ts:71`, `:591` and `:633`. A larger follow-up would hoist `accountAddressSet`/`tokenAccountInfoByAddress` up to `index.ts:304`, where `tokenAccountsInfos` is built once per page, and pass them into `transformTransaction` — that amortises the two builds across the whole page but changes the exported signature, so it is deliberately not part of this fix.

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
