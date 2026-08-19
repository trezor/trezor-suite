# Review threads → skills: proposal

Digest of [`code-review-threads/`](README.md) — 86 harvested review-thread-groups from 31 PRs — into
candidate coding-standard rules, each routed to an existing `skills/` file or to a proposed new one.

Method: one agent per topic extracted candidate rules, a second agent independently re-checked every
coverage claim and citation, a synthesiser deduped across topics, and every load-bearing citation below
was then verified by hand against the working tree.

## Routing summary

| #   | Rule                                                                             | Groups | Destination                             |
| --- | -------------------------------------------------------------------------------- | ------ | --------------------------------------- |
| 1   | Keep an absent value `undefined` — don't substitute `''` or `'0'`                | 3      | skills/defensive-programming/SKILL.md   |
| 2   | Fetch with `useQuery`, not an effect that dispatches and mirrors state           | 4      | **NEW** skills/data-fetching/SKILL.md   |
| 3   | Replace an `as` cast with `satisfies`, a guard, a parse, or a better type        | 4      | skills/typescript/SKILL.md              |
| 4   | Take `AccountWithNetworkType<T>`, not `Account`, and narrow once upstream        | 2      | skills/typescript/SKILL.md              |
| 5   | Compare EVM addresses with `areEvmAddressesEqual`, not ad-hoc `.toLowerCase()`   | 2      | skills/defensive-programming/SKILL.md   |
| 6   | Only call `.unwrap()` where you handle the rejection                             | 1      | skills/redux/SKILL.md                   |
| 7   | Fail with a named error instead of returning a bare `null`                       | 2      | skills/defensive-programming/SKILL.md   |
| 8   | Extract logic both apps need into suite-common instead of duplicating it per app | 2      | skills/packages/SKILL.md                |
| 9   | Export one React component per file, and give an extracted hook its own file     | 3      | skills/components/SKILL.md              |
| 10  | Decide per-network behaviour from network `features`, not a symbol list          | 1      | skills/defensive-programming/SKILL.md   |
| 11  | Give a name to logic the reader has to decode                                    | 5      | skills/comments/SKILL.md                |
| 12  | Let callers pass `queryOptions` into a shared query hook, never overwrite them   | 1      | **NEW** skills/data-fetching/SKILL.md   |
| 13  | Type test fixtures with `satisfies`, not `as unknown as`                         | 2      | skills/tests/SKILL.md                   |
| 14  | Call the narrowest query hook for what you render                                | 1      | **NEW** skills/data-fetching/SKILL.md   |
| 15  | Pick the ref hook by when `.current` is read                                     | 1      | skills/performance-react-hooks/SKILL.md |

## Proposed new skill

### `skills/data-fetching/` — 3 rules

```yaml
name: data-fetching
description: TanStack Query conventions: fetching with useQuery instead of an effect that dispatches a thunk, when useMutation is the right tool, query keys, and how a shared query hook exposes options. Use when a screen needs to load data, when writing or reviewing a hook in suite-common that wraps useQuery, or when you find yourself mirroring loading/error state into useState.
```

- ## Fetch with `useQuery`, not an effect that dispatches and mirrors state
- ## Let callers pass `queryOptions` into a shared query hook, never overwrite them
- ## Call the narrowest query hook for what you render

**Why not an existing file:** Grep over skills/ finds zero mentions of TanStack Query, `useQuery`, `useMutation` or `queryKey`. The two candidate existing homes both distort the rules: skills/redux is about the effect+thunk+slice pattern these rules steer away from (its :216 lifecycle-actions bullet would end up arguing against its own subject), and skills/performance-react-hooks covers fetch-in-effect only from the dependency-stability angle (:81 "the request count is unbounded"), prescribing a narrower dependency array rather than replacing the effect. The query layer is a distinct domain with its own vocabulary (query identity, `enabled`, `select`, key factories) and its own already-mechanized parts. Three rules is in line with existing small skills (packages, import-export and publish-config each have two headings). The skill must open by naming the lint boundary: `@tanstack/eslint-plugin-query` `flat/recommended-strict` is on for every file using the Query API (packages/eslint/src/reactQueryConfig.mjs:10), so query-key exhaustive-deps, rest-destructuring and mutation property order must not be restated in prose.

## Rules

### 1. Keep an absent value `undefined` — don't substitute `''` or `'0'`

- **Destination** `skills/defensive-programming/SKILL.md` (existing-add)
- **Backing** 3 review-thread-group(s) — Nullability & sentinel values (G03, G77, G78)
- **Confidence** high

When a value is genuinely missing, pass `undefined` (or `null` where that is the domain type) and let the consumer decide what to render; do not fill the hole with `''` or `'0'`. If the absence makes the surrounding computation meaningless, guard on it and let the type narrow — `if (!token?.symbol) return [];` — instead of manufacturing a value that satisfies the compiler. Boundary: a controlled form input's `value` and string concatenation legitimately need `?? ''`; there `''` is the real empty state, not a stand-in for absence.

**Why it matters.** `''` and `'0'` are indistinguishable from real data, so the absence stops being visible: a `?? ''` symbol reaches a vault lookup as a legitimate key and silently matches nothing, a `?? '0'` balance renders as a confident zero where the UI should show a placeholder, and every downstream reader has to re-guess whether the empty value meant "absent" or "empty". The type-checker cannot help, because the sentinel is a valid inhabitant of the declared type.

**Existing coverage.** skills/defensive-programming/SKILL.md:10 — "Whenever possible, cover all cases. If a new case is added in the future, TypeScript should force the developer to set behavior for it." The heading above it sounds like coverage, but all three sub-sections (:12 explicit return types, exhaustive switch, type-mapping) are about exhausting union _cases_; nothing in skills/ says anything about substituting a placeholder for a missing value.

```tsx
// bad - the pre-fix shape from #30994: '' is not a symbol, yet it reaches the vault lookup as data
const heldToken = {
    address: token.contract,
    symbol: token.symbol ?? '',
    decimals: token.decimals,
};

// good - useYieldBadge.tsx:41 - the lookup is meaningless without a symbol, so guard and narrow
if (!networkSymbol || !token?.symbol) return [];

const heldToken = {
    address: token.contract,
    symbol: token.symbol,
    decimals: token.decimals,
};
```

**Evidence**

- G03 https://github.com/trezor/trezor-suite/pull/27590#discussion_r3224430555 — "isn't better to pass undefined than empty strings so a react component could decide if it should display some placeholder"
- G77 https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749106530 and G78 …#discussion_r3749107437 — same note, different PR/author; both landed
- VERIFIED live violation: packages/suite/src/components/earn/yield/hooks/useYieldFlow.ts:217 — `const inputTokenSymbol = isSharesInput ? (receiptToken?.symbol ?? '') : (token?.symbol ?? '');` (also :204 `return token?.balance ?? '';`)
- VERIFIED accepted fix: suite-native/module-earn/src/hooks/useYieldBadge.tsx:41 `if (!networkSymbol || !token?.symbol) return [];`, then :45 `symbol: token.symbol,`
- VERIFIED dead sentinel: suite-native/module-accounts-management/src/components/YourPositionCard.tsx:77 `vaultId={yieldBadge.vaultId ?? ''}` on a value the hook types as non-optional `vaultId: string` (useYieldBadge.tsx:21)
- VERIFIED scale/boundary: 245 occurrences of `?? ''` across packages/suite/src, suite-common and suite-native, many legitimate — so this is prose, not lint

### 2. Fetch with `useQuery`, not an effect that dispatches and mirrors state

- **Destination** `NEW skills/data-fetching/SKILL.md` (new-skill)
- **Backing** 4 review-thread-group(s) — Data fetching — prefer TanStack Query (rule 1: G08, G60, G72, G56); Data fetching — prefer TanStack Query (rule 2 `useMutation` only when user-triggered: G56, G08 — same groups, merged)
- **Confidence** high

Data a screen needs as soon as its inputs exist belongs in a `useQuery` keyed by those inputs, not in a `useEffect` that dispatches a thunk and mirrors loading/error/race state into `useState`. Query identity gives request de-duplication, discarding of superseded responses and an `AbortSignal` for free. The corollary: `useMutation` is for imperative, user-triggered writes — if you find yourself calling `mutate()` from a `useEffect`, the case is declarative, so move it to `useQuery` and turn the effect's guard clause into `enabled`. Add the key to the factories in `suite-common/react-query/src/constants/queryKeys.ts`; never inline `queryKey: []`.

**Why it matters.** The effect version needs a request-id guard to drop stale responses and a manual loading flag: miss the guard and a superseded fee estimate overwrites the current one, miss the flag and the spinner never clears. A mutation fired from an effect is worse — it has no cache identity, so nothing de-duplicates it and nothing aborts the superseded call, while the effect's dependency on the whole `account` object re-fires it after every blockchain update.

**Existing coverage.** skills/redux/SKILL.md:216 — "For async thunks, try to make use of the lifecycle actions whenever it makes sense. For example, when you have an async thunk that fetches something and saves in state." — the closest existing text, and it points the opposite way; putting this rule there would make the redux skill argue against its own subject. Grep confirms zero mentions of TanStack Query, `useQuery`, `useMutation` or `queryKey` anywhere in skills/.

```tsx
// bad - useEthereumCancelTxCompose.ts:115 - a mutation nothing user-triggered ever calls, fired
// from an effect whose deps include the whole `account` object
const {
    mutate,
    data,
    isPending: isComposing,
} = useMutation({
    mutationFn: () => dispatch(composeEthereumCancelTransactionThunk({ account, tx })).unwrap(),
});

useEffect(() => {
    if (account.networkType !== 'ethereum' || !feeInfo) return;

    mutate();
}, [account, tx, feeInfo, mutate]);

// good - the preconditions become `enabled`, and the effect disappears with them
const { data, isPending: isComposing } = useQuery({
    queryKey: desktopQueryKeys.ethereumCancelTx(account.key, tx.txid),
    queryFn: () => dispatch(composeEthereumCancelTransactionThunk({ account, tx })).unwrap(),
    enabled: account.networkType === 'ethereum' && Boolean(feeInfo),
});
```

