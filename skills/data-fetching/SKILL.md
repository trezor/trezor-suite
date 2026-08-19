---
name: data-fetching
description: TanStack Query conventions for Trezor Suite — fetching with useQuery instead of an effect that dispatches a thunk, when useMutation is the right tool, central query keys, letting callers pass queryOptions into a shared hook, and calling the narrowest hook. Use when a screen needs to load data, when writing a query hook in suite-common, or when you find yourself mirroring loading or error state into useState.
---

# Data Fetching

Everything here is about `@tanstack/react-query`, which both apps use. The rules are the ones a linter cannot
decide — [`reactQueryConfig.mjs`](../../packages/eslint/src/reactQueryConfig.mjs) already enables
`flat/recommended-strict`, so the query's own `exhaustive-deps`, rest-destructuring and mutation property
order are mechanized and are not restated below.

## Fetch with `useQuery`, not an effect that dispatches and mirrors state

Data a screen needs as soon as its inputs exist belongs in a `useQuery` keyed by those inputs, not in a
`useEffect` that dispatches a thunk and mirrors loading, error and race state into `useState`. Query identity
gives request de-duplication, discarding of superseded responses and an `AbortSignal` for free. The
hand-rolled version has to re-earn each of those: miss the request-id guard and a superseded fee estimate
overwrites the current one, miss the loading flag and the spinner never clears
(`useComposeEarnFees.ts:93` and `:96` are both halves of that bookkeeping).

The corollary is that `useMutation` is for imperative, user-triggered writes. Calling `mutate()` from a
`useEffect` says the case was declarative all along, so make it a query and let the effect's guard clause
become `enabled`.

```tsx
// bad - useEthereumCancelTxCompose.ts:115 - a mutation nothing user-triggered ever calls, fired from an
// effect whose deps include the whole `account` object, so it refires after every blockchain update
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

// good - the preconditions become `enabled` and the effect disappears with them; add the new key to the
// factory in suite-common/react-query rather than inlining it here
const { data, isPending: isComposing } = useQuery({
    queryKey: desktopQueryKeys.ethereumCancelTx(account.key, tx.txid),
    queryFn: () => dispatch(composeEthereumCancelTransactionThunk({ account, tx })).unwrap(),
    enabled: account.networkType === 'ethereum' && Boolean(feeInfo),
});
```

Wrapping an existing thunk in `queryFn` is a legitimate and common shape — see
[`useMissingRateTickersQuery`](../../suite-common/wallet-core/src/fiat-rates/useMissingRateTickersQuery.ts) —
so a thunk is not a reason to keep the effect. Keys live in the factories in
[`queryKeys.ts`](../../suite-common/react-query/src/constants/queryKeys.ts) (`commonQueryKeys` for both apps,
`desktopQueryKeys` for `packages/suite`); never inline a `queryKey` array at the call site, because the key
is what two callers have to agree on to share a cache entry.

## Let callers pass `queryOptions` into a shared query hook, and never overwrite them

A query hook in `suite-common` is consumed by both apps, whose needs differ per screen — `enabled`,
`staleTime`, `select`. Accept a caller options object as the second parameter and type it as
`Omit<UseQueryOptions<…>, 'queryKey'>` so no caller can break the query identity. Express the hook's own
condition as a destructuring default, not as an assignment after the spread.

```tsx
// bad - useSolanaRewardsTotal.ts:11 - the caller's `enabled` is spread in and then overwritten, so a
// screen that disabled the query still fires it
return useQuery({
    ...queryOptions,
    enabled: account.symbol === 'sol',
    queryKey: commonQueryKeys.solanaRewardsTotal(account.descriptor),
    queryFn: () => getSolanaRewardsTotal({ routeParams: { address: account.descriptor } }),
});

// good - useEthereumValidatorsQueue.ts:16 - the hook's condition is only the caller's default, and
// `queryKey` is omitted from the options type so no caller can break the cache identity
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

A hook local to `packages/suite` or to a `module-*` package has one consumer and needs no options parameter.

## Call the narrowest query hook for what you render

When a hook exists for the single record a component renders, do not call the list hook and filter
client-side. The wide call sits in code that runs once per row, and every consumer shares the one list cache
key, so any invalidation refetches all `YIELD_OPPORTUNITIES_DEFAULT_LIMIT` (100) records for all of them.
Narrow the shape with the query's `select`, not with a wider fetch.

```tsx
// bad - one badge per token row, each pulling the whole 100-vault list to read one APY, and all of them
// refetching together on any invalidation
const { data: yieldOpportunities } = useAllYieldOpportunities();
const vault = yieldOpportunities?.find(opportunity => opportunity.id === vaultId);

// good - YieldBadge.tsx:52 - one request per vault, cached under its own key
const { data: vault } = useYieldOpportunity(vaultId);
```

The list hook is right when the screen genuinely renders the list; the rule is about a per-item component or
per-item hook reaching for it. `useYourPositionCardYieldBadge.tsx:18` is the case still in the tree.

## Related skills

- [Redux](../redux/SKILL.md) — where a thunk still belongs, and `.unwrap()` inside a `mutationFn`.
- [React hooks](../performance-react-hooks/SKILL.md) — why an effect keyed on a whole `account` object
  refetches unboundedly.
- [Packages](../packages/SKILL.md) — which layer a shared query hook belongs in.
