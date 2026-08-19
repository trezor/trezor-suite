---
name: packages
description: How to create and structure packages in the Trezor Suite monorepo, including scopes, sizing guidance, and moving logic both apps need into suite-common instead of duplicating it. Use when creating new packages, resolving cyclic dependencies, or when the same logic is about to exist in both suite and suite-native.
---

# Packages

## How to create packages

Use command `yarn generate-package @scope/newPackageName`. For example using name `@suite-common/wallet` will create package in `/suite-common` folder. Full list of scopes:

| Scope         | Folder        | Description                                                                                             | Imports from              |
| ------------- | ------------- | ------------------------------------------------------------------------------------------------------- | ------------------------- |
| @trezor       | /packages     | Public packages (Connect, etc...) and Suite web & desktop packages (that shall be moved to @suite soon) | @suite                    |
| @suite-common | /suite-common | code shared between @suite and @suite native                                                            | @trezor                   |
| @suite-native | /suite-native | mobile Suite                                                                                            | @trezor and @suite-common |
| @suite        | /suite        | desktop & web Suite                                                                                     | @trezor and @suite-common |

## Move logic both apps need into suite-common instead of duplicating it

When the same derivation or hook body appears in the web/desktop app and in `suite-native`, move the
platform-agnostic core into the shared layer — into the `@suite-common/*` hook that already returns the raw
data, or into a `@suite-common/*` util — and leave only the platform glue in each app: navigation, native
components, desktop analytics.

Copies drift silently, and the drift is invisible at the copy site. `getPollIntervalMs` was extracted to
[`pollingUtils.ts:5`](../../suite-common/wallet-utils/src/pollingUtils.ts), but `packages/suite` kept two
local re-implementations, so the block-time-to-poll-interval ratio now lives in three places: change the
shared one and mobile plus suite's wrap/unwrap flows move, while suite's Tron-stake and yield pending-tx
screens keep the old value with nothing to indicate it.

```tsx
// bad - the pre-review shape from #28374 - each app re-derives the same value from the same raw query
const { data } = useTronStakingStats();
const maxApr = data?.length ? Math.max(...data.map(({ apr }) => apr)) : null;

// good - useTronStakingStats.ts:17 - the shared hook derives it once and both apps just read it
export function useTronStakingStats(queryOptions?: Partial<UseQueryOptions<TrxStats>>) {
    const stats = useQuery({ staleTime: 5 * 60 * 1000, ...queryOptions, queryKey, queryFn });

    const maxApr = stats.data?.length ? Math.max(...stats.data.map(({ apr }) => apr)) : null;

    return { stats, maxApr };
}
```

If a hook cannot be shared wholesale, extract the pure parts rather than copying the file — the platform
specifics are the reason to split it, not a reason to duplicate it. If nothing platform-agnostic is left, keep
the duplicate and say so in a comment. The direction is one-way and half of it is already enforced:
`local-rules/no-suite-imports-in-suite-common` fails the build if the shared layer reaches back into an app.

## Packages size

Smaller is better.

Big packages usually lead to cyclic dependencies. Imagine this pattern:

1. I have `packageA` which has type `FormInput` and there are multiple forms in this package that need this type
2. I have `packageB` which also has a form that needs to use `FormInput` so you import it from `packageA`
3. Now you want to add this form, alongside others into your main `packageA` but you can't because it will cause cyclic dependency.

Now you have two options how to solve it:

1. You can merge `packageB` into `packageA`, but it will only amplify this cyclic deps issue for other packages. More things you will have in `packageA`, then more often you need to use `packageA` in other packages, but that will prevent you from importing any of that packages back into `packageA` because of cyclic dependency. That will force you to place everything into `packageA` which will grow into a monolith (that's the exact thing that happened in packages/suite).
2. You can create `packageC` which will contain this `FormInput` and both `packageA` and `packageB` can use it.

So creating smaller packages from start is always better, because you have much lower chances to run into issue with cyclic dependencies, but not only that. Smaller packages give you better control of what you will use in other packages, you can run smaller subsets of tests, lints etc which is faster.