**Evidence**

- G08 https://github.com/trezor/trezor-suite/pull/27621#discussion_r3233333111 (@BrantalikP — useMutation/useQuery instead of effect + isComposing state)
- G60 https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682381623 (@53gur0 — "this looks like job for useQuery")
- G56 https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682308103 (@53gur0 — "Why not using useQuery if it's more declarative than imperative use-case?")
- G72 https://github.com/trezor/trezor-suite/pull/29445#discussion_r3712475266 (@tomasklim — graph fetching thunk "could be fairly easily replaced with tanstack query")
- VERIFIED live hand-rolled shape: suite-native/module-earn/src/hooks/useComposeEarnFees.ts:93 (`useState` loading flag), :96 (`requestIdRef`), :193-196 (the effect that bumps the id and fires the compose)
- VERIFIED live mutate()-from-effect: packages/suite/src/hooks/wallet/useEthereumCancelTxCompose.ts:55 (`useMutation`), :115-120 (`useEffect` calling `mutate()` with deps `[account, tx, feeInfo, mutate]`)
- VERIFIED good precedents: suite-common/wallet-core/src/fiat-rates/useMissingRateTickersQuery.ts:26-40 (`useQuery` wrapping `dispatch(thunk()).unwrap()` with `enabled: missingRateTickers.length > 0`, keyed via `commonQueryKeys.missingRateTickers`) — note it carries an `@tanstack/query/exhaustive-deps` disable at :25 for the stable `dispatch`, so cite it for the shape, not as disable-free; packages/suite/src/components/suite/graph/TransactionsGraph/hooks/useTransactionGraphUpdater.ts (the G72 fetch, now a query keyed by `desktopQueryKeys.accountGraphUpdate`)
- VERIFIED central key factories: suite-common/react-query/src/constants/queryKeys.ts:3 `commonQueryKeys`, :31 `desktopQueryKeys`, both `satisfies Record<string, AllowedQueryKey>`
- VERIFIED lint boundary: packages/eslint/src/reactQueryConfig.mjs:10 enables `flat/recommended-strict`, so exhaustive-deps/rest-destructuring/mutation property order are already mechanized and must not be restated in prose

### 3. Replace an `as` cast with `satisfies`, a guard, a parse, or a better type

- **Destination** `skills/typescript/SKILL.md` (existing-add)
- **Backing** 4 review-thread-group(s) — TypeScript type safety (G57, G86, G76); Runtime validation & parsing (G41, G59 — folded in as the schema clause only; see disputes)
- **Confidence** high

