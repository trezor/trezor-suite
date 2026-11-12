# @suite-common/earn

Earn readings that combine staking and yield: the fiat valuations and total of every earn position the selected device holds, the tickers whose rate is missing, the incomplete and unavailable flags of the total, whether the balance breakdown is shown, the positions count, and `useEarnMissingRateTickersQuery`, which fetches the missing rates.

Staking comes from the device selectors of `@suite-common/earn-staking`, which read positions, and yield from the selectors of `@suite-common/wallet-core`. A reading that belongs to one of them stays in its package; this package only composes the two, and never reaches the products, which `forbiddenDeps.config.ts` enforces. Both apps register the staking state as `state.earn.staking`, the `earn` parent that yield will join later.
