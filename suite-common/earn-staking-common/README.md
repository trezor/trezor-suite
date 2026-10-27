# @suite-common/earn-staking-common

Staking contracts shared by the staking packages, the network packages and the apps: providers, product descriptors and product info, positions, plans and steps, platform support, the account data products read and the product adapter. The package depends on zod and `@trezor/*` only, so a network package can implement the adapter and the contracts can move to `@trezor` scope unchanged. `forbiddenDeps.config.ts` enforces the boundary.

## Contracts

Data contracts are Zod schemas with their TypeScript types inferred from them, so every value stored in Redux is plain, serializable data. Their objects are strict: an unknown key is rejected, not stripped. Ids this package owns, such as amounts, provider ids and product ids, use Zod's `.brand()`. Ids owned elsewhere, such as `NetworkSymbol`, are validated against their own branded types. Behavior contracts, such as the product adapter, are plain types. Descriptors are parsed when products are registered; positions and plans are checked through `assertStakingPosition` and `assertStakingPlan`, which run in development and tests only.

Adapters receive a `StakingAccount`: the backend fields of Connect's `AccountInfo` that products read (descriptor, balances, addresses, UTXOs and the network-specific `misc` data) plus the account's symbol, path and account type. The app `Account` is assignable to it as it is, so no mapping is needed, and a network package can implement the adapter against the same shape. `@suite-common/earn-staking` attaches the account key to positions and plans when it stores them.

`@suite-common/earn-staking-common/mocks` holds test factories.