An `as` cast is an unchecked claim, so it is the wrong tool at the places it is most tempting. Constructing a value: use `satisfies` — it checks the shape without erasing what the compiler knows. Narrowing a string you did not construct: use the existing guard (`isNetworkSymbol` from `@suite-common/wallet-config`) where there is a fallback to fall back to, or the sanctioned `asNetworkSymbol` wrapper at a parse boundary where the string comes from outside and there is no alternative. An object payload from outside the type system: parse it (`safeParse` on a schema in `@suite-common/schemas`, as `parseEvmFeeHex` does; HTTP responses already get this from `createHttpClient`'s per-endpoint `schema`). If none of those fit because the type is wrong, change the type rather than casting around it.

**Why it matters.** The cast silences the compiler exactly where the shape is decided, so a later field rename, or a value that was never a `NetworkSymbol`, compiles fine and fails at runtime — `TokenIcon` renders nothing, or a `networks[symbol]` lookup returns `undefined` far from the cast that caused it. `satisfies`, a guard and a parse all keep the same code compiling only while it is still true.

**Existing coverage.** skills/typescript/SKILL.md:22 — "Use `unknown` for situations where a function _doesn't know_ the incoming type and not when it _doesn't care_ about the type. With better type safety, `unknown` can help us catch possible errors early on." The file already has two sections about not silencing the compiler (`@ts-expect-error` vs `@ts-ignore` at :8, `unknown` vs `any` at :20) and offers a hand-written type guard at :26-34; `as` is the third way and is absent.

```ts
// bad - useEthereumCancelTxCompose.ts:105 - the cast is the only reason this literal type-checks,
// so a renamed field on PrecomposedTransactionFinalCancelRbf keeps compiling here
return {
    composedCancelTx: {
        ...normalLevel,
        rbfType: 'cancel',
        prevTxid: tx.txid,
    } as PrecomposedTransactionFinalCancelRbf,
    cancelFormState: formState,
};

// good - `satisfies` checks the same shape without erasing it; if it does not compile, the type is
// wrong and that is the thing to fix - not something to assert past
const composedCancelTx = {
    ...normalLevel,
    rbfType: 'cancel',
    prevTxid: tx.txid,
} satisfies PrecomposedTransactionFinalCancelRbf;
```

**Evidence**

- G57 https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682317823 — "The casting doesn't feel right here. Can we rather use `satisfies` or add new type?"
- G86 https://github.com/trezor/trezor-suite/pull/31071#discussion_r3750108169 — guard instead of `as NetworkSymbol` (author: "done")
- G76 https://github.com/trezor/trezor-suite/pull/30910#discussion_r3721463180 — the fix-the-type variant: "wouldn't be better to fix the `sent` type or introduce new one"
- G41 https://github.com/trezor/trezor-suite/pull/28816#discussion_r3452739137 — "What about using some Zod schema for parsing of the unknown data instead of the casting?"
- VERIFIED live object-literal cast (the G57 shape, still unfixed): packages/suite/src/hooks/wallet/useEthereumCancelTxCompose.ts:105-110 — `{ ...normalLevel, rbfType: 'cancel', prevTxid: tx.txid } as PrecomposedTransactionFinalCancelRbf`
- VERIFIED the guard: suite-common/wallet-config/src/utils.ts:117 `isNetworkSymbol`; idiomatic use at suite-native/atoms/src/Badge.tsx:82-84
- VERIFIED the third tool the digest missed: suite-common/wallet-config/src/types.ts:8 `export const asNetworkSymbol = (symbol: string): NetworkSymbol => symbol as NetworkSymbol;` — 310 matching lines in `*/src/*` against 69 for `isNetworkSymbol`, so a rule naming only `isNetworkSymbol` would misfire
- VERIFIED the real parse boundary: suite-common/schemas/src/evm/fees/index.ts:37-41 `parseEvmFeeHex` (`safeParse` → `data | null`) and suite-common/http-client/src/httpClient.ts:46-58 (per-endpoint `schema` required)
- VERIFIED gap: `satisfies` appears nowhere in skills/ (only unrelated prose at skills/redux/SKILL.md:222) despite ~500 uses in src

### 4. Take `AccountWithNetworkType<T>`, not `Account`, and narrow once upstream

- **Destination** `skills/typescript/SKILL.md` (existing-add)
- **Backing** 2 review-thread-group(s) — TypeScript type safety (G40, G35)
- **Confidence** high

When code only makes sense for one network type, type its input as `AccountWithNetworkType<'tron'>` (from `@suite-common/wallet-types`) instead of `Account` or the hand-rolled `Account & { networkType: 'tron' }`. Do the "is this the right account?" check once at the boundary that produces the account, so nothing downstream needs a guard for a case that cannot happen. Cross-reference skills/defensive-programming/SKILL.md: the point of the narrower type is that the impossible branches get deleted, not defensively handled.

**Why it matters.** Passing the wide `Account` pushes the network check into every consumer: `getTronResources` returns `undefined` for every non-tron account, so `TronResourcesCard` reads every field through `?? 0` and an all-zero card is indistinguishable from a real one. With the narrowed type the redundant `getTronResources` call and its `misc?.` chain disappear, and on the ethereum variant `misc.nonce: string` becomes non-optional outright.

**Existing coverage.** skills/typescript/SKILL.md:38 "## Prefer direct type assignment to indirect" with the rationale at :56 — "Direct assignment may add an import, but it prevents the need to refactor if the `NetworkSymbol` detaches from `Account`…". Same instinct (name the precise type) but it is about importing a type rather than reaching through `Account['symbol']`; nothing in the file covers extracting a discriminated-union member.

```tsx
// bad - TronResourcesCard.tsx:17 - any Account gets in, so the card re-derives the network check
// and every read needs a fallback that hides an all-zero card
interface TronResourcesCardProps {
    account: Account;
}

const resources = getTronResources(account); // undefined for every non-tron account
const energyAvailable = resources?.availableEnergy ?? 0;

// good - the network check happens once upstream; the redundant call and chain are gone
interface TronResourcesCardProps {
    account: AccountWithNetworkType<'tron'>;
}

const energyAvailable = account.misc.tronResources?.availableEnergy ?? 0;
```

**Evidence**

- G40 https://github.com/trezor/trezor-suite/pull/28816#discussion_r3452406666 (author applied it)
- G35 https://github.com/trezor/trezor-suite/pull/28908#discussion_r3440966584 (different author, same note)
- VERIFIED suite-common/wallet-types/src/account.ts:111-112 — `export type AccountWithNetworkType<NetworkType extends AccountNetworkSpecific['networkType']> = Extract<Account, { networkType: NetworkType }>`
- VERIFIED live violation (thread unresolved): packages/suite/src/views/wallet/staking/components/TronStakingDashboard/TronResourcesCard/TronResourcesCard.tsx:17-19 — `interface TronResourcesCardProps { account: Account; }`
- VERIFIED suite-common/wallet-utils/src/tronStakingUtils.ts:49-50 — returns `undefined` unless `networkType === 'tron'`
- VERIFIED 3 remaining hand-rolled intersections vs 23 files consuming `AccountWithNetworkType`: TransactionReviewEthereumNotes.tsx:19, composeYieldWithdrawTransaction.ts:21, suite-native/staking/src/stakeFormEthereumNativeTypes.ts:6

### 5. Compare EVM addresses with `areEvmAddressesEqual`, not ad-hoc `.toLowerCase()`

- **Destination** `skills/defensive-programming/SKILL.md` (existing-add)
- **Backing** 2 review-thread-group(s) — Readability & simplification (G12, G75)
- **Confidence** high

EVM addresses reach Suite in mixed EIP-55 casing, so any equality check has to be checksum-agnostic. Use `areEvmAddressesEqual` from `@suite-common/address` instead of lowercasing at the call site, and normalize once at the parse boundary when a value is stored or passed on (two already-normalized values may then compare with plain `===`). Two boundaries: it is EVM-only (it returns `false` for bech32/base58 addresses), and it pulls viem in, so a consumer reachable from `build-connect` may keep a documented hand-rolled comparison.

**Why it matters.** A `.toLowerCase()` missing on one side compiles, type-checks and silently answers "not ours": in `isSignedByDescriptor` that mis-attributes a transaction's signer and feeds wrong EVM nonce arithmetic; in the trading approve flow it would compare against the wrong spender. Nothing fails loudly — the wrong boolean just propagates. `areEvmAddressesEqual` handles both sides and missing/invalid input, so there is nothing left to remember.

**Existing coverage.** skills/defensive-programming/SKILL.md:65 — "`[...items].sort()` and `items.slice().sort()` are workarounds for `sort` mutating in place, and they only work if you remember the copy. `toSorted`, `toReversed`, `toSpliced` and `with` return a new array, so forgetting is not an option — and forgetting matters here…" — the same argument one domain over (the shared API removes a step you can forget, and the failure surfaces far from the cause), which is why this belongs next to it. Nothing in skills/ mentions address comparison.

```ts
// bad - transactionUtils.ts:76 - drop the .toLowerCase() on either side and this silently answers
// "not our transaction" for any EIP-55 mixed-case address; the intent needs a comment to survive
const isSignedByDescriptor = (details: AccountTransaction['details'], descriptor: string) =>
    !!details?.vin?.some(
        vin =>
            vin.isAccountOwned ||
            vin.addresses?.some(address => address.toLowerCase() === descriptor.toLowerCase()),
    );

// good - checksum-agnostic and null-safe in one call, and the name states the intent
const isSignedByDescriptor = (details: AccountTransaction['details'], descriptor: string) =>
    !!details?.vin?.some(
        vin =>
            vin.isAccountOwned ||
            vin.addresses?.some(address => areEvmAddressesEqual(address, descriptor)),
    );
```

**Evidence**

- G12 https://github.com/trezor/trezor-suite/pull/27901#discussion_r3279119442 (plus the follow-up comment r3279122220 — "Or use some general method for formatting the address based on network?")
- G75 https://github.com/trezor/trezor-suite/pull/30910#discussion_r3721438603 — "what about using `areEvmAddressesEqual`?"
- VERIFIED suite-common/address/src/evmChecksumUtils.ts:10-18 — `areEvmAddressesEqual = (a?: string | null, b?: string | null): boolean` over viem `isAddress` + `isAddressEqual`, with the null-safety documented in its own comment
- VERIFIED still ad-hoc in develop: suite-common/wallet-utils/src/transactionUtils.ts:76-81 (`address.toLowerCase() === descriptor.toLowerCase()`, guarded by `vin.isAccountOwned ||`), and suite-common/wallet-utils/package.json already declares `@suite-common/address`
- VERIFIED normalize-at-the-boundary half: suite-common/calldata/src/validation/evm/address.ts:39 `normalize: (input: string) => input.toLowerCase() as EvmAddress`
- VERIFIED documented exception: networks/ethereum/network-ethereum/src/constants/wrappedNativeToken.ts:43-52 (viem would break the build-connect bundle)
- VERIFIED not mechanizable: 30 `x.toLowerCase() === y.toLowerCase()` sites repo-wide, ~9 of them non-address (browser name, token symbol, fw revision), so a lint selector cannot decide it; ~21 are a separate migration

### 6. Only call `.unwrap()` where you handle the rejection

- **Destination** `skills/redux/SKILL.md` (existing-add)
- **Backing** 1 review-thread-group(s) — Error handling & developer experience (G11)
- **Confidence** high

`dispatch(thunk())` resolves with the rejected action; adding `.unwrap()` re-throws it instead. Every `.unwrap()` must therefore sit inside a `try/catch`, inside a `useMutation` `mutationFn`, or be returned to a caller that does one of those. If you do not need the resolved value, drop `.unwrap()` and read the lifecycle state from Redux. A `catch {}` may be empty only with a comment naming the thunk that owns the error state.

**Why it matters.** An unhandled rejection from an `onClick` gives the user a button that does nothing, skips every statement after the `.unwrap()` — in the review modal that is the draft removal and the `goto` that leaves the flow — and surfaces as a context-free unhandled-rejection in Sentry instead of the error state the thunk already wrote to the store.

**Existing coverage.** skills/redux/SKILL.md:216 — "For async thunks, try to make use of the lifecycle actions whenever it makes sense… If fetching was not successful, you can explicitly modify the slice state in a relevant way" — covers the thunk-author side only; `.unwrap()` appears nowhere in skills/ (grep: zero hits).

```tsx
// bad - useTradingSellTradeActions.ts:103 - reached from onClick; nothing catches the rejected thunk,
// so the button silently does nothing and everything after the await is skipped
const addBankAccount = async () => {
    if (!selectedQuote) return;

    await dispatch(requestSellTradeThunk({ quote: selectedQuote })).unwrap();
};

// good - useMutation owns the rejection, and `mutation.error` is what renders it
const addBankAccountMutation = useMutation({
    mutationFn: (quote: SellQuote) => dispatch(requestSellTradeThunk({ quote })).unwrap(),
});
```

**Evidence**

- G11 https://github.com/trezor/trezor-suite/pull/27725#discussion_r3241245158 — "now the thunk's promise can be rejected, causing the component to crash, let's please add `try/catch` / `useMutation`"
- VERIFIED the fixed shape: packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewModal.tsx:85-101 — `.unwrap()` at :93 inside `try`, with the empty `catch` commented at :100 ("Error state is handled by signAndPushSendFormTransactionThunk.")
- VERIFIED live violation reached from a click handler: packages/suite/src/hooks/wallet/trading/useTradingSellTradeActions.ts:103-107 (`await dispatch(requestSellTradeThunk(...)).unwrap();` with no try/catch), wired at packages/suite/src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferSell/TradingOfferSellBankAccount.tsx:62 `onClick={addBankAccount}`
- VERIFIED the mutation variant: packages/suite/src/components/earn/yield/wrap/WrapNativeToken.tsx:117-125
- VERIFIED `createThunk` is RTK `createAsyncThunk` (suite-common/redux-utils/src/createThunk.ts:51), so the `.unwrap()` re-throw semantics hold; ~50 non-test `.unwrap()` call sites in packages/suite

### 7. Fail with a named error instead of returning a bare `null`

- **Destination** `skills/defensive-programming/SKILL.md` (existing-add)
- **Backing** 2 review-thread-group(s) — Error handling & developer experience (G18, G64)
- **Confidence** high

When a helper cannot produce a valid result, surface which precondition failed: a typed `Result`/discriminated variant the caller branches on for expected failures, or a `throw` whose message names the missing field for an invariant the caller cannot act on. A bare `null` return — and its harness twin, logging "skipping" and returning — is neither, and collapses several distinct failures into one indistinguishable value. Name the missing field (`fee`, `gasLimit`), never its value: these strings reach Sentry and toasts.

**Why it matters.** On the signing path a bare `null` leaves the caller able to render only "something went wrong"; nothing in the store, the log or Sentry says whether the fee data, the payload or the gas parameters were missing, so the reason has to be re-derived by bisecting the helper by hand. Because `createThunk` serializes a thrown error down to `{name, message, stack}`, the message string is the entire diagnostic that survives into the slice and the UI.

**Existing coverage.** skills/defensive-programming/SKILL.md:77 — "Unless failures are unpredictable, pass errors via `return` and do not `throw`. Throwing exceptions is not type-safe. There is a `Result` type that shall be used." This half-covers it and is why it belongs here: the sentence reads as a blanket ban on `throw`, which is exactly the reasoning that produced the `null`-returning helpers in #27718.

```ts
// bad - the pre-fix shape from #27718 - one `null` for a missing fee and for an unparsable payload
const getStablecoinYieldTransactionWithSelectedFee = (
    parsedTransaction: StablecoinYieldParsedTransactionForSigning,
    selectedFee?: EvmSelectedFee | null,
): StablecoinYieldParsedTransactionForSigning | null => {
    const parsedSelectedFee = parseEvmFeeHex(selectedFee);

    if (!parsedSelectedFee) return null;

    return { ...parsedTransaction, ...flattenEvmFees(parsedSelectedFee) };
};

// good - stablecoinYieldSigningUtils.ts:64 - the message names the missing field, so the slice,
// the toast and Sentry all say why; the return type loses `| null` with it
if (!parsedSelectedFee) {
    throw new Error('Fee information is missing for the transaction.');
}
```

**Evidence**

- G18 https://github.com/trezor/trezor-suite/pull/27718#discussion_r3287452170 — "instead of throwing errors it returns null … from DevX it'll be much harder to deduce what's wrong"; author agreed and reverted to explicit errors
- G64 https://github.com/trezor/trezor-suite/pull/30154#discussion_r3702600838 — the same note in harness form ("why skipping it … this should throw an error instead"). NOTE: this is an unpublished pending draft; the URL 404s and the file is not in the tree, so cite it as prose context only, never as a link or file:line
- VERIFIED the landed good shape: suite-common/earn-stablecoin/src/signing/stablecoinYieldSigningUtils.ts:64 `throw new Error('Fee information is missing for the transaction.');`, :101 `'Yield transaction gas parameters are missing.'`, :201 `'Unsupported yield transaction payload.'` — and the return types at :56/:197 carry no `| null`
- VERIFIED `Result` exists as the alternative: packages/type-utils/src/result.ts
- VERIFIED the outbound sink that makes the field/value distinction load-bearing: packages/suite/src/utils/suite/sentry.ts `Sentry.captureException(error)`

### 8. Extract logic both apps need into suite-common instead of duplicating it per app

- **Destination** `skills/packages/SKILL.md` (existing-add)
- **Backing** 2 review-thread-group(s) — Code placement, package boundaries & reuse (G27, G31)
- **Confidence** high

When the same derivation or hook body appears in the web/desktop app and in `suite-native`, move the platform-agnostic core into the shared layer — into the `@suite-common/*` hook that already returns the raw data, or into a `@suite-common/*` util — and leave only the platform glue (navigation, native components, desktop analytics) in each app. If a hook cannot be shared wholesale, extract the pure parts rather than copying the whole file; if nothing platform-agnostic is left, keep the duplicate and say so in a comment.

**Why it matters.** Copies drift silently. `getPollIntervalMs` was extracted to `suite-common/wallet-utils/src/pollingUtils.ts:5`, but `packages/suite` kept two local re-implementations, so the block-time-to-poll ratio now lives in three places: change the shared one and mobile plus suite's wrap/unwrap flows move while suite's Tron-stake and yield pending-tx screens silently keep the old value.

**Existing coverage.** skills/packages/SKILL.md:15 — "| @suite-common | /suite-common | code shared between @suite and @suite native | @trezor |" — the scope table declares what suite-common is _for_ but never says what to do when you notice the same logic in both apps; grep finds nothing about duplication anywhere in skills/ (nearest is skills/project-structure/SKILL.md:11, also declarative only).

```tsx
// bad - the pre-review shape from #28374 - each app re-derives the same value from raw query data
const { data } = useTronStakingStats();
const maxApr = data?.length ? Math.max(...data.map(({ apr }) => apr)) : null;

// good - useTronStakingStats.ts:17 - the shared hook derives it once, both apps just read it
export function useTronStakingStats(queryOptions?: Partial<UseQueryOptions<TrxStats>>) {
    const stats = useQuery({ staleTime: 5 * 60 * 1000, ...queryOptions, queryKey, queryFn });

    const maxApr = stats.data?.length ? Math.max(...stats.data.map(({ apr }) => apr)) : null;
    const formattedMaxApr = maxApr ? Number(maxApr.toFixed(2)) : null;

    return { stats, maxApr, formattedMaxApr };
}
```

**Evidence**

- G27 https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302426845 (author pushed back: "there is some platform specific code that made it harder" — which is why the rule is about extracting the core, not moving whole hooks)
- G31 https://github.com/trezor/trezor-suite/pull/28374#discussion_r3361541527 (landed as commit 8aeffe08cc)
- VERIFIED the landed shape: suite-common/earn-staking-api/src/staking/hooks/useTronStakingStats.ts:17-20 derives `maxApr`/`formattedMaxApr` and returns them; consumed by packages/suite/src/components/earn/modals/EarnInANutshell/TronStakeInANutshellModal.tsx:33 and suite-native/module-earn/src/components/EarnAccountCard.tsx:87
- VERIFIED the three live copies of `getPollIntervalMs`: suite-common/wallet-utils/src/pollingUtils.ts:5 (shared, also used by suite-common/wallet-core/src/stablecoin-yield/hooks/useWrappedNativePendingTx.ts:74 and suite-native/module-earn/src/hooks/useYieldPendingTransactionTracking.ts:20), vs local re-implementations at packages/suite/src/components/earn/staking/tron/hooks/useTronStakePendingTransactionTracking.ts:20 and packages/suite/src/components/earn/yield/hooks/useYieldPendingTransactionTracking.ts:35
- VERIFIED the boundary is already lint-enforced in one direction: `local-rules/no-suite-imports-in-suite-common` (packages/eslint/src/localRulesConfig.mjs)

### 9. Export one React component per file, and give an extracted hook its own file

- **Destination** `skills/components/SKILL.md` (existing-add)
- **Backing** 3 review-thread-group(s) — Component structure & file layout (G28, G61, G80)
- **Confidence** high

A file exports exactly one React component. A helper component that only this file uses still gets its own file next to it (not a shared `parts.tsx`), and a hook extracted from a component goes into `hooks/<useHookName>.ts(x)` named after the hook. The countable half of this is mechanizable — see the ESLint follow-up — so the prose carries only what a linter cannot decide: where the extracted unit goes.

**Why it matters.** The reviewer raised it on three PRs by three different authors; each time the second component or the inline hook was the part that later needed reuse or refactoring, and it was not reachable by filename or renderable in a test on its own.

**Existing coverage.** skills/components/SKILL.md:8-16 — "## 🟠 File structure / 1. ↕️ Imports … 7. 🍱 Component" — the list orders sections _within_ one file and never says a file holds exactly one component; nothing in the file mentions a `hooks/` directory or hook file naming.

```tsx
// bad - #29622 - two components in one file; the fee row is not findable by filename and cannot be
// reused or rendered in a test on its own
const CancelTransactionFeeRow = ({ title, fee, symbol }: CancelTransactionFeeRowProps) => (
    <TransactionDetailRow title={title}>{/* ... */}</TransactionDetailRow>
);

export const CancelEvmTransactionButton = ({ accountKey, transaction }: Props) => (
    <CancelTransactionFeeRow title={feeTitle} fee={fee} symbol={transaction.symbol} />
);

// good - one component per file, and the hook in hooks/ named after itself
// components/CancelEvmTransactionButton.tsx
import { CancelTransactionFeeRow } from './CancelTransactionFeeRow';
import { useCancelEvmTransaction } from '../hooks/useCancelEvmTransaction';

export const CancelEvmTransactionButton = ({ accountKey, transaction }: Props) => {
    const { fee, cancel } = useCancelEvmTransaction({ accountKey, transaction });

    return <CancelTransactionFeeRow fee={fee} symbol={transaction.symbol} onPress={cancel} />;
};
```

**Evidence**

- G28 https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302449312 — "One component per file please to make it easily readable" (reviewer later accepted a follow-up: "I still think it'd be better to divide it … but I don't push it")
- G61 https://github.com/trezor/trezor-suite/pull/29622#discussion_r3682393196 — "Let's please have single react component per file (easier to find the component, easier to refactor…)" — restated firmly two months later
- G80 https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749138330 — "Let's put it to new file with the name of the hook."
- VERIFIED the applied G80 fix: suite-native/module-accounts-management/src/hooks/useYourPositionCardYieldBadge.tsx:13 (`.tsx`, because it returns JSX-bearing values), imported by ../components/YourPositionCard.tsx
- VERIFIED nothing enforces it today: `grep -rn no-multi-comp packages/eslint/src eslint-local-rules` → 0 hits; packages/eslint/src/reactConfig.mjs:16-25 lists the enabled `react/*` rules and it is absent
- NOT VERIFIABLE IN REPO: G61's file (CancelEvmTransactionButton.tsx) — PR #29622 is still open, so cite the discussion URL only

### 10. Decide per-network behaviour from network `features`, not a symbol list

- **Destination** `skills/defensive-programming/SKILL.md` (existing-add)
- **Backing** 1 review-thread-group(s) — Single source of truth (G49)
- **Confidence** medium

Whether a coin supports a capability is declared in the `networks` config (`features: NetworkFeature[]`), so read it through `hasNetworkFeatures(account, [...])` (the default — it honours per-`accountType` overrides), `getNetworkFeatures(symbol)` for a symbol-level check, or a list derived from the config (`STAKING_SYMBOLS`, `isStakingSymbol`) when you need the whole set. Do not compare `account.symbol` against literals. A constant deliberately pinned to an external contract — e.g. the EVM spender labels copied from firmware so the approve flow cannot drift out of clear-signing — is the exception, and must carry a comment saying why.

**Why it matters.** Adding a network sets its `features` in one place, but every hardcoded `symbol === '…' || …` chain has to be found and edited by hand. Miss one and the capability silently disappears for that coin in that view — no type error, no failing test, just a coin that never shows up. The existing exhaustiveness guidance cannot help: a boolean chain type-checks perfectly while being incomplete.

**Existing coverage.** skills/defensive-programming/SKILL.md:10 — "Whenever possible, cover all cases. If a new case is added in the future, TypeScript should force the developer to set behavior for it." Same failure mode, but every technique under it is compiler-enforcement, which cannot fire on a symbol chain — hence a sibling section rather than an edit.

```tsx
// bad - useStakingTableData.ts:47 - a second list of staking coins that nothing keeps in sync with
// the network config; adding a fifth staking network silently skips this view
const stakingAccounts = accounts.filter(
    account =>
        account.symbol === 'eth' ||
        account.symbol === 'sol' ||
        account.symbol === 'ada' ||
        account.symbol === 'trx',
);

// good - the predicate is derived from `features: ['staking']`, so a new network is included for free
const stakingAccounts = accounts.filter(account => isStakingSymbol(account.symbol));
```

**Evidence**

- G49 https://github.com/trezor/trezor-suite/pull/29031#discussion_r3467403327 — author agreed ("I definitely agree… I can look at it and create follow-up PRs") and the follow-ups have not landed
- VERIFIED live violation, and the only non-test one of its shape in the repo: packages/suite/src/components/earn/dashboard/staking/hooks/useStakingTableData.ts:47-52 — a four-way `account.symbol === 'eth' || 'sol' || 'ada' || 'trx'` filter
- VERIFIED the same filter done right in the other app: suite-native/module-earn/src/hooks/useStakingListData.ts:36 `accounts.filter(acc => isStakingSymbol(acc.symbol))`
- VERIFIED the config and the derived APIs: suite-common/wallet-config/src/types.ts:99 `features: NetworkFeature[]`; suite-common/wallet-config/src/networksConfig.ts:810/:814 (`StakingNetworkSymbol`, `STAKING_SYMBOLS` derived from `features.includes('staking')`); suite-common/wallet-utils/src/stakingUtils.ts:86 `isStakingSymbol`; suite-common/wallet-utils/src/accountUtils.ts:1045 `hasNetworkFeatures` (which reads `accountTypes[accountType]?.features ?? network.features`); suite-common/wallet-config/src/utils.ts:111 `getNetworkFeatures`
- VERIFIED the firmware-pinned exception that is actually in the tree: suite-common/suite-constants/src/evm.ts `EVM_SPENDER_LABELS` ("Flattened copy of KNOWN_ADDRESSES from the firmware") — note `KNOWN_VAULTS`, which the digest cited, no longer exists

### 11. Give a name to logic the reader has to decode

- **Destination** `skills/comments/SKILL.md` (existing-add)
- **Backing** 5 review-thread-group(s) — Readability & simplification (G69, G73, G51); Component structure & file layout (G55, G63 — the render-body JSX variant of the same rule)
- **Confidence** medium

When a block needs a comment paragraph before it makes sense, or a component body assembles a `ReactNode` into a `let` through an `if / else if / else` chain, extract it into a named function or component and let early returns replace the nesting; when the same compound condition appears in two places, hoist it into a named `const`. The name is what the next reader reads instead of re-deriving the logic, and the long comment then hangs on the extracted unit rather than on a line only someone already inside the block will see. Do not extract a single-use one-liner — the trigger is concrete: a multi-line comment, or the same compound condition twice.

**Why it matters.** Four review threads stalled here, one of them with the reviewer saying they had to reconstruct the block before they could judge it — which is exactly what a reader with less context will fail to do. A duplicated compound condition additionally drifts: `EarnStakingAccountRow` had to keep two copies of the same two-status check in sync, so adding a third status would have changed one branch and not the other.

**Existing coverage.** skills/comments/SKILL.md:10 — "The best comment is usually no comment. A clear name says more than a line explaining an unclear one, so reach for a comment only when the code genuinely can't speak for itself." Its example is a variable rename (`b` → `accountBalance`), so it does not tell a reader to extract a commented block, hoist a repeated condition, or move a JSX branch chain out of a render body. Note the file's "Comment the why, not the what" section currently blesses transactionUtils.ts:175-182 as a model why-comment, so the new section is the sharpening that says where such a comment belongs.

```tsx
// bad - the pre-fix shape from #30255 - three layouts assembled into a `let` before the screen
// renders anything; the reader unwinds the chain to find the actual output
let transactionTitle: ReactNode;
if (isUnstakeTransaction) {
    transactionTitle = <UnstakeTransactionDetailTitle unstakeAmount={unstakeAmount} />;
} else if (wrapKind) {
    transactionTitle = <WrapTransactionName transaction={transaction} kind={wrapKind} />;
} else {
    transactionTitle = <TransactionName transaction={transaction} isPending={isPending} />;
}

// good - TransactionDetailTitle.tsx:21 - each case returns and is forgotten; the screen renders
// <TransactionDetailTitle /> and the name says what it is
export const TransactionDetailTitle = ({ transaction, isPending, tokenTransfer }: Props) => {
    const unstakeAmount = getUnstakeTxAmount(transaction);
    const wrapKind = getNativeWrapTxKind(transaction);

    if (unstakeAmount !== undefined) {
        return <UnstakeTransactionDetailTitle unstakeAmount={unstakeAmount} />;
    }

    if (wrapKind) {
        return <WrapTransactionName transaction={transaction} kind={wrapKind} />;
    }

    return <TransactionName transaction={transaction} isPending={isPending} />;
};
```

**Evidence**

- G69 https://github.com/trezor/trezor-suite/pull/30028#discussion_r3711981075 — "It took me a while to digest this piece, I'd move it to `getPoolDelegation` with early `return` avoiding nesting." (applied)
- G73 https://github.com/trezor/trezor-suite/pull/30910#discussion_r3721407524 — "what about wrapping it to new fn so it's easily digestible (for other readers) by the fn name and if needed then the long comment?" (not applied; naming point unrebutted)
- G51 https://github.com/trezor/trezor-suite/pull/29031#discussion_r3467480205 — "there's same condition for this and the case above, what about putting it into some var?" (applied as `apyAvailable`)
- G55 https://github.com/trezor/trezor-suite/pull/30255#discussion_r3682093502 — "To maintain the render method readability, I'd suggest move this to new component and doing early returns" (applied by the PR author)
- G63 (#30154) — same note on new instrumentation in Main.tsx; an unpublished pending draft, so not citable and not counted as independent corroboration
- VERIFIED applied fixes: suite-native/module-transactions/src/components/TransactionDetailTitle.tsx:21-52 (early returns at :29 and :39, fallthrough at :49), rendered from screens/TransactionDetailScreen.tsx; packages/suite/src/actions/wallet/stake/stakeFormCardanoActions.ts:313-320 (`getPoolDelegation` with `if (stakeType !== 'stake') return undefined;`); packages/suite/src/components/earn/dashboard/staking/EarnStakingAccountRow.tsx:297-299 (`apyAvailable`, reused at :325 and :424)
- VERIFIED the un-extracted case still in develop: suite-common/wallet-utils/src/transactionUtils.ts:175-182 — a 6-line comment followed by an inline `while` loop
- VERIFIED gap: the contribution guide's own readability example, skills/skills-and-code-style-contribution/rule-template.md:60 "Return early instead of nesting the happy path", has no home in any SKILL.md

### 12. Let callers pass `queryOptions` into a shared query hook, never overwrite them

- **Destination** `NEW skills/data-fetching/SKILL.md` (new-skill)
- **Backing** 1 review-thread-group(s) — Data fetching — prefer TanStack Query (G21)
- **Confidence** medium

A query hook in `suite-common` is consumed by both apps, whose needs differ per screen (`enabled`, `staleTime`, `select`). Accept a caller options object as the second parameter, type it as `Omit<UseQueryOptions<…>, 'queryKey'>` so no caller can break the query identity, spread it before `queryKey`/`queryFn`, and express the hook's own condition as a destructuring default (`{ enabled = Boolean(account), ...rest }`) rather than assigning after the spread. A hook local to `packages/suite` or a `module-*` package has one consumer and needs no options parameter.

**Why it matters.** Assigning `enabled` after `...queryOptions` silently discards what the caller asked for, so a screen that disabled the query still fires it for an account it is not showing; dropping the parameter entirely forces the second consumer to fork the hook.

**Existing coverage.** skills/components/SKILL.md:67 "## Prop drilling and identifiers" and skills/packages/SKILL.md:19 "## Packages size" are the nearest structural rules, and neither mentions hooks or query options; nothing in skills/ states how a shared hook exposes configuration.

```tsx
// bad - useSolanaRewardsTotal.ts:11 - the caller's `enabled` is spread in, then overwritten
export function useSolanaRewardsTotal(account: Account, queryOptions?: RewardsQueryOptions) {
    return useQuery({
        ...queryOptions,
        enabled: account.symbol === 'sol',
        queryKey: commonQueryKeys.solanaRewardsTotal(account.descriptor),
        queryFn: () => getSolanaRewardsTotal({ routeParams: { address: account.descriptor } }),
    });
}

// good - useEthereumValidatorsQueue.ts:13 - the hook's condition is only the caller's default, and
// `queryKey` is omitted from the options so no caller can break the query identity
export function useEthereumValidatorsQueue(
    { account, timestamp }: UseEthereumValidatorsQueueProps,
    {
        enabled = Boolean(account),
        ...restQueryOptions
    }: Omit<UseQueryOptions<EthValidatorsQueue>, 'queryKey'> = {},
) {
    return useQuery({
        staleTime: 60 * 1000, // 1 minute
        ...restQueryOptions,
        enabled,
        queryKey: commonQueryKeys.validatorsQueue(account?.key, timestamp),
        queryFn: () => getEthereumValidatorsQueue({ params: { timestamp } }),
    });
}
```

**Evidence**

- G21 https://github.com/trezor/trezor-suite/pull/27829#discussion_r3288598035 — "This is general hook and the usage might vary in suite and suite-native" (PR no longer accessible on GitHub)
- VERIFIED the reviewer's shape is what shipped: suite-common/earn-staking-api/src/staking/hooks/useEthereumValidatorsQueue.ts:13-27 — `enabled = Boolean(account)` destructuring default at :16, `Omit<UseQueryOptions<…>, 'queryKey'>` at :18-21, spread before `queryKey` at :23-27
- VERIFIED live silent-drop defect: suite-common/earn-staking-api/src/staking/hooks/useSolanaRewardsTotal.ts:11-14 spreads `...queryOptions` then hard-codes `enabled: account.symbol === 'sol'`, so a caller's `enabled: false` is ignored
- VERIFIED third instance: suite-common/earn-staking-api/src/staking/hooks/useTronStakingStats.ts:8 (`queryOptions?: Partial<UseQueryOptions<…>>`, spread before queryKey)
- VERIFIED the type is re-exported for this purpose: suite-common/react-query/src/index.ts

### 13. Type test fixtures with `satisfies`, not `as unknown as`

- **Destination** `skills/tests/SKILL.md` (existing-add)
- **Backing** 2 review-thread-group(s) — TypeScript type safety (G24, G25)
- **Confidence** medium

Already stated in the tests skill, but it needs three sharpenings: name the replacement (`satisfies`, and `satisfies Omit<T, 'field'>[]` / `satisfies Pick<T, …>` for a deliberately partial fixture), say `as unknown as` explicitly since that is the form actually in the tree, and carve out the legitimate exceptions — a cast on a branded primitive (`'eth-account-key' as AccountKey`), and `} satisfies T as unknown as T` for a fixture that is structurally complete but nominally incompatible.

**Why it matters.** `as unknown as` disables checking for every field inside, so renaming or retyping a field in `Account`/`TokenInfo` leaves the fixture compiling and the test asserting on a shape production no longer produces — the failure surfaces later as a mysterious assertion, not a type error at the fixture.

**Existing coverage.** skills/tests/SKILL.md:85-87 — "All fixtures and mocks shall be typed and declaratively defined; using `as` to cast an incomplete object is only a last resort. This may add boilerplate, but it ensures type changes surface as type errors instead of hard-to-fix failing tests." It gives the principle and the consequence but no API to reach for, says `as` rather than `as unknown as`, and carves out no exception.

```ts
// bad - useSubscribeForSolanaBlockUpdates.test.ts:19 - the double cast turns off checking for every
// field inside, so a renamed Account field keeps compiling here
const solanaAccount = {
    key: 'sol-account-1',
    symbol: 'sol',
    networkType: 'solana',
} as unknown as Account;

// good - the complete parts stay checked; only the outer shape remains a last-resort cast
const tokens = [{ contract, symbol: 'USDC', decimals: 6, balance: '25' }] satisfies Omit<
    TokenInfo,
    'standard'
>[];
```

**Evidence**

- G24 https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302343773 — "at least partial type validation might be a good idea via `satisfies`"
- G25 https://github.com/trezor/trezor-suite/pull/27718#discussion_r3302376413 — suggested `] satisfies Omit<TokenInfo, 'standard'>[],` (applied; useResolvedYieldFlowData.test.ts now carries exactly that, so it is the _good_ example, not the bad one)
- VERIFIED live offender to use as the bad example: suite-native/transaction-management/src/hooks/useSubscribeForSolanaBlockUpdates.test.ts:19-24 — `{ key: 'sol-account-1', symbol: 'sol', networkType: 'solana' } as unknown as Account`
- VERIFIED the suggestion compiles: packages/blockchain-link-types/src/common.ts:313-328 — `TokenInfo` requires only `standard`, `contract`, `decimals`
- VERIFIED the exception is unavoidable: suite-common/wallet-types/src/account.ts:134 — `AccountKey` is a branded template literal
- VERIFIED scale: 145 test/mock/fixture files vs 23 source files contain `as unknown as` across packages/suite/src, suite-common and suite-native

### 14. Call the narrowest query hook for what you render

- **Destination** `NEW skills/data-fetching/SKILL.md` (new-skill)
- **Backing** 1 review-thread-group(s) — Data fetching — prefer TanStack Query (G83)
- **Confidence** medium

When a hook exists for the single record a component renders, do not call the list hook and filter client-side. Narrow the shape with the query's `select`, not with a wider fetch. The list hook is right when the screen genuinely renders the list; the rule is about a per-item component (or a per-item hook) reaching for it.

**Why it matters.** The wide call sits in code that runs once per row, and every consumer shares the one list cache key, so any invalidation refetches all `YIELD_OPPORTUNITIES_DEFAULT_LIMIT` (100) records for all of them; the narrow hook scopes both the request and the invalidation to the vault actually on screen.

**Existing coverage.** skills/performance-react-hooks/SKILL.md:71 — "Narrower than the containing object, never wider than the closure: `accountKey`, not `account`" — the same instinct one layer down (dependency arrays), which is why the network-level version does not belong in that file.

```tsx
// bad - #30994 - one badge per token row, each pulling the whole 100-vault list for one APY
const { data: yieldOpportunities } = useAllYieldOpportunities();
const vault = yieldOpportunities?.find(opportunity => opportunity.id === vaultId);

// good - YieldBadge.tsx:52 - one request per vault, cached under its own key
const { data: vault } = useYieldOpportunity(vaultId);
```

**Evidence**

- G83 https://github.com/trezor/trezor-suite/pull/30994#discussion_r3749155737 — "Let's use useYieldOpportunity instead of useAllYieldOpportunities" (@TomasBoda: "done")
- VERIFIED adopted: suite-native/module-earn/src/components/YieldBadge.tsx:5 imports `useYieldOpportunity` and :52 calls `useYieldOpportunity(vaultId)`
- VERIFIED the defect still recurs one level up: suite-native/module-accounts-management/src/hooks/useYourPositionCardYieldBadge.tsx:18 still calls `useAllYieldOpportunities()` from a per-item hook
- VERIFIED the wide hook's page size: suite-common/earn-stablecoin-api/src/config/index.ts:1 `YIELD_OPPORTUNITIES_DEFAULT_LIMIT = 100`; the narrow hook with its `select` parameter is suite-common/earn-stablecoin-api/src/hooks/useYieldOpportunity.ts
- VERIFIED separate cache keys: suite-common/react-query/src/constants/queryKeys.ts:15 `yieldOpportunity` vs :16 `yieldOpportunitiesList`

### 15. Pick the ref hook by when `.current` is read

- **Destination** `skills/performance-react-hooks/SKILL.md` (existing-add)
- **Backing** 1 review-thread-group(s) — React hooks & effects (G10)
- **Confidence** medium

Already stated, but buried and unexemplified. Choose by the moment the value is read: `useFreshRef` assigns during render, so `.current` is the newest value and it is the only correct choice when the ref is read in render or inside a `useMemo`; `useCurrentRef` assigns in an effect keyed on the value. Neither holds the _previous_ value — and `useCurrentRef` does not either inside a later effect, because its own effect is declared first and has already run. For a transition test ("was set, is now cleared") use a plain `useRef`, read it at the top of the effect and assign it on the last line.

**Why it matters.** Reaching for either helper when previous-value semantics are needed makes the transition condition `prevRef.current && !value` permanently false, so the effect's branch never runs — a silent no-op with no lint error and no crash. In `TransactionReviewModalBody` that branch is what clears `isSending` after a failed push; if it never fires, the expired-tx "Try again" button stays blocked and the user is stuck in the review modal.

**Existing coverage.** skills/performance-react-hooks/SKILL.md:127-131 — "`useFreshRef` assigns during render, so `.current` is always the newest value; it is the only correct choice when the ref is read in render or inside a `useMemo`. `useCurrentRef` assigns in an effect, so during render `.current` still holds the last committed value. Neither tracks the previous value — for that, assign a plain `useRef` at the end of the effect."

```tsx
// bad - the reviewer's suggestion on #27725 - `useFreshRef` assigns during render, so `.current` is
// already the new `serializedTx` when the effect runs and the transition is never detected
// (`useCurrentRef` fails the same way: its own effect is declared first and has already assigned)
const serializedTxRef = useFreshRef(serializedTx);

useEffect(() => {
    if (serializedTxRef.current && !serializedTx && isSending) {
        setIsSending(false);
    }
}, [isSending, serializedTx, serializedTxRef]);

// good - TransactionReviewModalBody.tsx:59 - a plain ref, read first and assigned last, is the only
// shape that holds the previous value
const prevSerializedTxRef = useRef(serializedTx);

useEffect(() => {
    if (prevSerializedTxRef.current && !serializedTx && isSending) {
        setIsSending(false);
    }

    prevSerializedTxRef.current = serializedTx;
}, [isSending, serializedTx]);
```

**Evidence**

- G10 https://github.com/trezor/trezor-suite/pull/27725#discussion_r3241224796 — the reviewer suggested `useFreshRef`, then `useCurrentRef`; both were wrong for this call site and the author's plain `useRef` was correct, which is why the rule is a selection criterion and not "prefer the helper"
- VERIFIED packages/react-utils/src/hooks/useFreshRef.ts:14-15 (assigns during render) vs packages/react-utils/src/hooks/useCurrentRef.ts:16-18 (assigns inside `useEffect(…, [value])`)
- VERIFIED the shipped previous-value pattern: packages/suite/src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewModalBody.tsx:59 (`useRef(serializedTx)`), read at :67, reassigned at :70 as the last statement of the effect, with the blocked-button rationale commented at :63-65
- VERIFIED the distinction is live, not theoretical: 33 `useCurrentRef(` call sites in packages/suite (e.g. useYieldFlow.ts:149, useAllowanceModal.ts:94-97)
- VERIFIED current placement: skills/performance-react-hooks/SKILL.md:127-131, inside `## Never add a new eslint-disable for exhaustive-deps` (:118) and wedged mid-paragraph between suppression advice and dependency-stability advice

## Edits to existing files

### `skills/defensive-programming/SKILL.md`

_add four sections and disambiguate one existing heading_

Add: (1) "Do not substitute a placeholder for a missing value" (rank 1) — and rename the existing "## Do not fall back to default" to "## Do not fall back to a default case", or the two read as duplicates in the table of contents; (2) "Compare EVM addresses with areEvmAddressesEqual" (rank 5), placed right after "Prefer the non-mutating array methods" whose argument it reuses; (3) "Fail with a named error instead of returning a bare null" (rank 7) as a `###` nested INSIDE "## Do not use exceptions" (:75), not a sibling — the two are in direct tension and a sibling heading reads as a contradiction; while there, add the missing consequence to :77 and state that the ban on `throw` does not license `| null` return types (a bare null is not a Result — packages/type-utils/src/result.ts); (4) "Decide per-network behaviour from network features" (rank 10) as a sibling after the exhaustiveness section. NOTE: three of these four are domain-specific (addresses, networks, signing) while the file's existing rules are all language-level, so widen the frontmatter description accordingly — as written ("...or when sorting, reversing or splicing an array") none of its triggers fire for a reader about to write `?? ''` or `symbol === 'eth' ||`.

### `skills/typescript/SKILL.md`

_add two sections_

Add "Replace an `as` cast with `satisfies`, a guard, a parse, or a better type" (rank 3) directly after "## Prefer `unknown` to `any`" (:20), so the hand-written type guard at :26-34 and its scaled-up forms (guard / asNetworkSymbol / zod schema) sit together; and "Take AccountWithNetworkType<T>, not Account" (rank 4) after "## Prefer direct type assignment to indirect" (:38). Keep the second one's example in `interface` form to match the real TronResourcesCard.tsx:17 (the file's own last section prefers types to interfaces, so convert it in the good half rather than silently rewriting the quoted bad half).

### `skills/comments/SKILL.md`

_add one section_

Add "Give a name to logic the reader has to decode" (rank 11) after "## Prefer self-documenting code", covering all three vehicles: extract a commented block into a named function with guard clauses, hoist a twice-used compound condition into a named const, and move a render-body `let` + if/else-if JSX chain into its own component with early returns. Reconcile it with "## Comment the why, not the what", which currently reads as blessing the un-extracted transactionUtils.ts:175-182 case.

### `skills/components/SKILL.md`

_add one section, sharpen one, add one cross-reference_

Add "Export one React component per file, and give an extracted hook its own file" (rank 9), stating only what lint cannot decide: the extracted component gets its own file (not a shared parts.tsx) and the hook goes to hooks/<useHookName>.ts(x). Add a one-line cross-reference from "## Component structure" step 7 (Render) to the new comments/ section for the JSX-branch-chain case, and to skills/performance-react-hooks/SKILL.md:31 which already names a child component as a destination for render-body work. Sharpen "## Prop drilling and identifiers" (:69) only to the extent of noting that passing the identifier does not mean the child owns the null branch — see disputes; I am not adding the full nullability-upstream rule.

### `skills/redux/SKILL.md`

_add one subsection_

Add "Only call `.unwrap()` where you handle the rejection" (rank 6) as a `###` inside the existing "## Thunks" section, after the bullet list ending at :217 and before "### State and dependency contracts" (:219) — a new `## ` heading would terminate the Thunks section rather than extend it. State the empty-catch convention (a comment naming the thunk that owns the error state, as at TransactionReviewModal.tsx:100) and correct the reviewer's own framing: an unhandled async rejection is NOT caught by the error boundary (packages/suite/src/support/suite/ErrorBoundary.tsx wraps react-error-boundary, render/lifecycle only), so do not write "the component crashes".

### `skills/tests/SKILL.md`

_sharpen existing text at :85-87_

Rewrite the fixture-typing sentence to name `satisfies` (and `satisfies Omit<T, 'field'>[]` / `Pick<T, …>` for partial fixtures), to say `as unknown as` explicitly since that is the form in the tree, and to carve out the two legitimate exceptions (branded primitives like `as AccountKey`; `} satisfies T as unknown as T` where a fixture is structurally complete but nominally incompatible). Use suite-native/transaction-management/src/hooks/useSubscribeForSolanaBlockUpdates.test.ts:19-24 as the bad example — NOT useResolvedYieldFlowData.test.ts, which already carries the applied fix.

### `skills/performance-react-hooks/SKILL.md`

_promote and exemplify existing text at :127-131_

Move the three ref-hook sentences out of "## Never add a new eslint-disable for exhaustive-deps" into their own heading ("## Pick the ref hook by when .current is read") next to "## Keep hook dependencies referentially stable" (:45); add the verified bad/good pair from TransactionReviewModalBody.tsx:59-71; add the consequence (a silently dead effect branch, no error); and add the mechanism the current text omits — `useCurrentRef` fails inside a later effect not because of render timing but because its own effect is declared first and has already assigned, which is what took three review round-trips to establish.

### `skills/packages/SKILL.md`

_add one section and widen frontmatter_

Add "Extract logic both apps need into suite-common instead of duplicating it per app" (rank 8) after the scope table, with the platform-glue boundary stated explicitly (only the part free of platform APIs moves; if nothing platform-agnostic is left, keep the duplicate and say so). Widen the frontmatter description, which currently triggers only on "creating new packages or resolving cyclic dependencies" — a reader noticing the same derivation in both apps is doing neither. skills/project-structure ("Use when navigating the codebase or deciding where to place new code") is the closer trigger match today, so cross-link from there.

### `packages/eslint/src/reactQueryConfig.mjs`

_config follow-up, not a skill change_

`@tanstack/query/no-rest-destructuring` (which catches `{ ...queryResult }`, the whole of harvest group G43) is only `warn` upstream, so it currently depends on `--max-warnings 0`; pin it to `error`. Separately, the plugin's import detector only recognises `@tanstack/*-query` sources, and repo code imports `useQuery` from the `@suite-common/react-query` re-export, so detection falls back to the type-checked path which local runs disable via `disableTypeChecked` — the whole plugin is effectively inert locally for wrapper imports and a developer only learns in CI.

### `packages/eslint/src/reactConfig.mjs`

_config follow-up, not a skill change_

Enable `react/no-multi-comp` (its `ignoreStateless` option already defaults to false, so the bare rule suffices) to mechanize the countable half of the one-component-per-file rule. Expect a large existing-code backlog — land it as `warn` first or scope it to suite-native. Also consider `@typescript-eslint/consistent-type-assertions` with `objectLiteralTypeAssertions: 'never'`, which mechanizes both the object-literal half of the `as`-cast rule (e.g. useEthereumCancelTxCompose.ts:105) and most of the 145 fixture files using `as unknown as` — land it as one config change, not two.

## Deliberately not turned into rules

- **Resolve `null`/`undefined` above the component, not inside it (nullability G81+G82)**  
  Fails the recurrence bar — two threads, but one PR and one author — and the consequence is structural, not correctness. It would also require rewriting two existing rules that currently point the other way (components/SKILL.md:69 prescribes exactly the accountKey-in, select-in-child shape the reviewer rejected, and basic-syntax/SKILL.md:139-143 presents `if (!value) return null` inside the component as the good shape), which is a lot of churn for one conversation. The verified residue — useYourPositionCardYieldBadge.tsx:7-11 still takes `account?: Account | null` and re-widens with `?? undefined` at :20, leaving a dead `if (!symbol) return null;` at YourPositionCard.tsx:48, a pointless `account?.formattedBalance` at :52 and a dead `account &&` at :73 — is a code cleanup, not a standard.

- **Import a package's section entry point, never a flattened root barrel (code-placement G16)**  
  The pattern has a sample size of one and its sibling in the same allowlist contradicts it: `@suite-common/earn-stablecoin-api` is registered in `packagesWithSectionEntryPoints` (packages/eslint/src/localRulesConfig.mjs:44) yet I verified it DOES have a root src/index.ts re-exporting services, config, verification, five hooks and context, with 72 root imports and zero deep imports. Only `@suite-common/earn-stablecoin` actually has no root barrel. Writing "never a flattened root barrel" would ship a rule the repo visibly contradicts; the cited cyclic-dependency rationale is also unsourced (the commit that created the pattern, d78e143701, gives no reason). Needs a team decision first.

- **Parse untrusted data with a Zod schema instead of casting, as a standalone section (runtime-validation G41+G59)**  
  The evidence does not support the rule as stated — see disputes. I verified `EvmGasParamsGweiSchema` has exactly two references in src (its own declaration at suite-common/schemas/src/evm/fees/index.ts:26 and the `z.infer` at :32) and is never `safeParse`d, so the commit cited as proof (ddc68e61f1) introduced no runtime validation at all; the value it cast was already fully typed, not `unknown`. Kept only as one clause of the `as`-cast rule (rank 3), citing the two honest boundary examples: `parseEvmFeeHex` and http-client's per-endpoint `schema`.

- **Don't spread a TanStack Query result into a new object (CI/tooling G43)**  
  Generalizable and high-consequence, but already decided by a linter: `@tanstack/query/no-rest-destructuring` ships in `flat/recommended-strict`, enabled at packages/eslint/src/reactQueryConfig.mjs:10. Repo convention (skills/skills-and-code-style-contribution/rule-template.md:8-11) sends anything a linter can decide to the ESLint config. Carried forward as a config follow-up instead.

- **Prefer the non-mutating array methods to copy-then-mutate (readability G68)**  
  Fully covered already. skills/defensive-programming/SKILL.md:63-73 names the replacement APIs, the consequence and why nothing catches it, and I confirmed the G68 site was fixed (suite-common/wallet-utils/src/cardanoStakingUtils.ts:111 now reads `pools.toSorted(...)`). The review note predates the written section by a week, so it is not evidence the rule is being ignored. No change needed.

- **Represent a multi-state flow as one status field, not a fistful of booleans (readability G26)**  
  One thread, one PR, no cited bug, and half-covered by skills/naming/SKILL.md:22 ("perhaps it would be better to pick another data type, like an `enum`"). Worth promoting only if more instances turn up in a later harvest.

- **Delete a `switch` whose every case returns the same value (readability G37); prefer `.filter` over `if/else` inside `.map` (G14); share a type between two adjacent builders (G29); use design-system primitives instead of copy-pasted `prepareNativeStyle` (G79)**  
  All one-off NITs on single PRs with no stated failure mode, and G79's comment was itself a joke, so no standard was asserted. G37 is the one item here a lint selector could decide (a SwitchStatement whose cases have identical bodies) — if anyone wants it, it belongs in packages/eslint, not prose.

- **Derive a type predicate from the lookup table instead of re-listing its keys (typescript G01+G02)**  
  Crisp and with a real drift consequence, but one PR, one author, and the blast radius is a missing UI label rather than correctness. The "let the compiler force coverage" idea is already the theme of skills/defensive-programming/SKILL.md:10-61. The reviewer's own first suggestion (`Object.keys(...).includes(...)`) does not narrow at all, which is a further reason not to canonize the thread.

- **Ambient-declaration plumbing: `export {}` vs a .d.ts rename (G34); the `declare module 'redux'` Dispatch augmentation (G62); a non-empty tuple type instead of `@ts-expect-error` for noUncheckedIndexedAccess (G42)**  
  None reached an agreed answer. G34 ends on a question, G62 got no reply, and G42 explicitly failed to land — the author tried the real fix (`[FeeLevel, ...FeeLevel[]]`), found it too invasive and rolled back. A reply that reverts the change is evidence against a rule.

- **Improve `createHttpClient` instead of annotating every endpoint's return type (G54); move wallet-core thunks that don't depend on wallet-core into the domain package (G19); debug-settings selector placement (G33); tree-like folder structure for suite-native (G23); mirror the common/evm sub-package split in tx-simulation (G20)**  
  All prescribe refactors nobody executed. The per-endpoint annotations are still in suite-common/earn-stablecoin-api/src/services/yieldxyz.ts, the thunks are still exported from suite-common/wallet-core/src/index.ts, and G23 was explicitly refused by the author on behalf of the mobile team while the flat layout remains the majority. G19's argument is already made at skills/packages/SKILL.md:31. Writing these up would document intentions, and in G23's case would put the guide in conflict with most of the code — per skills/skills-and-code-style-contribution/SKILL.md that belongs in a `proposal`-labelled issue first.

- **Fetch constants from the yield worker instead of hardcoding them (G09); don't reference a constant another PR is deleting (G07); justify each validation constraint in a low-level converter (G32)**  
  G09's outcome was the opposite of the note — the hardcoded copy was deliberately retained so the approve flow cannot drift out of clear-signing, and that outcome survives as the exception clause of the network-features rule (rank 10), now anchored to `EVM_SPENDER_LABELS`, since the `KNOWN_VAULTS` the digest cited no longer exists in the tree. G07 is PR sequencing, and the API it suggested was not even the one adopted. G32 is an unresolved design debate that names no replacement.

- **Keep the assumed-role AWS session short and assume it after the long work (CI G52+G53); enable instrumentation logging behind a --debug flag (G65)**  
  G52/G53 are the same line of the same workflow in one PR, the signal reviewer argued FOR the longer duration, and the thread resolved structurally via a different PR — plus no skill covers GitHub Actions authoring and one discussion cannot justify inventing one. G65 is a feature suggestion on an open PR, never submitted, and the swallowing it objects to is already annotated in the code.

- **Narrow with the query's `select` as a rule of its own (G58)**  
  The reviewer's own comment is self-deflating ("NIT (ignore if you will)… I guess there's no advantage compare to this solution"), names no consequence, and the thread is outdated with no reply. Survives as one clause inside the narrowest-hook rule.

## Where the audit overrode the first pass

### Whether "parse untrusted data with a Zod schema instead of casting" is a standalone rule

- **First pass** Keep it as a new `## ` section in skills/typescript/SKILL.md, confidence medium, on the strength of G41 plus commit ddc68e61f1 "the note was acted on".
- **Audit** verdictHolds: false — the cast was on an already-typed parameter, not `unknown`; the commit added no runtime validation; a reader following the rule would add a `safeParse` the real fix does not contain. Recommends rewriting into two narrower rules (don't write a guard that narrows to a closed object literal; derive a shared named type via z.infer).
- **Resolution** Sided with the audit on the facts, but rejected both of its replacement rules and folded the surviving idea into the `as`-cast rule (rank 3) as one clause of a four-option replacement menu.
- **Basis** I verified the audit's decisive point myself: `grep -rn EvmGasParamsGweiSchema` over src returns exactly two hits — the declaration at suite-common/schemas/src/evm/fees/index.ts:26 and the `z.infer` at :32 — so nothing ever parses with it. The audit's two proposed replacements each rest on one thread and one author and clear neither the recurrence nor the consequence bar, so promoting them would just relocate the weakness. But schema-parsing at a genuine boundary IS supported by the repo (parseEvmFeeHex's safeParse, createHttpClient's mandatory per-endpoint schema), and G59's reviewer offered `?.` as an equally acceptable alternative, so it belongs as one option among several rather than as its own directive.

### Which existing skill hosts "give a name to logic the reader has to decode"

- **First pass** skills/basic-syntax/SKILL.md, nearest text being :28 "Try to use empty lines as a tool for structuring the code even better."
- **Audit** skills/comments/SKILL.md — the rule's own trigger ("an inline block needs a comment paragraph") is a comment-placement judgement, and comments/SKILL.md:10 states the actual principle; basic-syntax is syntax and layout.
- **Resolution** Followed the audit (comments/), and additionally merged the separate component-structure rule "Extract a branching JSX block into its own component with early returns" into it rather than keeping two sections.
- **Basis** I read both files: basic-syntax:28 is about blank lines between statement groups, and the file's other sections are brace style, parameter wrapping and JSX truthiness — extraction is none of those. comments/SKILL.md:10 is the real principle, and hosting it there also forces the reconciliation the audit spotted: "Comment the why, not the what" currently reads as blessing the un-extracted transactionUtils.ts:175-182 case. The merge is mine, not either input's: the JSX rule lost half its evidence in audit (G63 is an unpublished draft whose URL 404s, and the corroborating commit 38983ebd46 turns out to be authored by the PR author complying, not by a third party), so on its own it is one instance of readability advice — but it is the same underlying move as G69/G73/G51, so it survives as a scenario inside one section with a cross-reference from components/.

### Destination kind for the test-fixture rule

- **First pass** existing-covered (skills/tests/SKILL.md:85), i.e. no change needed — while its own notes simultaneously listed three gaps to fix.
- **Audit** existing-covered + needs sharpening: the sentence gives the principle and the consequence but names no replacement API, says `as` where the tree has `as unknown as`, and carves out no exception.
- **Resolution** existing-add (a sharpening edit to :85-87), and swapped the codeExample per the audit.
- **Basis** The digest's own notes contradict its field, and the audit is right that a reader following the current text cannot tell that `satisfies Omit<TokenInfo, 'standard'>[]` is the move. The example swap is load-bearing: the digest labelled useResolvedYieldFlowData.test.ts as the offender, but the audit found it already carries the applied fix — publishing it as "bad" would ship a stale citation on day one. I used the live offender instead (useSubscribeForSolanaBlockUpdates.test.ts:19-24, which I read and verified).

### Which API replaces an ad-hoc `as NetworkSymbol` cast

- **First pass** The `isNetworkSymbol` type guard, described as "already the repo idiom".
- **Audit** False as stated — suite-common/wallet-config/src/types.ts also exports `asNetworkSymbol`, a sanctioned wrapper for exactly this conversion, called ~298 times against 63 `isNetworkSymbol` references; the prose must split guard-vs-wrapper or it misfires on most remaining sites.
- **Resolution** Adopted the audit's three-way split (guard where there is a fallback, `asNetworkSymbol` at a parse boundary, `satisfies` when constructing) and added the zod/parse case as a fourth.
- **Basis** I verified both halves myself: types.ts:8 (not :7 as first reported) is `export const asNetworkSymbol = (symbol: string): NetworkSymbol => symbol as NetworkSymbol;`, with 310 matching lines in src against 69 for `isNetworkSymbol`. A rule that names only the guard would be ignored or disabled at the majority of sites, which is exactly how a skill entry dies.

### The stated consequence of an unhandled `.unwrap()` rejection

- **First pass** "the error boundary unmounts the subtree, so a device rejection blanks the review modal mid-flow" (echoing the reviewer's "causing the component to crash").
- **Audit** The mechanism is wrong — react-error-boundary catches render/lifecycle errors only, not a promise rejection from an async onClick. Real consequences: a button that silently does nothing, every statement after the await skipped, and a context-free unhandled rejection in Sentry.
- **Resolution** Rewrote the why-clause to the audit's version, keeping the rule and its destination.
- **Basis** The audit's reasoning is sound on how error boundaries work, and the concrete cost it identifies is checkable in the cited file: TransactionReviewModal.tsx:95-97 removes the send-form draft and navigates away after the `.unwrap()`. Hand-check correction to both agents: the file now wraps that in `try { … } catch {}` at :99-100 with the comment “Error state is handled by signAndPushSendFormTransactionThunk”, so G11's note was acted on — this site is the _good_ example now, not a live defect, and the section must not present it as one. Shipping the crash claim would get the rule discounted by the first reader who tests it.

### Whether `getPollIntervalMs` drift affects only mobile

- **First pass** "a one-place change silently applies to mobile only".
- **Audit** Wrong — the shared util also reaches packages/suite through suite-common/wallet-core/src/stablecoin-yield/hooks/useWrappedNativePendingTx.ts, consumed by suite's wrap/unwrap flows.
- **Resolution** Adopted the audit's phrasing.
- **Basis** I ran the grep: the shared `pollingUtils.ts:5` is imported by useWrappedNativePendingTx.ts:74, suite-native/module-earn/src/hooks/useYieldPendingTransactionTracking.ts:20 and useNavigateAfterPushedTransaction.ts:89, while packages/suite keeps two local re-implementations (useTronStakePendingTransactionTracking.ts:20, useYieldPendingTransactionTracking.ts:35). So the split is per-screen inside suite, not per-app, which is a sharper argument for the rule than the digest's.

### Whether the areEvmAddressesEqual example can be quoted as-is

- **First pass** A bad/good pair at transactionUtils.ts:80 showing only the `.toLowerCase()` comparison.
- **Audit** The snippet is doctored — it drops the `vin.isAccountOwned ||` short-circuit and the 3-line comment at :73-75 that already documents the case-insensitivity; swapping it as shown would change behaviour.
- **Resolution** Kept the rule at rank 5 but rewrote the example to include `isAccountOwned ||`, and made the point that the helper replaces the comment rather than the guard.
- **Basis** I read :70-95 and the audit is exactly right: the deliberate comment is there, so the honest argument is not "nobody thought about casing here" but "the intent needs a paragraph to survive, and the helper's name carries it instead". I also flagged the audit's further finding for whoever writes the section: suite-common/calldata/src/validation/evm/address.ts normalizes at :39 yet still compares ad-hoc at :18/:29, so the section must say what to do after normalization or that file reads as a counter-example.
