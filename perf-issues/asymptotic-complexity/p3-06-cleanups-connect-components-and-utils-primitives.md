# P3 complexity cleanups — connect, components and utils primitives

Extracted from the `skills/performance-complexity/SKILL.md` audit — section _"Don't spread the accumulator in `.reduce()`"_.

## Where

[`packages/components/src/utils/frameProps.tsx:123`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/utils/frameProps.tsx#L123) (also 120) — `pickAndPrepareFrameProps`

[`packages/connect/src/api/bitcoin/refTx.ts:46`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect/src/api/bitcoin/refTx.ts#L46) (also 61, 66) — `getReferencedTransactions / getOrigTransactions`

[`suite/address/src/labels/selectAddressLabel.ts:47`](https://github.com/trezor/trezor-suite/blob/develop/suite/address/src/labels/selectAddressLabel.ts#L47) — `selectAddressLabel`

[`suite/address/src/labels/selectAddressLabelsForAccount.ts:60`](https://github.com/trezor/trezor-suite/blob/develop/suite/address/src/labels/selectAddressLabelsForAccount.ts#L60) (also 69,70) — `selectAddressLabelsForAccount`

[`suite/metadata/src/password-manager/PasswordEntry.tsx:101`](https://github.com/trezor/trezor-suite/blob/develop/suite/metadata/src/password-manager/PasswordEntry.tsx#L101) — `PasswordEntry`

[`suite/sign-verify/src/useSignAddressOptions.ts:100`](https://github.com/trezor/trezor-suite/blob/develop/suite/sign-verify/src/useSignAddressOptions.ts#L100) (also 103) — `useSignAddressOptions (groupedOptions useMemo)`

k is the fixed per-component allow-list of frame props, bounded forever at <= 21. What actually grows is the number of _calls_: one per render of every design-system component, and design-system components are rendered per row of every list in the app (transactions, tokens, accounts).

## Before

### `pickAndPrepareFrameProps` — `frameProps.tsx:123`

```tsx
    props: TProps,
    allowedFrameProps: KFP,
    makeTransient: boolean = true,
) => {
    const selectedProps = allowedFrameProps.reduce<{
        [value in KFP[number]]: TProps[value];
    }>(
        (acc, item) => ({ ...acc, [item]: props[item] }),
        {} as { [value in KFP[number]]: TProps[value] },
    );

    return makeTransient ? makePropsTransient(selectedProps) : selectedProps;
};

export const withFrameProps = ({
    $margin,
```

### `getReferencedTransactions / getOrigTransactions` — `refTx.ts:46`

```ts
// Get array of unique referenced transactions ids
export const getReferencedTransactions = (inputs: PROTO.TxInputType[]): string[] => {
    const result: string[] = [];
    inputs.forEach(input => {
        if (input.prev_hash && !result.includes(input.prev_hash)) {
            result.push(input.prev_hash);
        }
    });

    return result;
};
```

### `selectAddressLabel` — `selectAddressLabel.ts:47`

```ts
        suiteSyncAddressLabels,
        address,
    ): string | null => {
        if (isSuiteSyncEnabled) {
            return suiteSyncAddressLabels.find(item => item.address === address)?.label ?? null;
        }

        return isLegacyLabelingVisible ? (addressLabels[address] ?? null) : null;
    },
);
```

### `selectAddressLabelsForAccount` — `selectAddressLabelsForAccount.ts:60`

```ts
    suiteSyncAddressLabels,
    addresses,
): LabelsMap => {
    if (isSuiteSyncEnabled) {
        const suiteSyncAddressLabelsMap = suiteSyncAddressLabels.reduce<LabelsMap>(
            (acc, item) => {
                acc[item.address] = item.label ?? null;

                return acc;
            },
            {},
```

### `PasswordEntry` — `PasswordEntry.tsx:101`

```tsx
            setInProgress(false);
        });
};

const { removePassword } = usePasswords();

return (
    <>
        {confirmRemove != null && (
            <Modal
                intent="critical"
```

### `useSignAddressOptions` — `useSignAddressOptions.ts:100`

```ts
const signAddressesValues = Object.values(signAddresses);
const groupedAddresses = signAddressesValues.reduce<{
    [category: string]: AddressItem[];
}>(
    (grouped, { address, path, category }) => ({
        ...grouped,
        [category]: [
            ...(grouped[category] || []),
            {
                label: address,
                value: path,
            },
        ],
    }),
```

## After

### `pickAndPrepareFrameProps`

Mutate the object the reduce already owns, and fold the `$`-prefixing into the same single pass so `makePropsTransient` does not rebuild it a third time: Drops from ~k^2 copies + 2k allocations to k writes and one allocation. Apply the same change to `pickAndPrepareTextProps` and `pickFormCellProps` for consistency.

```tsx
export const pickAndPrepareFrameProps = <...>(props, allowedFrameProps, makeTransient = true) => {
    const selectedProps: Record<string, unknown> = {};
    for (const item of allowedFrameProps) {
        selectedProps[makeTransient ? `$${item}` : item] = props[item];
    }
    return selectedProps as ...;
};
```

### `getReferencedTransactions / getOrigTransactions`

Dedupe with a Set instead of .includes on the result array:

export const getReferencedTransactions = (inputs: PROTO.TxInputType[]): string[] => [
...new Set(inputs.map(i => i.prev_hash).filter((h): h is string => !!h)),
];

export const getOrigTransactions = (inputs, outputs): string[] => [
...new Set(
[...inputs, ...outputs].map(io => io.orig_hash).filter((h): h is string => !!h),
),
];

Set preserves insertion order, so the returned arrays are identical to today's.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `selectAddressLabel`

Split the address out of the scan: build the map in a memoized selector over `suiteSyncAddressLabels` alone (shared across all addresses), then have `selectAddressLabel` do a single `map[address] ?? null` lookup. `selectAddressLabelsForAccount`'s `suiteSyncAddressLabelsMap` reduce is the shape to extract and reuse.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `selectAddressLabelsForAccount`

Split the wallet-wide index out of the per-row selector so it is built once per label-set identity instead of once per row. Add a memoized `selectSuiteSyncAddressLabelsMap = createWeakMapSelector([selectSuiteSyncAddressLabels], labels => { const map: LabelsMap = {}; for (const item of labels) map[item.address] = item.label ?? null; return map; })` in suite-common/suite-sync (keyed only on `deviceStaticId`, so all rows share one cache entry), use it as the input selector here, and let the result function do only `addresses.reduce((acc, a) => { acc[a] = map[a] ?? null; return acc; }, {})`. That turns the per-row cost from O(W) into O(addresses). The same shared map also fixes the sibling `selectAddressLabel.ts:47` `.find()` already on file, so both should land in one change.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `PasswordEntry`

Do not call the whole page hook from the row. Pass `removePassword` down from `PasswordManager`/`PasswordsList` as a prop (they already receive `savePasswords` that way), or split the delete action into its own tiny hook that only does `useDispatch()` + reads `fileName`/`aesKey`. Independently, memoise `entriesByTag` in `usePasswords` with `useMemo([entries, selectedTags])` so it is not recomputed on unrelated renders.

> The fix is described above rather than given as a hunk — the replacement needs to be written against the surrounding types before this is filed.

### `useSignAddressOptions`

Mutate the accumulator the reduce already owns instead of rebuilding it:

```ts
const groupedAddresses = signAddressesValues.reduce<Record<string, AddressItem[]>>(
    (grouped, { address, path, category }) => {
        (grouped[category] ??= []).push({ label: address, value: path });

        return grouped;
    },
    {},
);
```

## Why it matters

**`O(k^2) property copies + O(k) throwaway objects per call, k = allowedFrameProps.length (<= 21; 19 for Box) — constant factor, paid per component render`** — hot path.

Reported deliberately as a constant-factor-per-render finding, not a growing-n one, per the design-system carve-out. `pickAndPrepareFrameProps` has 82 call sites across packages/components and packages/product-components — Box, Row/Column (Flex), Text, Card, Icon, Badge, Divider, List, Banner, Tooltip, TokenIcon, etc. Box alone passes a 19-entry `allowedBoxFrameProps`, so every Box render allocates 19 intermediate objects and performs ~190 property writes before `makePropsTransient` allocates the entries array and rebuilds the object again. Rendering a 500-row transaction table with ~10 Box/Text descendants per row costs on the order of 10^6 property writes purely in prop plumbing. This is the exact pattern already filed for the two smaller siblings — typography/utils.tsx:39 (pickAndPrepareTextProps) and form/FormCell/FormCell.tsx:38 — and this one is the largest and most widely called of the three, so it appears to have been missed rather than deliberately excluded (frameProps.tsx:398 is excluded, but that is the storybook argTypes helper, a different function).

**`O(inputs x uniquePrevHashes) = O(inputs^2)`** — cold path.

Entry points: packages/connect/src/api/signTransaction.ts:278 (fetchRefTxs), packages/connect/src/api/sendTransaction.ts:402, and refTx.ts:264 inside validateReferencedTransactions. inputs.length equals the number of UTXOs the composer selected, which grows with the account's UTXO set - a send-max or consolidation from a heavily-used / faucet-fed account is easily hundreds to thousands of inputs. Each `.includes` is a full linear scan doing 64-character string comparisons. getOrigTransactions (lines 61, 66) has the identical shape over inputs and outputs.

**`O(distinctAddressesQueried x walletAddressLabels) per invalidation of the labels array`** — hot path.

The selector is invoked once per row by `UtxoSelection` (packages/suite/src/views/wallet/send/.../UtxoSelection/UtxoSelection.tsx:101), the coin-control row component — one call per UTXO, and UTXO counts on a bitcoin or coinjoin account run to hundreds or thousands. Because the combiner is `weakMapMemoize`d on the input results, each _distinct_ address costs one full linear scan, and the whole cache is invalidated whenever `suiteSyncAddressLabels` changes identity (any label edit, any Suite Sync sync tick). Address labels grow with user activity, so both factors grow. Contrast `selectAddressLabelsForAccount` in the sibling file, which already builds an address->label map exactly once for a batch of addresses.

**`O(rendered target rows x manually-labelled wallet addresses), plus one throwaway LabelsMap object per row`** — hot path.

The result function is memoized by `createWeakMapSelector`, but the memo key includes the `addresses` argument, and every row passes its own `target.addresses` array (packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TargetAddressLabel.tsx:29-33). Distinct array reference per row => distinct weakMap cache leaf => each row runs the full `suiteSyncAddressLabels.reduce(...)` over the whole wallet's label set and allocates its own W-entry `LabelsMap`, only to then look up the 1-2 addresses it actually needs. Every mutation of the label set (a label edit, a Suite Sync push, initial sync hydration) changes the `suiteSyncAddressLabels` reference and invalidates every row's entry at once, so the whole O(rows x W) cost is paid again. W grows monotonically with how many addresses the user has ever labelled across every account of the wallet; the wallet-wide array is shared by all accounts, so a heavy labeller on one account pays the cost on every other account's transaction list too.

**`O(entries^2) — n rows each re-running an O(n) typedObjectEntries().reduce over the full entry set`** — hot path.

`PasswordsList` (suite/metadata/src/password-manager/PasswordsList.tsx:65) maps one `PasswordEntry` per entry, and each `PasswordEntry` calls `usePasswords()` purely to obtain the `removePassword` callback. `usePasswords` unconditionally computes `entriesByTag = typedObjectEntries(entries).reduce(...)` (suite/metadata/src/password-manager/usePasswords.ts:70) — it materialises an array of all n [id, entry] pairs and runs `entry.tags.some(...)` over each — plus `Object.values(selectedTags).some(...)`, before returning. None of that result is used by the row. The password file is exactly the kind of collection users grow without limit; at a few hundred entries every keystroke-triggered re-render of the list does tens of thousands of wasted iterations plus n throwaway entry arrays. Each row also mounts three extra `useSelector` subscriptions it does not need.

**`O(addresses^2) element copies within the largest category (used / change)`** — warm path.

This is a _second, distinct_ reduce from the already-reported one at :20 — the `{...grouped}` spread here is cheap (only 3-4 category keys) but `[...(grouped[category] || []), {...}]` copies the whole accumulated category array on every single address. Since all of `addresses.used` lands in one category ('TR_ADDRESSES_USED') and all of `addresses.change` in another, the copy cost is quadratic in the size of the largest category. For an actively used or coinjoin-derived bitcoin account `addresses.used`/`addresses.change` run to hundreds or thousands of entries, so opening Sign & Verify does millions of element copies inside a `useMemo` that re-fires whenever `account` changes (i.e. on every account sync).

No number here is measured. For scale on the same defect class, #31123 reports **322 ms at n=2000** and #31126 reports **167 ms → 1.7 ms at 5 000 UTXOs / 20 000 txs** — those are those issues' measurements, not this one's.

## Notes

- Correct the call-site count in the issue: 40 invocations of pickAndPrepareFrameProps across packages/components + packages/product-components (in 42 files by import), not 82. Fix caveats: (a) the return type today is inferred as the union of `TransientProps<Selected>` and `Selected` from the `makeTransient` ternary at line 127; a single-pass version building `$`-prefixed keys inline needs an explicit conditional/overloaded return type or per-branch `as` casts, otherwise callers that do `as TransientProps<AllowedFrameProps>` (e.g. VirtualizedList.tsx:214) will still compile but the non-transient callers may widen to Record<string, unknown>. (b) No behaviour delta on undefined values: the current spread creates the key with value `undefined` when the prop is absent, and a plain assignment does the same, so styled-components sees the identical prop set. (c) Folding the `$` prefix in removes the separate Object.entries/fromEntries rebuild in makePropsTransient (transientProps.ts:14) for this path only — keep makePropsTransient exported, it has its own tests (transientProps.test.ts, frameProps.test.ts). (d) Pure function called during render; no React Compiler or memoization interaction. Apply the same one-line change to pickAndPrepareTextProps and pickFormCellProps so all three land together.

- Spans more than one file — see also `packages/components/src/components/Box/Box.tsx:19`.

- P3 is correct and should stay P3 — cold, once per sign, ~64-char string compares that fail on the first byte; this is hygiene, not a measurable win. DROP the extraLines 61/66 (getOrigTransactions) from the issue: `result` there holds the distinct orig_hash values, which is 1 for every real RBF (one replaced transaction), so that `.includes` scans a one-element array and is not a finding. The Set rewrite of getReferencedTransactions preserves insertion order and the falsy-prev_hash filter, so behaviour is identical; `packages/connect/src/api/bitcoin/__fixtures__/refTx.ts` and the refTx tests should be re-run. If getOrigTransactions is rewritten anyway, note that all three PROTO.TxOutputType union variants declare `orig_hash: Type.Optional(Type.String())` (packages/protobuf/src/definitions/messages-bitcoin.ts:379,389,399), so `[...inputs, ...outputs].map(io => io.orig_hash)` does type-check.

- Spans more than one file — see also `packages/connect/src/api/signTransaction.ts:278`.

- The fix must keep the map-building selector separate from the `address` input, otherwise weakMapMemoize will rebuild the map per address and make things worse: build `Map<address, label>` in its own createMemoizedSelector over `selectSuiteSyncAddressLabels(state, deviceStaticId)` alone, then have the final combiner do one `.get(address) ?? null`. Preserve first-wins: `.find()` returns the FIRST matching record, so a Map built with `.reduce`/`new Map(...)` (last-wins) changes behaviour if duplicate address rows can exist for one wallet — build it with a `has` guard, or confirm the Suite Sync store dedupes by address. Also keep returning `null` (not undefined) for misses; callers at UtxoSelection.tsx:101, NewestAddressCard.tsx:84 and ConfirmValueModal.tsx:94 type the result as `string | null`.

- Spans more than one file — see also `packages/suite/src/views/wallet/send/Options/BitcoinOptions/CoinControl/UtxoSelectionList/UtxoSelection/UtxoSelection.tsx:101`.

- Fix as proposed is sound and compiles: add a `selectSuiteSyncAddressLabelsMap` memoized selector in suite-common/suite-sync keyed only on `deviceStaticId` (so all rows share one cache entry), take it as an input selector here, and reduce only over `addresses` in the result function. Behaviour delta to watch: the current map keys purely on `item.address` and ignores `item.networkSymbol`, so two networks sharing an address string collide — the shared map MUST keep that same keying (address-only) or the fix silently changes which label wins. Do not switch the shared map to `createSuiteSyncAddressId(address, networkSymbol)` without also changing the lookup at :69-70, which only has the bare address. Sibling scan at suite/address/src/labels/selectAddressLabel.ts:47 has the same shape and should ride along. Note the caller passes `target.addresses ?? []` — the `?? []` allocates a fresh array each render for targets with no addresses, which defeats the memo entirely for those rows; hoisting a module-level EMPTY_ARRAY const is a free extra win. React Compiler is NOT enabled for packages/suite (only suite-native/app/app.config.ts:326 sets reactCompiler:true), so nothing upstream is auto-memoizing this.

- Spans more than one file — see also `packages/suite/src/components/wallet/TransactionItem/TransactionTarget/TargetAddressLabel.tsx:29`.

- `removePassword` is already `useCallback`-wrapped in usePasswords (:78-:86), so lifting it into a prop from `PasswordsList`/`PasswordManager` (which already thread `savePasswords` down) keeps referential stability. Watch the render-order coupling: PasswordsList maps over `entriesByTag` when `isSomeTagSelected` and over `entries` otherwise (:62-:65), and passes `index={Number(key)}` — the id the row passes back to `removePassword`, so the prop must be the same `removePassword(index: number)` signature. Memoising `entriesByTag` with useMemo is a separate, independently-safe change; under React Compiler the hook's non-hook-derived locals are already auto-memoised in compiled builds, so measure before adding a manual useMemo.

- Spans more than one file — see also `suite/metadata/src/password-manager/usePasswords.ts:70`.

- MUST be filed/fixed together with the already-reported useSignAddressOptions.ts:20 `reduceAddresses` spread — same file, same hook, same class of defect; two separate issues would collide. The proposed `(grouped[category] ??= []).push(...)` compiles under this repo's `noUncheckedIndexedAccess` (the file already carries two `@ts-expect-error` comments at :120 and :124 for that setting, so the fix must not accidentally make those expect-errors unused — `options[0]` at :121 is untouched by this change, so they stay). Mutating the reduce accumulator is safe here: `{}` is freshly created per useMemo run and never escapes before `Object.entries(groupedAddresses)` at :113. Insertion order of categories and of addresses within a category is preserved by push, so the rendered option groups are unchanged.

- **Audit guidance.** BATCH doc: one section per anchor, each with a short Before/After. These are low-risk mechanical cleanups; be honest about which are asymptotic and which are constant-factor only. Keep it scannable — do NOT write a full essay per anchor.

- Generated from the twice-verified audit in [`PERFORMANCE-COMPLEXITY-AUDIT.md`](../PERFORMANCE-COMPLEXITY-AUDIT.md); the `Before` block is a verbatim window from the file. **The `After` hunk has not been type-checked — review it before filing.**

<sub>Verified against `develop` at c50ebc116d. Part of #28886.</sub>
